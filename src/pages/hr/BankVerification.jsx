import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../../services/api';
import { PageHeader, StatusBadge, Alert, LoadingSkeleton } from '../../components/ui';

const CHECKLIST_ITEMS = [
  'Account holder name matches',
  'Account number matches',
  'IFSC matches',
];
const normalizeChecklist = (value) => (
  Array.isArray(value) && value.length === CHECKLIST_ITEMS.length && CHECKLIST_ITEMS.every((_, index) => typeof value[index] === 'boolean')
    ? value
    : [false, false, false]
);

export default function BankVerification() {
  const nav = useNavigate();
  const [filter, setFilter] = useState('Pending');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(null);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const { data } = await api.get('/hr/bank-verifications', { params: { status: filter || undefined } });
      setRows(data);
    } catch (e) {
      setRows([]);
      setErr(errMsg(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { setSel(null); load(); }, [filter]); // eslint-disable-line
  const open = (r) => {
    setSel({ ...r, verificationChecklist: normalizeChecklist(r.verificationChecklist) });
    setReason(''); setErr('');
  };
  const toggleChecklist = (index, checked) => {
    const verificationChecklist = [...sel.verificationChecklist];
    verificationChecklist[index] = checked;
    setSel({ ...sel, verificationChecklist });
  };

  const decide = async (decision) => {
    setErr('');
    try {
      await api.post(`/hr/bank/${sel.userId}/decision`, { decision, reason, verificationChecklist: sel.verificationChecklist });
      if (decision === 'approve') {
        nav(`/hr/employees/${sel.userId}`);
        return;
      }
      if (decision === 'reject') {
        nav(`/hr/employees/${sel.userId}`);
        return;
      }
    } catch (e) { setErr(errMsg(e)); }
  };

  return (
    <>
      <PageHeader title="Bank verification" sub="Review employee bank details before payouts are enabled" />
      <ul className="nav nav-pills mb-3">{['Pending', 'Verified', 'Rejected', ''].map((k) => (
        <li key={k} className="nav-item"><button className="nav-link" style={filter === k ? { background: '#6d4ae0', color: '#fff' } : { color: '#6d4ae0' }} onClick={() => setFilter(k)}>{k || 'All'}</button></li>))}</ul>
      <Alert onClose={() => setErr('')}>{err}</Alert>
      {loading ? (
        <LoadingSkeleton variant="rows" rows={5} />
      ) : rows.length === 0 && err ? (
        <div className="card"><div className="card-body text-center py-5">
          <h2 className="h6 fw-bold mb-1">Could not load bank verifications</h2>
          <p className="text-muted mb-0">Please try again.</p>
        </div></div>
      ) : rows.length === 0 ? (
        <div className="card"><div className="card-body text-center py-5">
          <h2 className="h6 fw-bold mb-1">No employees to display</h2>
          <p className="text-muted mb-0">There are no bank verification records in this queue.</p>
        </div></div>
      ) : (
      <div className="row g-3">
        <div className="col-lg-4"><div className="card"><div className="card-body p-2">
          {rows.map((r) => (
            <button key={r.userId} className={`list-group-item list-group-item-action bank-verification-row mb-2 ${sel?.userId === r.userId ? 'active' : ''}`} onClick={() => open(r)}>
              <div className="d-flex justify-content-between align-items-center gap-2"><strong>{r.employee?.fullName}</strong><StatusBadge s={r.status} /></div>
              <small>{r.employee?.empCode} · {r.bankName}</small></button>))}
        </div></div></div>

        <div className="col-lg-8">
          {!sel ? <div className="card bank-verification-placeholder"><div className="card-body text-muted d-flex align-items-center">Select an employee to review their bank details.</div></div> : (
            <div className="card"><div className="card-body">
              <div className="d-flex justify-content-between"><h2 className="h5 fw-bold">{sel.employee?.fullName} <small className="text-muted">{sel.employee?.empCode}</small></h2><StatusBadge s={sel.status} /></div>
              {sel.rejectReason && <Alert type="warning">Previously rejected: {sel.rejectReason}</Alert>}
              <div className="row g-3">
                <div className="col-md-6">
                  <dl className="mb-3 small">
                    <dt>Account holder</dt><dd>{sel.accountHolder}</dd><dt>Bank · IFSC</dt><dd>{sel.bankName} · {sel.ifsc}</dd>
                    <dt>Account number</dt><dd>{sel.accountNumber}</dd>
                  </dl>
                </div>
              </div>
              <div className="mb-3">
                <div className="fw-semibold mb-2">Bank details checklist ({sel.verificationChecklist.filter(Boolean).length}/{CHECKLIST_ITEMS.length})</div>
                {CHECKLIST_ITEMS.map((item, index) => (
                  <label key={item} className="d-flex align-items-center gap-2 border rounded-4 p-3 mb-2">
                    <input
                      className="form-check-input m-0"
                      type="checkbox"
                      checked={Boolean(sel.verificationChecklist[index])}
                      disabled={sel.status === 'Verified'}
                      onChange={(event) => toggleChecklist(index, event.target.checked)}
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
              <hr />
              {sel.status !== 'Verified' && (
                <>
                  <textarea className="form-control mb-2" rows="2" placeholder="Rejection reason (required to reject)" value={reason} onChange={(e) => setReason(e.target.value)} />
                  <div className="d-flex gap-2 flex-wrap">
                    <button className="btn btn-success" onClick={() => decide('approve')} disabled={sel.verificationChecklist.filter(Boolean).length !== CHECKLIST_ITEMS.length}>Approve &amp; verify</button>
                    <button className="btn btn-danger" onClick={() => decide('reject')}>Reject</button>
                  </div>
                </>
              )}
            </div></div>)}
        </div>
      </div>
      )}
    </>
  );
}
