import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { PageHeader, StatusBadge, Stat, Hero, inr, fmtDate, useClaimPaths } from '../../components/ui';

export default function EmployeeDashboard() {
  const [claims, setClaims] = useState(null);
  const p = useClaimPaths();
  const load = () => api.get('/claims').then((r) => setClaims(r.data));
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, []);
  if (!claims) return <div className="text-muted">Loading…</div>;
  const sum = (f) => claims.filter(f).reduce((s, c) => s + c.total, 0);
  const revision = claims.filter((c) => c.status === 'INFO_REQUESTED');

  return (
    <>
      <Hero eyebrow="Your claims at a glance" chips={claims.filter((c) => c.status !== 'DRAFT').slice(0, 3).map((c) => ({ title: `${c.ticketRef} · ${inr(c.total)}`, sub: c.status.replace('_', ' ').toLowerCase(), avatar: c.title }))}>
        <b>{claims.filter((c) => ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(c.status)).length} claims</b> in progress. <b>{revision.length}</b> need your action.
      </Hero>
      <PageHeader title="My claims" sub="Track every claim from submission to payment" actionsClassName="employee-dashboard-header-actions">
        <Link className="btn btn-purple" to={p.add}>New claim</Link>
      </PageHeader>
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3"><Stat label="In progress" value={claims.filter((c) => ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(c.status)).length} /></div>
        <div className="col-6 col-lg-3"><Stat label="Needs your action" value={revision.length} tone="coral" sub="Revision worklist" /></div>
        <div className="col-6 col-lg-3"><Stat label="Pending amount" value={inr(sum((c) => ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'INFO_REQUESTED'].includes(c.status)))} /></div>
        <div className="col-6 col-lg-3"><Stat label="Reimbursed" value={inr(sum((c) => c.status === 'PAID'))} tone="success" /></div>
      </div>
      {revision.length > 0 && (
        <div className="alert alert-warning"><strong>Revision worklist:</strong> Finance asked for more information on {revision.map((c) => (
          <Link key={c.id} className="ms-2" to={p.edit(c.id)}>{c.ticketRef}</Link>))}</div>
      )}
      <div className="card"><div className="table-responsive">
        <table className="table align-middle mb-0 employee-claims-table">
          <thead><tr><th>Ticket</th><th>Title</th><th>Created</th><th className="text-end">Amount</th><th>Status</th><th /></tr></thead>
          <tbody>
            {claims.length === 0 && <tr><td colSpan="6" className="text-center text-muted py-4">No claims yet. Create your first claim.</td></tr>}
            {claims.map((c) => (
              <tr key={c.id}>
                <td className="fw-semibold" data-label="Ticket">{c.ticketRef || 'Draft'}</td>
                <td data-label="Title">{c.title}</td>
                <td data-label="Created">{fmtDate(c.createdAt)}</td>
                <td className="text-end" data-label="Amount">{inr(c.total)}</td>
                <td data-label="Status"><StatusBadge s={c.status} /></td>
                <td className="text-end" data-label="Actions">
                  <div className="d-flex justify-content-end gap-2">
                    {['DRAFT', 'INFO_REQUESTED'].includes(c.status) && <Link className="btn btn-sm btn-outline-purple" to={p.edit(c.id)}>{c.status === 'DRAFT' ? 'Continue' : 'Revise'}</Link>}
                    <Link className="btn btn-sm btn-light" to={p.detail(c.id)}>View</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div></div>
    </>
  );
}
