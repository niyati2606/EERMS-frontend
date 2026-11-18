import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { errMsg } from '../../services/api';
import { PageHeader, Hero, Stat, Alert, StatusBadge, LoadingSkeleton, inr, downloadText } from '../../components/ui';

const compact = (v) => (v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`);

function Chart({ title, children }) {
  return <div className="card h-100"><div className="card-header">{title}</div><div className="card-body" style={{ height: 260 }}><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div></div>;
}

export default function AdminDashboard() {
  const [a, setA] = useState(null);
  const [edit, setEdit] = useState(false);
  const [bud, setBud] = useState(null);
  const [sp] = useSearchParams();
  const [q, setQ] = useState(sp.get('q') || '');
  useEffect(() => { setQ(sp.get('q') || ''); }, [sp]);
  const [res, setRes] = useState(null);
  const [err, setErr] = useState('');

  const load = () => api.get('/admin/analytics').then((r) => setA(r.data));
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!q.trim()) { setRes(null); return undefined; }
    const t = setTimeout(() => api.get('/admin/search', { params: { q } }).then((r) => setRes(r.data)), 250);
    return () => clearTimeout(t);
  }, [q]);

  const openBudget = () => api.get('/admin/budget').then((r) => { setBud(r.data); setEdit(true); });
  const saveBudget = async () => { try { await api.put('/admin/budget', bud); setEdit(false); load(); } catch (e) { setErr(errMsg(e)); } };
  const exportCsv = () => api.get('/admin/export.csv', { responseType: 'text' }).then((r) => downloadText('eerms-claims.csv', r.data));

  if (!a) return <LoadingSkeleton />;
  return (
    <>
      <Hero eyebrow="Spend briefing · this month" chips={[
        { title: `Reimbursed ${compact(a.totals.reimbursed)}`, sub: 'all time, paid', avatar: 'R' },
        { title: `Pipeline ${compact(a.totals.pipeline)}`, sub: 'awaiting settlement', avatar: 'P' },
        { title: `${a.avgTurnaroundDays} day turnaround`, sub: `${a.slaMet}% within ${a.slaTargetDays}-day SLA`, avatar: 'T' }]}>
        <b>{a.budget.pct}%</b> of the monthly budget is used — {inr(a.budget.utilized)} of {inr(a.budget.monthly)}.
      </Hero>
      <PageHeader title="Spend analytics" sub="Cross-branch spending intelligence in ₹ · read-only">
        <button className="btn btn-outline-purple" onClick={openBudget}>Set monthly budget</button>
        <button className="btn btn-purple" onClick={exportCsv}>Export CSV</button>
      </PageHeader>
      <Alert onClose={() => setErr('')}>{err}</Alert>

      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3"><Stat label="Budget used (this month)" value={`${a.budget.pct}%`} tone={a.budget.pct > 90 ? 'coral' : 'purple'} sub={`${inr(a.budget.utilized)} of ${inr(a.budget.monthly)}`} /></div>
        <div className="col-6 col-lg-3"><Stat label="Reimbursed (all time)" value={compact(a.totals.reimbursed)} tone="success" /></div>
        <div className="col-6 col-lg-3"><Stat label="In pipeline" value={compact(a.totals.pipeline)} /></div>
        <div className="col-6 col-lg-3"><Stat label="Avg turnaround" value={`${a.avgTurnaroundDays}d`} tone={a.avgTurnaroundDays <= a.slaTargetDays ? 'success' : 'coral'} sub={`Target ≤ ${a.slaTargetDays}d · ${a.slaMet}% within SLA`} /></div>
      </div>

      <div className="card mb-4"><div className="card-header">All-category expense breakdown (this month)</div>
        <div className="table-responsive"><table className="table align-middle mb-0">
          <thead><tr><th>Category</th><th className="text-end">Budget</th><th className="text-end">Actual</th><th style={{ width: '35%' }}>Utilisation</th></tr></thead>
          <tbody>{a.categories.map((c) => (
            <tr key={c.key}><td>{c.label}</td><td className="text-end">{inr(c.budget)}</td><td className="text-end">{inr(c.utilized)}</td>
              <td><div className="d-flex align-items-center gap-2"><div className="progress flex-fill"><div className={`progress-bar ${c.pct > 100 ? 'warn' : ''}`} style={{ width: `${Math.min(c.pct, 100)}%` }} /></div><span className="small fw-semibold">{c.pct}%</span></div></td></tr>))}
          </tbody></table></div></div>

      <div className="row g-3 mb-4">
        <div className="col-lg-6"><Chart title="Monthly spend trend"><LineChart data={a.trend}><CartesianGrid strokeDasharray="3 3" stroke="#e8e0d6" /><XAxis dataKey="month" /><YAxis tickFormatter={compact} /><Tooltip formatter={(v) => inr(v)} /><Line type="monotone" dataKey="amount" stroke="#6d4ae0" strokeWidth={3} dot={{ r: 4 }} /></LineChart></Chart></div>
        <div className="col-lg-6"><Chart title="Spend by branch"><BarChart data={a.byBranch}><CartesianGrid strokeDasharray="3 3" stroke="#e8e0d6" /><XAxis dataKey="name" /><YAxis tickFormatter={compact} /><Tooltip formatter={(v) => inr(v)} /><Bar dataKey="amount" fill="#6d4ae0" radius={[6, 6, 0, 0]} /></BarChart></Chart></div>
        <div className="col-lg-6"><Chart title="Claims by status"><BarChart data={a.statusCounts}><CartesianGrid strokeDasharray="3 3" stroke="#e8e0d6" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#FF7F50" radius={[6, 6, 0, 0]} /></BarChart></Chart></div>
      </div>

      <div className="card"><div className="card-header">Universal search</div><div className="card-body">
        <input className="form-control mb-3" style={{ maxWidth: 420 }} placeholder="Ticket Ref (EXP-2026-0007) or Employee ID (EMP-0005)" value={q} onChange={(e) => setQ(e.target.value)} />
        {res && (<>
          {res.employees.map((e) => <div key={e.id} className="border-bottom py-1">👤 <strong>{e.empCode}</strong> {e.fullName} · {e.branch} <StatusBadge s={e.status} /></div>)}
          {res.claims.map((c) => <div key={c.id} className="border-bottom py-1">🧾 <strong>{c.ticketRef}</strong> {c.employee.fullName} · {inr(c.total)} <StatusBadge s={c.status} /></div>)}
          {!res.employees.length && !res.claims.length && <div className="text-muted">No matches</div>}</>)}
      </div></div>

      {edit && bud && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,.4)' }}><div className="modal-dialog"><div className="modal-content" style={{ borderRadius: 16 }}>
          <div className="modal-header"><h5 className="modal-title">Monthly estimated budget</h5><button className="btn-close" onClick={() => setEdit(false)} /></div>
          <div className="modal-body">
            <label className="form-label fw-semibold">Total monthly ceiling (₹)</label>
            <input type="number" className="form-control mb-3" value={bud.monthly} onChange={(e) => setBud({ ...bud, monthly: e.target.value })} />
            {Object.keys(bud.categories).map((k) => (
              <div key={k} className="d-flex align-items-center gap-2 mb-2"><span style={{ width: 90 }}>{k}</span>
                <input type="number" className="form-control form-control-sm" value={bud.categories[k]} onChange={(e) => setBud({ ...bud, categories: { ...bud.categories, [k]: e.target.value } })} /></div>))}
          </div>
          <div className="modal-footer"><button className="btn btn-light" onClick={() => setEdit(false)}>Cancel</button><button className="btn btn-purple" onClick={saveBudget}>Save</button></div>
        </div></div></div>)}
    </>
  );
}
