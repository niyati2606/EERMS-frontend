import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../../services/api';
import { PageHeader, StatusBadge, Alert, LoadingSkeleton, inr, fmtDate } from '../../components/ui';

const STATUSES = [
  ['ALL', 'All'],
  ['APPROVED', 'Approved'],
  ['REJECTED', 'Rejected'],
];

const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function ClaimHistory() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [month, setMonth] = useState(currentMonth);
  const [branches, setBranches] = useState([]);
  const [branch, setBranch] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setErr('');
    api.get('/finance/history', { params: { q, month, branch, status } })
      .then(({ data }) => {
        if (live) {
          setRows(data.claims);
          setBranches(data.branches);
        }
      })
      .catch((error) => { if (live) setErr(errMsg(error)); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [q, month, branch, status]);

  return (
    <>
      <PageHeader title="Claim history" sub="Review claims approved or rejected by Finance." />
      <Alert onClose={() => setErr('')}>{err}</Alert>
      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-5">
              <label className="form-label fw-semibold" htmlFor="claim-history-search">Search claims</label>
              <input id="claim-history-search" className="form-control" placeholder="Ticket, employee, or branch" value={q} onChange={(event) => setQ(event.target.value)} />
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold" htmlFor="claim-history-month">Month</label>
              <input id="claim-history-month" type="month" className="form-control" required value={month} onChange={(event) => setMonth(event.target.value || currentMonth())} />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold" htmlFor="claim-history-branch">Branch</label>
              <select id="claim-history-branch" className="form-select" value={branch} onChange={(event) => setBranch(event.target.value)}>
                <option value="ALL">All branches</option>
                {branches.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold" htmlFor="claim-history-status">Status</label>
              <select id="claim-history-status" className="form-select" value={status} onChange={(event) => setStatus(event.target.value)}>
                {STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>
      {loading ? <LoadingSkeleton variant="rows" rows={6} /> : (
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <span>Claims</span><span className="badge text-bg-secondary rounded-pill">{rows.length}</span>
          </div>
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead><tr><th>Ticket</th><th>Employee</th><th>Branch</th><th>Submitted</th><th className="text-end">Amount</th><th>Status</th><th>Feedback</th><th /></tr></thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan="8" className="text-center text-muted py-5">No approved or rejected claims match your filters.</td></tr>}
                {rows.map((claim) => (
                  <tr key={claim.id}>
                    <td className="fw-semibold">{claim.ticketRef || '—'}</td>
                    <td>{claim.employee.fullName}<div className="small text-muted">{claim.employee.empCode}</div></td>
                    <td>{claim.employee.branch}</td>
                    <td>{fmtDate(claim.submittedAt || claim.createdAt)}</td>
                    <td className="text-end">{inr(claim.total)}</td>
                    <td><StatusBadge s={claim.status} /></td>
                    <td><div className="text-truncate" style={{ maxWidth: 260 }} title={claim.decisionNote || ''}>{claim.decisionNote || '—'}</div></td>
                    <td className="text-end"><Link className="btn btn-sm btn-light" to={`/finance/review/${claim.id}`}>View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
