import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg } from '../../services/api';
import { PageHeader, StatusBadge, Flags, Alert, FileViewer, LoadingSkeleton, CATS, inr, fmtDate, fmtDT, useClaimPaths } from '../../components/ui';

const STAGES = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PAID'];

export default function ClaimDetail() {
  const { id } = useParams();
  const p = useClaimPaths();
  const [c, setC] = useState(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(null);
  useEffect(() => { api.get(`/claims/${id}`).then((r) => setC(r.data)).catch((e) => setErr(errMsg(e))); }, [id]);
  if (err) return <Alert>{err}</Alert>;
  if (!c) return <LoadingSkeleton variant="detail" />;
  const idx = STAGES.indexOf(c.status === 'INFO_REQUESTED' ? 'UNDER_REVIEW' : c.status);

  return (
    <>
      <PageHeader title={c.ticketRef || 'Draft claim'} sub={c.title}>
        {['DRAFT', 'INFO_REQUESTED'].includes(c.status) && <Link className="btn btn-purple" to={p.edit(c.id)}>{c.status === 'DRAFT' ? 'Continue editing' : 'Revise & resubmit'}</Link>}
        <Link className="btn btn-light border" to={p.list}>Back</Link>
      </PageHeader>

      <div className="card mb-3"><div className="card-body">
        <div className="d-flex flex-wrap align-items-center gap-3 mb-3"><StatusBadge s={c.status} /><span className="fs-4 fw-bold">{inr(c.total)}</span><Flags flags={c.flags.filter((f) => ['HIGH_VALUE'].includes(f.code))} /></div>
        {c.status !== 'DRAFT' && c.status !== 'REJECTED' && (
          <div className="d-flex justify-content-between text-center">
            {['Submitted', 'Under review', 'Approved', 'Paid'].map((s, i) => (
              <div key={s} className="flex-fill"><div className={`mx-auto rounded-circle ${i <= idx ? 'bg-success' : 'bg-secondary-subtle'}`} style={{ width: 14, height: 14 }} />
                <div className={`small mt-1 ${i <= idx ? 'fw-semibold' : 'text-muted'}`}>{s}</div></div>))}
          </div>)}
        {c.decisionNote && <div className={`alert mt-3 mb-0 ${c.status === 'REJECTED' ? 'alert-danger' : 'alert-warning'}`}><strong>Finance note:</strong> {c.decisionNote}</div>}
        {c.utr && <div className="alert alert-success mt-3 mb-0"><strong>Paid on {fmtDate(c.paidAt)}</strong> · Bank UTR <code>{c.utr}</code></div>}
      </div></div>

      <div className="row g-3">
        <div className="col-lg-8"><div className="card"><div className="card-header">Expense lines</div>
          <div className="table-responsive"><table className="table align-middle mb-0">
            <thead><tr><th>Date</th><th>Category</th><th>Reason</th><th className="text-end">Amount</th><th>Receipt</th></tr></thead>
            <tbody>{c.lines.map((l) => (
              <tr key={l.id}><td>{fmtDate(l.date)}</td>
                <td>{CATS[l.category]}{l.provider && <div className="small text-muted">{l.provider} · {l.bookingId}</div>}</td>
                <td>{l.reason}</td><td className="text-end">{inr(l.amount)}</td>
                <td>{l.receipt ? <button className="btn btn-sm btn-outline-purple" onClick={() => setOpen(open === l.id ? null : l.id)}>{open === l.id ? 'Hide' : 'View'}</button> : <span className="text-muted small">—</span>}</td></tr>))}
            </tbody></table></div>
          {open && <div className="p-3 border-top"><FileViewer path={`/files/receipts/${c.lines.find((l) => l.id === open).receipt.file}`} /></div>}
        </div></div>
        <div className="col-lg-4"><div className="card"><div className="card-header">Timeline</div><div className="card-body">
          <ul className="timeline mb-0">{c.history.slice().reverse().map((h, i) => (
            <li key={i}><div className="fw-semibold">{h.status.replace('_', ' ')}</div><div className="small">{h.note}</div><div className="small text-muted">{h.by} · {fmtDT(h.at)}</div></li>))}</ul>
        </div></div></div>
      </div>
    </>
  );
}
