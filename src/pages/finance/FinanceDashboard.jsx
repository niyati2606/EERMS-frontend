import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api, { errMsg } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Hero, Avatar, Stat, Alert, inr, ago } from '../../components/ui';

const pillClass = (code) => (['HIGH_VALUE', 'RECEIPT_DUPLICATE'].includes(code) ? 'bad' : 'warn');
const employeeName = (claim) => claim.employee?.fullName || 'Employee record unavailable';

export default function FinanceDashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const q = sp.get('q') || '';
  const [rows, setRows] = useState(null);
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState('');

  const load = () => {
    api.get('/finance/queue', { params: { q } }).then((r) => setRows(r.data));
    api.get('/finance/stats').then((r) => setStats(r.data));
  };
  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, [q]); // eslint-disable-line

  const assign = async (c) => {
    setErr('');
    try { await api.post(`/finance/claims/${c.id}/assign`); nav(`/finance/review/${c.id}`); } catch (e) { setErr(errMsg(e)); load(); }
  };
  const pending = rows ? rows.filter((c) => !c.lockedBy) : [];
  const urgent = rows ? rows.filter((c) => c.flags.some((f) => ['AGED', 'HIGH_VALUE', 'DUPLICATE', 'RECEIPT_DUPLICATE', 'MILEAGE_POLICY'].includes(f.code))) : [];

  return (
    <>
      <Hero eyebrow="Shared work queue · oldest first"
        chips={(urgent.length ? urgent : pending).map((c) => ({ avatar: employeeName(c), title: `${c.ticketRef} · ${inr(c.total)}`, sub: `${employeeName(c)} · waiting ${ago(c.submittedAt)}` }))}>
        {stats ? <><b>{stats.inQueue} claims</b> are waiting for audit. <b>{stats.aged + stats.highValue}</b> need attention first.</> : 'Loading queue…'}
      </Hero>
      {stats && (
        <div className="row g-3 mb-4">
          <div className="col-6 col-lg-3"><Stat label="Unassigned" value={stats.inQueue} /></div>
          <div className="col-6 col-lg-3"><Stat label="Locked by me" value={stats.myLocked} tone="coral" /></div>
          <div className="col-6 col-lg-3"><Stat label="Aged > 72 business hours" value={stats.aged} tone="danger" sub="Mon–Fri, 9:00–17:00 IST" /></div>
          <div className="col-6 col-lg-3"><Stat label="Ready to pay" value={stats.toPay} tone="success" sub={<Link to="/finance/payments">Open payments →</Link>} /></div>
        </div>)}
      <Alert onClose={() => setErr('')}>{err}</Alert>
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
          <span>Needs your decision <span className="badge text-bg-secondary rounded-pill ms-1">{rows ? rows.length : 0}</span></span>
          <input className="form-control form-control-sm" style={{ maxWidth: 300 }} placeholder="Filter by ticket or employee…" value={q} onChange={(e) => setSp(e.target.value ? { q: e.target.value } : {})} />
        </div>
        {rows && rows.length === 0 && <div className="text-center text-muted py-5">Queue is empty 🎉</div>}
        {rows && rows.map((c) => {
          const mine = c.lockedBy === user.id; const own = c.employeeId === user.id;
          return (
            <div className="decision-row" key={c.id}>
              <Avatar name={employeeName(c)} lg />
              <div className="grow">
                <div className="fw-semibold text-truncate">{c.ticketRef} · {employeeName(c)} <span className="text-muted fw-normal">· {inr(c.total)}</span></div>
                <div className="small text-muted text-truncate">{c.employee?.empCode || '—'} · {c.employee?.branch || '—'}
                  {c.flags.map((f) => <span key={f.code} className={`pill ${pillClass(f.code)}`}>{f.label}</span>)}
                  {c.lockedBy && <span className="pill ok">🔒 {mine ? 'You' : c.lockedByName}</span>}</div>
              </div>
              <div className="small text-muted d-none d-md-block">{ago(c.submittedAt)}</div>
              {mine && <Link className="btn btn-sm btn-purple" to={`/finance/review/${c.id}`}>Continue</Link>}
              {!c.lockedBy && <button className="btn btn-sm btn-purple" disabled={own} title={own ? 'You cannot audit your own claim' : ''} onClick={() => assign(c)}>Assign to Me</button>}
              {c.lockedBy && !mine && <Link className="btn btn-sm btn-light" to={`/finance/review/${c.id}`}>View</Link>}
            </div>);
        })}
      </div>
    </>
  );
}
