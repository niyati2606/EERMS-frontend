import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiTrash2, FiPlus } from 'react-icons/fi';
import api, { errMsg, errList } from '../../services/api';
import { PageHeader, Alert, CATS, inr, useClaimPaths } from '../../components/ui';

const MAX = 200 * 1024;
const blank = () => ({ key: Math.random().toString(36).slice(2), id: null, date: '', category: 'MEALS', amount: '', reason: '', provider: '', bookingId: '', file: null, existing: null });

export default function NewClaim() {
  const { id } = useParams();
  const nav = useNavigate();
  const p = useClaimPaths();
  const [title, setTitle] = useState('');
  const [lines, setLines] = useState([blank()]);
  const [err, setErr] = useState('');
  const [errors, setErrors] = useState(null);
  const [busy, setBusy] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!id) return;
    api.get(`/claims/${id}`).then(({ data }) => {
      setTitle(data.title);
      if (data.decisionNote && data.status === 'INFO_REQUESTED') setErr(`Finance feedback: ${data.decisionNote}`);
      setLines(data.lines.map((l) => ({ ...blank(), id: l.id, date: l.date, category: l.category, amount: l.amount, reason: l.reason, provider: l.provider || '', bookingId: l.bookingId || '', existing: l.receipt })));
    }).catch((e) => setErr(errMsg(e)));
  }, [id]);

  const set = (i, patch) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const pick = (i, f) => {
    if (!f) return set(i, { file: null });
    if (!/\.(pdf|jpe?g|png)$/i.test(f.name)) { setErr('Receipts must be PDF, JPG or PNG'); return null; }
    if (f.size > MAX) { setErr(`"${f.name}" is ${(f.size / 1024).toFixed(0)} KB. Receipts must be under 200 KB.`); return null; }
    setErr(''); return set(i, { file: f });
  };

  const send = async (submit) => {
    setErr(''); setErrors(null); setBusy(true);
    const fd = new FormData();
    fd.append('payload', JSON.stringify({
      title: title || 'Expense claim', submit,
      lines: lines.map((l) => ({ id: l.id, date: l.date, category: l.category, amount: Number(l.amount), reason: l.reason, provider: l.provider, bookingId: l.bookingId })),
    }));
    lines.forEach((l, i) => l.file && fd.append(`receipt_${i}`, l.file));
    try {
      const { data } = id ? await api.put(`/claims/${id}`, fd) : await api.post('/claims', fd);
      nav(submit ? p.detail(data.id) : p.list);
    } catch (e) { setErr(errMsg(e)); setErrors(errList(e)); } finally { setBusy(false); }
  };

  const total = lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);

  return (
    <>
      <PageHeader title={id ? 'Edit / resubmit claim' : 'New expense claim'} sub="Amounts in ₹ · every line needs a receipt (PDF/JPG/PNG, under 200 KB)" />
      <Alert onClose={() => setErr('')}>{err}</Alert>
      {errors && <Alert><ul className="mb-0">{errors.map((x) => <li key={x}>{x}</li>)}</ul></Alert>}
      <div className="card mb-3"><div className="card-body">
        <label className="form-label fw-semibold">Claim title</label>
        <input className="form-control" placeholder="e.g. Client workshop – Pune" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
      </div></div>

      {lines.map((l, i) => (
        <div className="card mb-3" key={l.key}><div className="card-body">
          <div className="d-flex justify-content-between mb-2"><strong>Line {i + 1}</strong>
            {lines.length > 1 && <button className="btn btn-sm btn-light text-danger" onClick={() => setLines(lines.filter((_, j) => j !== i))}><FiTrash2 /></button>}</div>
          <div className="row g-3">
            <div className="col-md-3"><label className="form-label small fw-semibold">Date</label>
              <input type="date" max={today} className="form-control" value={l.date} onChange={(e) => set(i, { date: e.target.value })} /></div>
            <div className="col-md-5"><label className="form-label small fw-semibold">Category</label>
              <select className="form-select" value={l.category} onChange={(e) => set(i, { category: e.target.value })}>
                {Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v}{k === 'ROAD' ? ' (Ola / Uber / Rapido only)' : ''}</option>)}</select></div>
            <div className="col-md-4"><label className="form-label small fw-semibold">Amount (₹)</label>
              <input type="number" min="1" step="0.01" className="form-control" value={l.amount} onChange={(e) => set(i, { amount: e.target.value })} /></div>
            {l.category === 'ROAD' && (<>
              <div className="col-md-4"><label className="form-label small fw-semibold">Ride provider</label>
                <select className="form-select" value={l.provider} onChange={(e) => set(i, { provider: e.target.value })}>
                  <option value="">Select…</option><option>Ola</option><option>Uber</option><option>Rapido</option></select></div>
              <div className="col-md-4"><label className="form-label small fw-semibold">Trip / Booking ID</label>
                <input className="form-control" value={l.bookingId} onChange={(e) => set(i, { bookingId: e.target.value })} /></div>
            </>)}
            <div className={l.category === 'ROAD' ? 'col-md-4' : 'col-md-6'}><label className="form-label small fw-semibold">Business reason</label>
              <input className="form-control" value={l.reason} onChange={(e) => set(i, { reason: e.target.value })} /></div>
            <div className={l.category === 'ROAD' ? 'col-12' : 'col-md-6'}><label className="form-label small fw-semibold">Receipt *</label>
              <input type="file" className="form-control" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => { if (pick(i, e.target.files[0]) === null) e.target.value = ''; }} />
              <div className="form-text">{l.file ? `Selected: ${l.file.name} (${(l.file.size / 1024).toFixed(0)} KB)` : l.existing ? `Attached: ${l.existing.name}` : 'PDF, JPG or PNG, max 200 KB'}</div></div>
          </div>
        </div></div>
      ))}

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <button className="btn btn-outline-purple" onClick={() => setLines([...lines, blank()])}><FiPlus className="me-1" />Add line</button>
        <div className="d-flex align-items-center gap-3">
          <div className="fs-5 fw-bold">Total {inr(total)}</div>
          <button className="btn btn-light border" disabled={busy} onClick={() => send(false)}>Save draft</button>
          <button className="btn btn-purple" disabled={busy} onClick={() => send(true)}>{busy ? 'Working…' : id ? 'Resubmit to Finance' : 'Submit to Finance'}</button>
        </div>
      </div>
    </>
  );
}
