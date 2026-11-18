import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg } from '../../services/api';
import { getHrMeta, resendSetupEmail } from '../../services/hrService';
import { PageHeader, StatusBadge, Alert, LoadingSkeleton } from '../../components/ui';
import FreezeEmployeeModal from '../../components/FreezeEmployeeModal';

const Row = ({ k, v }) => (<div className="mb-2"><div className="small text-uppercase text-muted">{k}</div><div className="fw-semibold">{v || '—'}</div></div>);
const formatDate = (date) => {
  const match = String(date || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : date || '—';
};

export default function EmployeeDetail() {
  const { id } = useParams();
  const [u, setU] = useState(null);
  const [meta, setMeta] = useState(null);
  const [edit, setEdit] = useState(null);
  const [bankEdit, setBankEdit] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [freezeBusy, setFreezeBusy] = useState(false);
  const [bankSaving, setBankSaving] = useState(false);

  const load = () => {
    api.get(`/hr/employees/${id}`).then((r) => setU(r.data)).catch((e) => setErr(errMsg(e)));
  };
  useEffect(() => { load(); getHrMeta().then(setMeta); }, [id]); // eslint-disable-line

  if (err && !u) return <Alert>{err}</Alert>;
  if (!u) return <LoadingSkeleton variant="detail" />;
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
  const startBankEdit = () => setBankEdit({
    accountHolder: b.accountHolder,
    bankName: b.bankName,
    accountNumber: b.accountNumber,
    ifsc: b.ifsc,
  });
  const saveBank = async (event) => {
    event.preventDefault();
    setErr(''); setMsg(''); setBankSaving(true);
    try {
      const { data } = await api.put(`/hr/employees/${id}/bank`, {
        accountHolder: bankEdit.accountHolder.trim(),
        bankName: bankEdit.bankName.trim(),
        accountNumber: bankEdit.accountNumber.trim(),
        ifsc: bankEdit.ifsc.trim().toUpperCase(),
      });
      setU(data);
      setBankEdit(null);
      setMsg('Bank details updated. Verification is pending.');
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBankSaving(false);
    }
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
  const startEdit = () => setEdit({ fullName: u.fullName, email: u.email, phone: u.phone, branch: u.branch, joiningDate: u.joiningDate || '' });
  const e = edit;
  const inp = (k, label, type = 'text') => (<div className="col-md-6"><label className="form-label small fw-semibold">{label}</label><input type={type} className="form-control" required={k === 'email'} value={e[k] || ''} onChange={(x) => setEdit({ ...e, [k]: x.target.value })} /></div>);

  return (
    <>
      <PageHeader title={u.fullName} sub={u.empCode}>
        <Link className="btn btn-light border" to="/hr/employees">← Back</Link>
        {u.status !== 'active' && <button className="btn btn-outline-purple" onClick={resendSetup}>Resend password setup email</button>}
        {!edit && <button className="btn btn-outline-purple" onClick={startEdit}>Edit</button>}
        {u.role !== 'admin' && ['active', 'frozen'].includes(u.status) && (
          <button
            className={`btn ${u.status === 'active' ? 'btn-outline-danger' : 'btn-outline-success'}`}
            onClick={() => u.status === 'active' ? setShowFreezeModal(true) : toggle(false)}
          >
            {u.status === 'active' ? 'Freeze account' : 'Reactivate'}
          </button>
        )}
      </PageHeader>
      <Alert onClose={() => setErr('')}>{err}</Alert><Alert type="success" onClose={() => setMsg('')}>{msg}</Alert>

      <div className="row g-3">
        <div className="col-lg-6"><div className="card h-100"><div className="card-header d-flex justify-content-between">Employee details <StatusBadge s={u.status} /></div><div className="card-body">
          {!edit ? (
            <div className="row">
              <div className="col-12 col-sm-6"><Row k="Full name" v={u.fullName} /><Row k="Employee code" v={u.empCode} /><Row k="Official email" v={u.email} /><Row k="Phone" v={u.phone} /><Row k="Role" v={u.role} /><Row k="Joining date" v={formatDate(u.joiningDate)} /></div>
              <div className="col-12 col-sm-6"><Row k="Branch" v={u.branch} /></div>
            </div>
          ) : (
            <>
              <div className="row g-3">
                {inp('fullName', 'Full name')}{inp('email', 'Official email', 'email')}{inp('phone', 'Phone')}{inp('joiningDate', 'Joining date', 'date')}
                <div className="col-md-6"><label className="form-label small fw-semibold">Branch (office transfer)</label>
                  <select className="form-select" value={e.branch} onChange={(x) => setEdit({ ...e, branch: x.target.value })}>{meta?.branches.map((c) => <option key={c}>{c}</option>)}</select></div>
              </div>
              <div className="mt-3 d-flex gap-2"><button className="btn btn-purple" onClick={save}>Save changes</button><button className="btn btn-light border" onClick={() => setEdit(null)}>Cancel</button></div>
            </>)}
        </div></div></div>

        <div className="col-lg-6"><div className="card h-100"><div className="card-header d-flex justify-content-between align-items-center">
          <span>Payout bank details</span>
          <div className="d-flex align-items-center gap-2">
            {b && <StatusBadge s={b.status} />}
            {b?.status === 'Verified' && !bankEdit && <button className="btn btn-sm btn-outline-purple" type="button" onClick={startBankEdit}>Edit details</button>}
          </div>
        </div><div className="card-body">
          {!b ? <div className="text-muted">No bank details on record.</div> : (
            bankEdit ? (
              <form onSubmit={saveBank}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold" htmlFor="bank-account-holder">Account holder</label>
                    <input id="bank-account-holder" className="form-control" required value={bankEdit.accountHolder} onChange={(event) => setBankEdit({ ...bankEdit, accountHolder: event.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold" htmlFor="bank-name">Bank name</label>
                    <input id="bank-name" className="form-control" required value={bankEdit.bankName} onChange={(event) => setBankEdit({ ...bankEdit, bankName: event.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold" htmlFor="bank-account-number">Account number</label>
                    <input id="bank-account-number" className="form-control" type="text" inputMode="numeric" pattern="[0-9]{9,18}" maxLength={18} required value={bankEdit.accountNumber} onChange={(event) => setBankEdit({ ...bankEdit, accountNumber: event.target.value.replace(/\D/g, '') })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold" htmlFor="bank-ifsc">IFSC code</label>
                    <input id="bank-ifsc" className="form-control text-uppercase" type="text" pattern="[A-Za-z]{4}0[A-Za-z0-9]{6}" maxLength={11} required value={bankEdit.ifsc} onChange={(event) => setBankEdit({ ...bankEdit, ifsc: event.target.value.toUpperCase() })} />
                  </div>
                </div>
                <div className="alert alert-warning mt-3 mb-3">Saving changes will reset bank verification to Pending.</div>
                <div className="d-flex gap-2">
                  <button className="btn btn-purple" type="submit" disabled={bankSaving}>{bankSaving ? 'Saving…' : 'Save bank details'}</button>
                  <button className="btn btn-light border" type="button" onClick={() => setBankEdit(null)} disabled={bankSaving}>Cancel</button>
                </div>
              </form>
            ) : (
            <>
              <div className="row"><div className="col-12 col-sm-6"><Row k="Account holder" v={b.accountHolder} /><Row k="Bank" v={b.bankName} /></div>
                <div className="col-12 col-sm-6"><Row k="Account number" v={b.accountNumber} /><Row k="IFSC" v={b.ifsc} /></div></div>
              {b.rejectReason && <Alert type="warning">Rejected: {b.rejectReason}</Alert>}
              <div className="d-flex gap-2 flex-wrap">
                {b.status !== 'Verified' && <Link className="btn btn-sm btn-purple" to="/hr/bank-verification">Go to verification</Link>}
              </div>
            </>)
          )}
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
