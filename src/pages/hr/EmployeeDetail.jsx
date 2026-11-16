import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg } from '../../services/api';
import { getHrMeta, resendSetupEmail } from '../../services/hrService';
import { PageHeader, StatusBadge, Alert, FileViewer, fmtDate } from '../../components/ui';
import FreezeEmployeeModal from '../../components/FreezeEmployeeModal';

const Row = ({ k, v }) => (<div className="mb-2"><div className="small text-uppercase text-muted">{k}</div><div className="fw-semibold">{v || '—'}</div></div>);

export default function EmployeeDetail() {
  const { id } = useParams();
  const [u, setU] = useState(null);
  const [meta, setMeta] = useState(null);
  const [edit, setEdit] = useState(null);
  const [showCheque, setShowCheque] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [freezeBusy, setFreezeBusy] = useState(false);

  const load = () => {
    api.get(`/hr/employees/${id}`).then((r) => setU(r.data)).catch((e) => setErr(errMsg(e)));
  };
  useEffect(() => { load(); getHrMeta().then(setMeta); }, [id]); // eslint-disable-line

  if (err && !u) return <Alert>{err}</Alert>;
  if (!u) return <div className="text-muted">Loading…</div>;
  const b = u.bank;

  const resendSetup = async () => {
    setErr(''); setMsg('');
    try {
      const res = await resendSetupEmail(u.id);
      setMsg(res.message || 'Password setup email sent successfully.');
    } catch (e) { setErr(errMsg(e)); }
  };

  const save = async () => {
    setErr(''); setMsg('');
    try { const { data } = await api.put(`/hr/employees/${id}`, edit); setU(data); setEdit(null); setMsg('Employee updated.'); } catch (e) { setErr(errMsg(e)); }
  };
  const toggle = async (freeze, reason = '') => {
    setErr('');
    if (freeze) setFreezeBusy(true);
    try {
      const { data } = await api.post(`/hr/employees/${id}/freeze`, { freeze, reason });
      setU(data.employee);
      setMsg(freeze ? `Employee frozen. ${data.unsettledClaims} unsettled claim(s) – payouts blocked.` : 'Reactivated.');
      setShowFreezeModal(false);
    } catch (e) { setErr(errMsg(e)); }
    finally { if (freeze) setFreezeBusy(false); }
  };
  const startEdit = () => setEdit({ fullName: u.fullName, phone: u.phone, branch: u.branch });
  const e = edit;
  const inp = (k, label) => (<div className="col-md-6"><label className="form-label small fw-semibold">{label}</label><input className="form-control" value={e[k] || ''} onChange={(x) => setEdit({ ...e, [k]: x.target.value })} /></div>);

  return (
    <>
      <PageHeader title={u.fullName} sub={u.empCode}>
        <Link className="btn btn-light border" to="/hr/employees">← Back</Link>
        {u.status !== 'active' && <button className="btn btn-outline-purple" onClick={resendSetup}>Resend setup email</button>}
        {!edit && <button className="btn btn-outline-purple" onClick={startEdit}>Edit</button>}
        {u.role !== 'admin' && <button className={`btn ${u.status === 'active' ? 'btn-outline-danger' : 'btn-outline-success'}`} onClick={() => u.status === 'active' ? setShowFreezeModal(true) : toggle(false)}>{u.status === 'active' ? 'Freeze account' : 'Reactivate'}</button>}
      </PageHeader>
      <Alert onClose={() => setErr('')}>{err}</Alert><Alert type="success" onClose={() => setMsg('')}>{msg}</Alert>

      <div className="row g-3">
        <div className="col-lg-6"><div className="card h-100"><div className="card-header d-flex justify-content-between">Employee details <StatusBadge s={u.status} /></div><div className="card-body">
          {!edit ? (
            <div className="row">
              <div className="col-6"><Row k="Employee code" v={u.empCode} /><Row k="Official email" v={u.email} /><Row k="Phone" v={u.phone} /><Row k="Date of joining" v={fmtDate(u.joiningDate)} /><Row k="Role" v={u.role} /></div>
              <div className="col-6"><Row k="Branch" v={u.branch} /></div>
            </div>
          ) : (
            <>
              <div className="row g-3">
                {inp('fullName', 'Full name')}{inp('phone', 'Phone')}
                <div className="col-md-6"><label className="form-label small fw-semibold">Branch (office transfer)</label>
                  <select className="form-select" value={e.branch} onChange={(x) => setEdit({ ...e, branch: x.target.value })}>{meta?.branches.map((c) => <option key={c}>{c}</option>)}</select></div>
              </div>
              <div className="mt-3 d-flex gap-2"><button className="btn btn-purple" onClick={save}>Save changes</button><button className="btn btn-light border" onClick={() => setEdit(null)}>Cancel</button></div>
            </>)}
        </div></div></div>

        <div className="col-lg-6"><div className="card h-100"><div className="card-header d-flex justify-content-between">Payout bank details {b && <StatusBadge s={b.status} />}</div><div className="card-body">
          {!b ? <div className="text-muted">No bank details on record.</div> : (
            <>
              <div className="row"><div className="col-6"><Row k="Account holder" v={b.accountHolder} /><Row k="Bank" v={b.bankName} /></div>
                <div className="col-6"><Row k="Account number" v={b.accountNumber} /><Row k="IFSC" v={b.ifsc} /></div></div>
              <Row k="Cancelled cheque" v={b.chequeFileName ? `${b.chequeFileName} (${(b.chequeFileSize / 1024).toFixed(0)} KB)` : 'Not uploaded'} />
              <div className="small mb-2">Bank details checklist: <strong>{(b.ctsAuditChecks.length === 7 ? [b.ctsAuditChecks[3], b.ctsAuditChecks[4], b.ctsAuditChecks[5]] : b.ctsAuditChecks.slice(0, 3)).filter(Boolean).length}/3</strong> checked</div>
              {b.rejectReason && <Alert type="warning">Rejected: {b.rejectReason}</Alert>}
              <div className="d-flex gap-2 flex-wrap">
                {b.chequeFilePath && <button className="btn btn-sm btn-outline-purple" onClick={() => setShowCheque(!showCheque)}>{showCheque ? 'Hide cheque' : 'View cheque'}</button>}
                {b.status !== 'Verified' && <Link className="btn btn-sm btn-purple" to="/hr/bank-verification">Go to verification</Link>}
              </div>
              {showCheque && <div className="border rounded mt-3"><FileViewer path={`/hr/bank/${u.id}/cheque`} /></div>}
            </>)}
        </div></div></div>
      </div>
      <FreezeEmployeeModal
        employee={showFreezeModal ? u : null}
        busy={freezeBusy}
        error={err}
        onClose={() => { setShowFreezeModal(false); setErr(''); }}
        onConfirm={(reason) => toggle(true, reason)}
      />
    </>
  );
}
