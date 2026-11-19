import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiTrash2, FiPlus } from 'react-icons/fi';
import api, { errMsg, errList } from '../../services/api';
import { PageHeader, Alert, CATS, inr, useClaimPaths } from '../../components/ui';

const MAX = 200 * 1024;
const MAX_AMOUNT = 150000;
const MAX_EXPENSE_DATE_AGE_DAYS = 15;
const hasAlphabeticText = (value) => /\p{L}/u.test(String(value || ''));
const hasAllowedTextCharacters = (value) => /^[\p{L} -]+$/u.test(String(value || '').trim());
const isFieldError = (error) => error.startsWith('Claim title ')
  || error === 'Add at least one expense line'
  || /^Line \d+: (date |expense date |choose a category|amount |business reason |road travel |ride Booking ID |distance |a receipt |receipt )/.test(error);
const lineError = (errors, index, prefixes) => errors?.find((error) => prefixes.some((prefix) => error.startsWith(`Line ${index + 1}: ${prefix}`)));
const fieldMessage = (error) => error?.replace(/^Line \d+: /, '');
const blank = () => ({ key: Math.random().toString(36).slice(2), id: null, date: '', category: 'MEALS', amount: '', reason: '', provider: '', bookingId: '', distanceKm: '', file: null, existing: null });

export default function NewClaim() {
  const { id } = useParams();
  const nav = useNavigate();
  const p = useClaimPaths();
  const [title, setTitle] = useState('');
  const [lines, setLines] = useState([blank()]);
  const [err, setErr] = useState('');
  const [errors, setErrors] = useState(null);
  const [busy, setBusy] = useState(false);
  const [policy, setPolicy] = useState(null);
  const today = new Date().toISOString().slice(0, 10);
  const earliestDate = new Date(Date.now() - MAX_EXPENSE_DATE_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  useEffect(() => {
    api.get('/claims/policy').then(({ data }) => setPolicy(data)).catch((e) => setErr(errMsg(e)));
  }, []);

  useEffect(() => {
    if (!id) return;
    api.get(`/claims/${id}`).then(({ data }) => {
      setTitle(data.title);
      if (data.decisionNote && data.status === 'INFO_REQUESTED') setErr(`Finance feedback: ${data.decisionNote}`);
      setLines(data.lines.map((l) => ({ ...blank(), id: l.id, date: l.date, category: l.category, amount: l.amount, reason: l.reason, provider: l.provider || '', bookingId: l.bookingId || '', distanceKm: l.distanceKm || '', existing: l.receipt })));
    }).catch((e) => setErr(errMsg(e)));
  }, [id]);

  const set = (i, patch) => {
    setErrors(null);
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  };
  const pick = (i, f) => {
    if (!f) return set(i, { file: null });
    if (!/\.(pdf|jpe?g|png)$/i.test(f.name)) {
      setErr('');
      setErrors([`Line ${i + 1}: receipt must be PDF, JPG or PNG`]);
      return null;
    }
    if (f.size > MAX) {
      setErr('');
      setErrors([`Line ${i + 1}: receipt must be under 200 KB`]);
      return null;
    }
    setErr(''); return set(i, { file: f });
  };

  const send = async (submit) => {
    setErr(''); setErrors(null);
    const validationErrors = [];
    if (!hasAlphabeticText(title)) validationErrors.push('Claim title is required');
    else if (!hasAllowedTextCharacters(title)) validationErrors.push('Claim title can contain letters, spaces, and hyphens only');
    lines.forEach((line, i) => {
      const field = `Line ${i + 1}: business reason`;
      if (!hasAlphabeticText(line.reason)) validationErrors.push(`${field} is required`);
      else if (!hasAllowedTextCharacters(line.reason)) validationErrors.push(`${field} can contain letters, spaces, and hyphens only`);
      if (Number(line.amount) > MAX_AMOUNT) validationErrors.push(`Line ${i + 1}: amount cannot exceed ₹1,50,000`);
      if (submit) {
        const lineNumber = i + 1;
        if (!line.date) validationErrors.push(`Line ${lineNumber}: date is required`);
        else if (line.date > today) validationErrors.push(`Line ${lineNumber}: expense date cannot be in the future`);
        else if (line.date < earliestDate) validationErrors.push(`Line ${lineNumber}: expense date cannot be more than 15 days old`);
        if (!CATS[line.category]) validationErrors.push(`Line ${lineNumber}: choose a category`);
        if (!(Number(line.amount) > 0)) validationErrors.push(`Line ${lineNumber}: amount must be greater than ₹0`);
        if (line.category === 'ROAD') {
          if (!['Ola', 'Uber', 'Rapido'].includes(line.provider)) validationErrors.push(`Line ${lineNumber}: road travel must be Ola, Uber or Rapido`);
          if (!line.bookingId.trim()) validationErrors.push(`Line ${lineNumber}: ride Booking ID is required`);
          if (!(Number(line.distanceKm) > 0)) validationErrors.push(`Line ${lineNumber}: distance in kilometres is required`);
        }
        if (!line.file && !line.existing) validationErrors.push(`Line ${lineNumber}: a receipt (PDF/JPG/PNG < 200 KB) is mandatory`);
      }
    });
    if (validationErrors.length) {
      setErrors(validationErrors);
      return;
    }

    setBusy(true);
    const fd = new FormData();
    fd.append('payload', JSON.stringify({
      title: title.trim(), submit,
      lines: lines.map((l) => ({ id: l.id, date: l.date, category: l.category, amount: Number(l.amount), reason: l.reason.trim(), provider: l.provider, bookingId: l.bookingId, distanceKm: l.distanceKm })),
    }));
    lines.forEach((l, i) => l.file && fd.append(`receipt_${i}`, l.file));
    try {
      const { data } = id ? await api.put(`/claims/${id}`, fd) : await api.post('/claims', fd);
      nav(submit ? p.detail(data.id) : p.list);
    } catch (e) {
      const apiErrors = errList(e);
      setErr(apiErrors?.some((error) => !isFieldError(error)) || !apiErrors?.length ? errMsg(e) : '');
      setErrors(apiErrors);
    } finally { setBusy(false); }
  };

  const total = lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const titleError = errors?.find((error) => error.startsWith('Claim title '));
  const lineCountError = errors?.find((error) => error === 'Add at least one expense line');
  const otherErrors = errors?.filter((error) => !isFieldError(error)) || [];

  return (
    <>
      <PageHeader title={id ? 'Edit / resubmit claim' : 'New expense claim'} sub="Amounts in ₹ · every line needs a receipt (PDF/JPG/PNG, under 200 KB)" />
      {(err || otherErrors.length > 0) && <Alert onClose={() => setErr('')}>{err}{otherErrors.length > 0 && <ul className="mb-0">{otherErrors.map((x) => <li key={x}>{x}</li>)}</ul>}</Alert>}
      <div className="card mb-3"><div className="card-body">
        <label className="form-label fw-semibold">Claim title <span className="text-danger">*</span></label>
        <input className={`form-control${titleError ? ' is-invalid' : ''}`} aria-invalid={Boolean(titleError)} aria-describedby={titleError ? 'claim-title-error' : undefined} placeholder="e.g. Client workshop - Pune" value={title} onChange={(e) => { setTitle(e.target.value); setErrors(null); }} maxLength={120} required />
        {titleError && <div className="invalid-feedback d-block" id="claim-title-error">{titleError}</div>}
        <div className="form-text">Use letters, spaces, and hyphens only.</div>
      </div></div>

      {lines.map((l, i) => {
        const dateError = lineError(errors, i, ['date ', 'expense date ']);
        const categoryError = lineError(errors, i, ['choose a category']);
        const amountError = lineError(errors, i, ['amount ']);
        const reasonError = lineError(errors, i, ['business reason ']);
        const providerError = lineError(errors, i, ['road travel ']);
        const bookingIdError = lineError(errors, i, ['ride Booking ID ']);
        const distanceError = lineError(errors, i, ['distance ']);
        const receiptError = lineError(errors, i, ['a receipt ', 'receipt ']);
        const lineNumber = i + 1;
        return (
          <div className="card mb-3" key={l.key}><div className="card-body">
            <div className="d-flex justify-content-between mb-2"><strong>Line {lineNumber}</strong>
              {lines.length > 1 && <button className="btn btn-sm btn-light text-danger" onClick={() => setLines(lines.filter((_, j) => j !== i))}><FiTrash2 /></button>}</div>
            <div className="row g-3">
              <div className="col-md-3"><label className="form-label small fw-semibold">Date</label>
                <input type="date" min={earliestDate} max={today} className={`form-control${dateError ? ' is-invalid' : ''}`} aria-invalid={Boolean(dateError)} aria-describedby={dateError ? `line-${lineNumber}-date-error` : undefined} value={l.date} onChange={(e) => set(i, { date: e.target.value })} />
                {dateError && <div className="invalid-feedback d-block" id={`line-${lineNumber}-date-error`}>{fieldMessage(dateError)}</div>}</div>
              <div className="col-md-5"><label className="form-label small fw-semibold">Category</label>
                <select className={`form-select${categoryError ? ' is-invalid' : ''}`} aria-invalid={Boolean(categoryError)} aria-describedby={categoryError ? `line-${lineNumber}-category-error` : undefined} value={l.category} onChange={(e) => set(i, { category: e.target.value })}>
                  {Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v}{k === 'ROAD' ? ' (Ola / Uber / Rapido only)' : ''}</option>)}</select>
                {categoryError && <div className="invalid-feedback d-block" id={`line-${lineNumber}-category-error`}>{fieldMessage(categoryError)}</div>}</div>
              <div className="col-md-4"><label className="form-label small fw-semibold">Amount (₹)</label>
                <input type="number" min="1" max={MAX_AMOUNT} step="0.01" className={`form-control${amountError ? ' is-invalid' : ''}`} aria-invalid={Boolean(amountError)} aria-describedby={amountError ? `line-${lineNumber}-amount-error` : undefined} value={l.amount} onChange={(e) => set(i, { amount: e.target.value })} />
                {amountError && <div className="invalid-feedback d-block" id={`line-${lineNumber}-amount-error`}>{fieldMessage(amountError)}</div>}
                <div className="form-text">Maximum ₹1,50,000 per expense line.</div></div>
              {l.category === 'ROAD' && (<>
                <div className="col-md-3"><label className="form-label small fw-semibold">Ride provider</label>
                  <select className={`form-select${providerError ? ' is-invalid' : ''}`} aria-invalid={Boolean(providerError)} aria-describedby={providerError ? `line-${lineNumber}-provider-error` : undefined} value={l.provider} onChange={(e) => set(i, { provider: e.target.value })}>
                    <option value="">Select…</option><option>Ola</option><option>Uber</option><option>Rapido</option></select>
                  {providerError && <div className="invalid-feedback d-block" id={`line-${lineNumber}-provider-error`}>{fieldMessage(providerError)}</div>}</div>
                <div className="col-md-3"><label className="form-label small fw-semibold">Trip / Booking ID</label>
                  <input className={`form-control${bookingIdError ? ' is-invalid' : ''}`} aria-invalid={Boolean(bookingIdError)} aria-describedby={bookingIdError ? `line-${lineNumber}-booking-error` : undefined} value={l.bookingId} onChange={(e) => set(i, { bookingId: e.target.value })} />
                  {bookingIdError && <div className="invalid-feedback d-block" id={`line-${lineNumber}-booking-error`}>{fieldMessage(bookingIdError)}</div>}</div>
                <div className="col-md-3"><label className="form-label small fw-semibold">Distance (km) *</label>
                  <input type="number" min="0.1" step="0.1" className={`form-control${distanceError ? ' is-invalid' : ''}`} aria-invalid={Boolean(distanceError)} aria-describedby={distanceError ? `line-${lineNumber}-distance-error` : undefined} value={l.distanceKm} onChange={(e) => set(i, { distanceKm: e.target.value })} />
                  {distanceError && <div className="invalid-feedback d-block" id={`line-${lineNumber}-distance-error`}>{fieldMessage(distanceError)}</div>}
                  <div className="form-text">{policy ? `Policy rate: ₹${policy.mileagePerKm}/km` : 'Loading mileage policy…'}</div></div>
              </>)}
              <div className={l.category === 'ROAD' ? 'col-md-3' : 'col-md-6'}><label className="form-label small fw-semibold">Business reason <span className="text-danger">*</span></label>
                <input className={`form-control${reasonError ? ' is-invalid' : ''}`} aria-invalid={Boolean(reasonError)} aria-describedby={reasonError ? `line-${lineNumber}-reason-error` : undefined} value={l.reason} onChange={(e) => set(i, { reason: e.target.value })} required />
                {reasonError && <div className="invalid-feedback d-block" id={`line-${lineNumber}-reason-error`}>{fieldMessage(reasonError)}</div>}
                <div className="form-text">Use letters, spaces, and hyphens only.</div></div>
              <div className={l.category === 'ROAD' ? 'col-12' : 'col-md-6'}><label className="form-label small fw-semibold">Receipt *</label>
                <input type="file" className={`form-control${receiptError ? ' is-invalid' : ''}`} aria-invalid={Boolean(receiptError)} aria-describedby={receiptError ? `line-${lineNumber}-receipt-error` : undefined} accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => { if (pick(i, e.target.files[0]) === null) e.target.value = ''; }} />
                {receiptError && <div className="invalid-feedback d-block" id={`line-${lineNumber}-receipt-error`}>{fieldMessage(receiptError)}</div>}
                <div className="form-text">{l.file ? `Selected: ${l.file.name} (${(l.file.size / 1024).toFixed(0)} KB)` : l.existing ? `Attached: ${l.existing.name}` : 'PDF, JPG or PNG, max 200 KB'}</div></div>
            </div>
          </div></div>
        );
      })}

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div>
          <button className="btn btn-outline-purple" onClick={() => setLines([...lines, blank()])}><FiPlus className="me-1" />Add line</button>
          {lineCountError && <div className="text-danger small mt-1" role="alert">{lineCountError}</div>}
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="fs-5 fw-bold">Total {inr(total)}</div>
          <button className="btn btn-light border" disabled={busy} onClick={() => send(false)}>Save draft</button>
          <button className="btn btn-purple" disabled={busy} onClick={() => send(true)}>{busy ? 'Working…' : id ? 'Resubmit to Finance' : 'Submit to Finance'}</button>
        </div>
      </div>
    </>
  );
}
