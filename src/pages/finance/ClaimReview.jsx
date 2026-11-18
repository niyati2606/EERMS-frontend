import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiRotateCw } from 'react-icons/fi';
import api, { errMsg } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, StatusBadge, Flags, Alert, FileViewer, CATS, inr, fmtDate } from '../../components/ui';

export default function ClaimReview() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [c, setC] = useState(null);
  const [sel, setSel] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [note, setNote] = useState('');
  const [handoffNote, setHandoffNote] = useState('');
  const [err, setErr] = useState('');
  const [left, setLeft] = useState('');

  const load = () => api.get(`/finance/claims/${id}`).then((r) => setC(r.data)).catch((e) => setErr(errMsg(e)));
  useEffect(() => { load(); }, [id]); // eslint-disable-line

  const mine = c && c.lockedBy === user.id;
  useEffect(() => {
    if (!mine) { setLeft(''); return undefined; }
    const t = setInterval(() => {
      const ms = new Date(c.lockExpires) - Date.now();
      setLeft(ms <= 0 ? 'expired' : `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(t);
  }, [mine, c]);

  if (err && !c) return <Alert>{err}</Alert>;
  if (!c) return <div className="text-muted">Loading…</div>;

  const act = async (fn) => { setErr(''); try { await fn(); } catch (e) { setErr(errMsg(e)); } };
  const assign = () => act(async () => setC((await api.post(`/finance/claims/${id}/assign`)).data));
  const release = () => act(async () => {
    if (!handoffNote.trim()) { setErr('A handoff remark is required to release this claim.'); return; }
    await api.post(`/finance/claims/${id}/release`, { note: handoffNote });
    nav('/finance/dashboard');
  });
  const decide = (decision) => act(async () => { await api.post(`/finance/claims/${id}/decision`, { decision, note }); nav('/finance/dashboard'); });
  const line = c.lines[sel];
  const handoffs = (c.history || []).filter((entry) => entry.note?.startsWith('Released for handoff:')).slice(-3).reverse();

  return (
    <>
      <PageHeader title={`Audit ${c.ticketRef}`} sub={`${c.employee.fullName} · ${c.employee.empCode} · ${c.employee.branch}`}>
        {mine && <span className={`badge fs-6 align-self-center ${left === 'expired' ? 'text-bg-danger' : 'text-bg-warning'}`}>🔒 Lock {left}</span>}
        {mine && <button className="btn btn-light border" onClick={release} disabled={!handoffNote.trim()}>Release ticket</button>}
        {!c.lockedBy && ['SUBMITTED', 'UNDER_REVIEW'].includes(c.status) && <button className="btn btn-purple" onClick={assign} disabled={c.employeeId === user.id}>Assign to Me</button>}
      </PageHeader>
      {mine && (
        <div className="card mb-3"><div className="card-body">
          <label className="form-label fw-semibold" htmlFor="handoff-note">Handoff remark (required to release)</label>
          <textarea id="handoff-note" className="form-control" rows="2" maxLength={500} value={handoffNote} onChange={(e) => setHandoffNote(e.target.value)} />
        </div></div>
      )}
      <Alert onClose={() => setErr('')}>{err}</Alert>
      {c.lockedBy && !mine && <Alert type="warning">Locked by {c.lockedByName}. Read-only for you.</Alert>}

      <div className="split">
        <div>
          <div className="card mb-3"><div className="card-body">
            <div className="d-flex flex-wrap gap-2 align-items-center mb-2"><StatusBadge s={c.status} /><span className="fs-4 fw-bold">{inr(c.total)}</span></div>
            <Flags flags={c.flags} />
            {c.flags.some((flag) => flag.code === 'DUPLICATE') && <div className="alert alert-warning py-2 mt-2 mb-0">Possible duplicate: a matching employee, date, amount, and category was submitted within the past 12 months.</div>}
            {c.flags.some((flag) => flag.code === 'RECEIPT_DUPLICATE') && <div className="alert alert-danger py-2 mt-2 mb-0">High-severity alert: an identical receipt file appears in another submission.</div>}
            <div className="small text-muted mt-2">
              Tax calculation: {c.policyCalculation.gstRate}% GST · taxable {inr(c.policyCalculation.taxableAmount)} · GST {inr(c.policyCalculation.gstAmount)}
              {' · '}Road rate {inr(c.policyCalculation.mileagePerKm)}/km
            </div>
            <div className="small text-muted mt-2">Bank: {c.employee.bank ? `${c.employee.bank.bankName} · ${c.employee.bank.ifsc} · ${c.employee.bank.account}` : 'none'} {c.employee.bank && <StatusBadge s={c.employee.bank.status} />}</div>
          </div></div>
          {handoffs.length > 0 && <div className="alert alert-info py-2">{handoffs.map((entry, index) => <div key={`${entry.at}-${index}`}><strong>Handoff:</strong> {entry.note.replace('Released for handoff: ', '')}</div>)}</div>}
          <div className="mb-3">
            {c.lines.map((l, i) => (
              <div key={l.id} className={`line-pick ${i === sel ? 'sel' : ''}`} onClick={() => { setSel(i); setZoom(1); setRotation(0); }}>
                <div className="d-flex justify-content-between"><strong>{CATS[l.category]}</strong><strong>{inr(l.amount)}</strong></div>
                <div className="small text-muted">{fmtDate(l.date)} · {l.reason}</div>
                {l.provider && <div className="small">Ride: {l.provider} · Booking ID <code>{l.bookingId}</code></div>}
                {l.distanceKm && <div className="small">Distance {l.distanceKm} km · policy cap {inr(l.mileageLimit)} at {inr(c.policyCalculation.mileagePerKm)}/km</div>}
                <div className="small text-muted">Taxable {inr(l.taxableAmount)} · GST {inr(l.gstAmount)} ({c.policyCalculation.gstRate}%)</div>
                {l.duplicate && <span className="badge text-bg-warning">Possible duplicate (12-month match)</span>}
                {l.receiptDuplicate && <span className="badge text-bg-danger">Duplicate receipt file · high severity</span>}
                {l.receipt && <div className="small text-muted text-truncate">SHA-256 {l.receipt.hash.slice(0, 16)}…</div>}
              </div>))}
          </div>
          {mine && (
            <div className="card"><div className="card-header">Decision</div><div className="card-body">
              <textarea className="form-control mb-3" rows="3" placeholder="Written note (mandatory for Request Info / Reject)" value={note} onChange={(e) => setNote(e.target.value)} />
              <div className="d-flex gap-2 flex-wrap">
                <button className="btn btn-success" onClick={() => decide('approve')}>Approve</button>
                <button className="btn btn-warning" onClick={() => decide('info')}>Request info</button>
                <button className="btn btn-danger" onClick={() => decide('reject')}>Reject</button>
              </div></div></div>)}
        </div>

        <div className="card"><div className="card-header d-flex justify-content-between align-items-center">
          <span>Receipt {line?.receipt ? `· ${line.receipt.name}` : ''}</span>
          <div className="btn-group btn-group-sm"><button className="btn btn-light border" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}>−</button>
            <button className="btn btn-light border" onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button>
            <button className="btn btn-light border" onClick={() => setZoom((z) => Math.min(4, z + 0.25))}>+</button>
            <button className="btn btn-light border" aria-label="Rotate receipt 90 degrees" title="Rotate 90°" onClick={() => setRotation((value) => (value + 90) % 360)}><FiRotateCw /></button></div></div>
          <div className="card-body p-0">{line?.receipt ? <FileViewer path={`/files/receipts/${line.receipt.file}`} zoom={zoom} rotation={rotation} /> : <div className="p-4 text-muted">No receipt file attached to this line (seed data).</div>}</div>
        </div>
      </div>
    </>
  );
}
