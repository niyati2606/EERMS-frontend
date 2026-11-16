import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  const [note, setNote] = useState('');
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
  const release = () => act(async () => { await api.post(`/finance/claims/${id}/release`); nav('/finance/dashboard'); });
  const decide = (decision) => act(async () => { await api.post(`/finance/claims/${id}/decision`, { decision, note }); nav('/finance/dashboard'); });
  const line = c.lines[sel];

  return (
    <>
      <PageHeader title={`Audit ${c.ticketRef}`} sub={`${c.employee.fullName} · ${c.employee.empCode} · ${c.employee.branch}`}>
        {mine && <span className={`badge fs-6 align-self-center ${left === 'expired' ? 'text-bg-danger' : 'text-bg-warning'}`}>🔒 Lock {left}</span>}
        {mine && <button className="btn btn-light border" onClick={release}>Release ticket</button>}
        {!c.lockedBy && ['SUBMITTED', 'UNDER_REVIEW'].includes(c.status) && <button className="btn btn-purple" onClick={assign} disabled={c.employeeId === user.id}>Assign to Me</button>}
      </PageHeader>
      <Alert onClose={() => setErr('')}>{err}</Alert>
      {c.lockedBy && !mine && <Alert type="warning">Locked by {c.lockedByName}. Read-only for you.</Alert>}

      <div className="split">
        <div>
          <div className="card mb-3"><div className="card-body">
            <div className="d-flex flex-wrap gap-2 align-items-center mb-2"><StatusBadge s={c.status} /><span className="fs-4 fw-bold">{inr(c.total)}</span></div>
            <Flags flags={c.flags} />
            <div className="small text-muted mt-2">Bank: {c.employee.bank ? `${c.employee.bank.bankName} · ${c.employee.bank.ifsc} · ${c.employee.bank.account}` : 'none'} {c.employee.bank && <StatusBadge s={c.employee.bank.status} />}</div>
          </div></div>
          <div className="mb-3">
            {c.lines.map((l, i) => (
              <div key={l.id} className={`line-pick ${i === sel ? 'sel' : ''}`} onClick={() => { setSel(i); setZoom(1); }}>
                <div className="d-flex justify-content-between"><strong>{CATS[l.category]}</strong><strong>{inr(l.amount)}</strong></div>
                <div className="small text-muted">{fmtDate(l.date)} · {l.reason}</div>
                {l.provider && <div className="small">Ride: {l.provider} · Booking ID <code>{l.bookingId}</code></div>}
                {l.duplicate && <span className="badge text-bg-danger">Possible duplicate</span>}
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
            <button className="btn btn-light border" onClick={() => setZoom((z) => Math.min(4, z + 0.25))}>+</button></div></div>
          <div className="card-body p-0">{line?.receipt ? <FileViewer path={`/files/receipts/${line.receipt.file}`} zoom={zoom} /> : <div className="p-4 text-muted">No receipt file attached to this line (seed data).</div>}</div>
        </div>
      </div>
    </>
  );
}
