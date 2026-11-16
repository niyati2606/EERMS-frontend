import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../../services/api';
import { PageHeader, StatusBadge, Alert } from '../../components/ui';

const LABELS = ['Account holder name matches', 'Account number matches', 'IFSC matches'];
const getChecks = (checks = []) => checks.length === 7 ? [checks[3], checks[4], checks[5]] : LABELS.map((_, i) => checks[i] === true);

export default function BankVerification() {
  const nav = useNavigate();
  const [filter, setFilter] = useState('Pending');
  const [rows, setRows] = useState([]);
  const [sel, setSel] = useState(null);
  const [checks, setChecks] = useState(Array(LABELS.length).fill(false));
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = () => api.get('/hr/bank-verifications', { params: { status: filter || undefined } }).then((r) => setRows(r.data));
  useEffect(() => { load(); setSel(null); }, [filter]); // eslint-disable-line
  const open = (r) => { setSel(r); setChecks(getChecks(r.ctsAuditChecks)); setReason(''); setErr(''); setMsg(''); };

  const decide = async (decision) => {
    setErr(''); setMsg('');
    try {
      const { data } = await api.post(`/hr/bank/${sel.userId}/decision`, { decision, checks, reason });
      if (decision === 'approve') {
        nav('/hr/dashboard', { state: { notice: `Bank details for ${sel.employee?.fullName || 'employee'} verified successfully.` } });
        return;
      }
      setMsg(decision === 'reject' ? 'Bank details rejected.' : 'Audit checklist saved.');
      setSel({ ...sel, ...data }); load();
    } catch (e) { setErr(errMsg(e)); }
  };

  const allTicked = checks.every(Boolean);
  return (
    <>
      <PageHeader title="Bank verification" sub="Audit the CTS-2010 cancelled cheque before payouts are enabled" />
      <ul className="nav nav-pills mb-3">{['Pending', 'Verified', 'Rejected', ''].map((k) => (
        <li key={k} className="nav-item"><button className="nav-link" style={filter === k ? { background: '#6d4ae0', color: '#fff' } : { color: '#6d4ae0' }} onClick={() => setFilter(k)}>{k || 'All'}</button></li>))}</ul>
      <div className="row g-3">
        <div className="col-lg-4"><div className="card"><div className="list-group list-group-flush">
          {rows.length === 0 && <div className="list-group-item text-muted">Nothing in this queue</div>}
          {rows.map((r) => (
            <button key={r.userId} className={`list-group-item list-group-item-action ${sel?.userId === r.userId ? 'active' : ''}`} style={sel?.userId === r.userId ? { background: '#6d4ae0', borderColor: '#6d4ae0' } : {}} onClick={() => open(r)}>
              <div className="d-flex justify-content-between"><strong>{r.employee?.fullName}</strong><StatusBadge s={r.status} /></div>
              <small>{r.employee?.empCode} · {r.bankName} · {getChecks(r.ctsAuditChecks).filter(Boolean).length}/{LABELS.length} checked</small></button>))}
        </div></div></div>

        <div className="col-lg-8">
          {!sel ? <div className="card"><div className="card-body text-muted">Select an employee to review their cheque.</div></div> : (
            <div className="card"><div className="card-body">
              <div className="d-flex justify-content-between"><h2 className="h5 fw-bold">{sel.employee?.fullName} <small className="text-muted">{sel.employee?.empCode}</small></h2><StatusBadge s={sel.status} /></div>
              <Alert onClose={() => setErr('')}>{err}</Alert><Alert type="success" onClose={() => setMsg('')}>{msg}</Alert>
              {sel.rejectReason && <Alert type="warning">Previously rejected: {sel.rejectReason}</Alert>}
              <div className="row g-3">
                <div className="col-md-6">
                  <dl className="mb-3 small">
                    <dt>Account holder</dt><dd>{sel.accountHolder}</dd><dt>Bank · IFSC</dt><dd>{sel.bankName} · {sel.ifsc}</dd>
                    <dt>Account number</dt><dd>{sel.accountNumber}</dd>
                  </dl>
                  <h3 className="h6 fw-bold">Bank details checklist ({checks.filter(Boolean).length}/{LABELS.length})</h3>
                  {LABELS.map((l, i) => (
                    <label key={l} className={`audit-item d-flex gap-2 ${checks[i] ? 'on' : ''}`}>
                      <input type="checkbox" className="form-check-input" checked={checks[i]} onChange={() => setChecks(checks.map((c, j) => (j === i ? !c : c)))} />{l}</label>))}
                </div>
              </div>
              <hr />
              <textarea className="form-control mb-2" rows="2" placeholder="Rejection reason (required to reject)" value={reason} onChange={(e) => setReason(e.target.value)} />
              <div className="d-flex gap-2 flex-wrap">
                <button className="btn btn-success" disabled={!allTicked} onClick={() => decide('approve')} title={!allTicked ? 'Tick all 3 items to approve' : ''}>Approve &amp; verify</button>
                <button className="btn btn-danger" onClick={() => decide('reject')}>Reject</button>
                <button className="btn btn-light border" onClick={() => decide('save')}>Save checklist</button>
              </div>
            </div></div>)}
        </div>
      </div>
    </>
  );
}
