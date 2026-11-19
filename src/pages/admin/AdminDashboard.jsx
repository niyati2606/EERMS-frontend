import React, { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { errMsg } from '../../services/api';
import { PageHeader, Hero, Stat, Alert, LoadingSkeleton, inr, downloadText } from '../../components/ui';

const compact = (v) => (v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`);
const monthValue = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const utcMonthValue = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
const utcQuarterValue = (date) => String(Math.floor(date.getUTCMonth() / 3) + 1);
const defaultTrendRange = () => {
  const current = new Date();
  return {
    from: monthValue(new Date(current.getFullYear(), current.getMonth() - 5, 1)),
    to: monthValue(current),
  };
};
const defaultStatusFilter = () => {
  const current = new Date();
  return {
    from: utcMonthValue(new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() - 1, 1))),
    to: utcMonthValue(current),
    branch: '',
  };
};

function Chart({ title, actions, children }) {
  return <div className="card h-100"><div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2"><span>{title}</span>{actions}</div><div className="card-body" style={{ height: 260 }}><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div></div>;
}

export default function AdminDashboard() {
  const [a, setA] = useState(null);
  const [trendRange, setTrendRange] = useState(defaultTrendRange);
  const [trendFrom, setTrendFrom] = useState(trendRange.from);
  const [trendTo, setTrendTo] = useState(trendRange.to);
  const [branchSpendMonth, setBranchSpendMonth] = useState(() => utcMonthValue(new Date()));
  const [branchSpendCategory, setBranchSpendCategory] = useState('');
  const [quarterlyBranches, setQuarterlyBranches] = useState([]);
  const [quarterlyYear, setQuarterlyYear] = useState(String(new Date().getUTCFullYear()));
  const [spendPeriod, setSpendPeriod] = useState('quarterly');
  const [statusFilter, setStatusFilter] = useState(defaultStatusFilter);
  const [statusFrom, setStatusFrom] = useState(statusFilter.from);
  const [statusTo, setStatusTo] = useState(statusFilter.to);
  const [statusBranch, setStatusBranch] = useState(statusFilter.branch);
  const [filterPopup, setFilterPopup] = useState('');
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendErr, setTrendErr] = useState('');
  const [edit, setEdit] = useState(false);
  const [bud, setBud] = useState(null);
  const [err, setErr] = useState('');
  const [employeeClaims, setEmployeeClaims] = useState(null);
  const [claimCategory, setClaimCategory] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [claimBranch, setClaimBranch] = useState('');
  const [hideEmployeesWithoutClaims, setHideEmployeesWithoutClaims] = useState(false);
  const [claimErr, setClaimErr] = useState('');
  const [claimPeriodType, setClaimPeriodType] = useState('month');
  const [claimMonth, setClaimMonth] = useState(() => utcMonthValue(new Date()));
  const [claimQuarter, setClaimQuarter] = useState(() => utcQuarterValue(new Date()));
  const [claimQuarterYear, setClaimQuarterYear] = useState(String(new Date().getUTCFullYear()));

  const load = () => api.get('/admin/analytics', {
    params: {
      ...trendRange,
      branchMonth: branchSpendMonth,
      branchCategory: branchSpendCategory || undefined,
      branches: quarterlyBranches.join(','),
      year: quarterlyYear,
      statusFrom: statusFilter.from || undefined,
      statusTo: statusFilter.to || undefined,
      statusBranch: statusFilter.branch || undefined,
    },
  }).then((r) => setA(r.data));

  useEffect(() => {
    let active = true;
    const refresh = (showLoading) => {
      if (showLoading) setTrendLoading(true);
      api.get('/admin/analytics', {
        params: {
          ...trendRange,
          branchMonth: branchSpendMonth,
          branchCategory: branchSpendCategory || undefined,
          branches: quarterlyBranches.join(','),
          year: quarterlyYear,
          statusFrom: statusFilter.from || undefined,
          statusTo: statusFilter.to || undefined,
          statusBranch: statusFilter.branch || undefined,
        },
      }).then(({ data }) => {
        if (active) {
          setA(data);
          setTrendErr('');
        }
      }).catch((error) => {
        if (active) setTrendErr(errMsg(error));
      }).finally(() => {
        if (active && showLoading) setTrendLoading(false);
      });
    };
    refresh(true);
    const interval = window.setInterval(() => refresh(false), 30000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [trendRange, branchSpendMonth, branchSpendCategory, quarterlyBranches, quarterlyYear, statusFilter]);

  useEffect(() => {
    let active = true;
    setEmployeeClaims(null);
    setClaimErr('');
    const period = claimPeriodType === 'month' ? claimMonth : `${claimQuarterYear}-Q${claimQuarter}`;
    api.get('/admin/employee-claim-summary', {
      params: {
        periodType: claimPeriodType,
        period,
        category: claimCategory || undefined,
      },
    })
      .then(({ data }) => {
        if (!active) return;
        if (!Array.isArray(data.employees)) {
          setClaimErr('Employee claim data is unavailable. Please reload the page.');
          setEmployeeClaims([]);
          return;
        }
        setEmployeeClaims(data.employees);
      })
      .catch((error) => {
        if (!active) return;
        setClaimErr(errMsg(error));
        setEmployeeClaims([]);
      });
    return () => { active = false; };
  }, [claimCategory, claimPeriodType, claimMonth, claimQuarter, claimQuarterYear]);

  const openBudget = () => api.get('/admin/budget').then((r) => { setBud(r.data); setEdit(true); });
  const saveBudget = async () => { try { await api.put('/admin/budget', bud); setEdit(false); load(); } catch (e) { setErr(errMsg(e)); } };
  const exportCsv = () => api.get('/admin/export.csv', { responseType: 'text' }).then((r) => downloadText('eerms-claims.csv', r.data));
  const filteredEmployeeClaims = employeeClaims?.filter((employee) => (
    employee.fullName.toLowerCase().includes(employeeSearch.trim().toLowerCase())
    && (!claimBranch || employee.branch === claimBranch)
    && (!hideEmployeesWithoutClaims || employee.claimCount > 0)
  )).sort((first, second) => second.totalSpend - first.totalSpend || first.fullName.localeCompare(second.fullName));
  const visibleEmployeeClaims = filteredEmployeeClaims || [];
  const employeeSummarySpend = visibleEmployeeClaims.reduce((sum, employee) => sum + employee.totalSpend, 0);
  const employeeSummaryPending = visibleEmployeeClaims.reduce((sum, employee) => sum + employee.pendingTotal, 0);
  const claimYearOptions = [...new Set([String(new Date().getUTCFullYear()), ...(a?.quarterYears || []).map(String)])]
    .sort((first, second) => Number(second) - Number(first));
  const claimBranchOptions = [...new Set((employeeClaims || []).map((employee) => employee.branch))].sort();
  const resetEmployeeClaimFilters = () => {
    const now = new Date();
    setEmployeeSearch('');
    setClaimBranch('');
    setHideEmployeesWithoutClaims(false);
    setClaimPeriodType('month');
    setClaimMonth(utcMonthValue(now));
    setClaimQuarter(utcQuarterValue(now));
    setClaimQuarterYear(String(now.getUTCFullYear()));
    setClaimCategory('');
  };
  const exportEmployeeClaims = () => {
    const rows = [
      ['Employee', 'Branch', 'Claims', 'Total spend', 'Average per claim', 'Pending', 'Rejected', 'Vs branch average'],
      ...visibleEmployeeClaims.map((employee) => [
        employee.fullName,
        employee.branch,
        employee.claimCount,
        employee.totalSpend,
        employee.averagePerClaim,
        employee.pendingTotal,
        employee.rejectedCount,
        employee.branchVariancePct === null ? '' : `${employee.branchVariancePct > 0 ? '+' : ''}${Math.round(employee.branchVariancePct)}%`,
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadText('employee-claim-summary.csv', csv);
  };
  const applyTrendRange = (event) => {
    event.preventDefault();
    if (!trendFrom || !trendTo || trendFrom > trendTo) {
      setFilterPopup('Choose a valid start and end month range.');
      return;
    }
    setFilterPopup('');
    setTrendErr('');
    setTrendRange({ from: trendFrom, to: trendTo });
  };
  const applyStatusFilter = (event) => {
    event.preventDefault();
    if (Boolean(statusFrom) !== Boolean(statusTo) || (statusFrom && statusFrom > statusTo)) {
      setFilterPopup('Choose both a start and end month, with the start no later than the end.');
      return;
    }
    setFilterPopup('');
    setStatusFilter({ from: statusFrom, to: statusTo, branch: statusBranch });
  };

  const hasQuarterFilters = Array.isArray(a?.quarterYears) && Array.isArray(a?.monthlySpend);

  if (!a) {
    return (
      <>
        {trendErr && <div className="alert alert-danger" role="alert">{trendErr}</div>}
        <LoadingSkeleton />
      </>
    );
  }
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

          {trendErr && <div className="alert alert-danger" role="alert">{trendErr}</div>}

      <div className="row g-3 mb-4">
        <div className="col-lg-6">
          <Chart title="Monthly spend trend" actions={
            <form className="d-flex flex-wrap gap-2" aria-label="Filter monthly spend trend" onSubmit={applyTrendRange} style={{ width: 460, maxWidth: '100%' }}>
              <input className="form-control form-control-sm" type="month" aria-label="Start month" value={trendFrom} onChange={(event) => setTrendFrom(event.target.value)} style={{ flex: '1 1 140px', minWidth: 0 }} />
              <input className="form-control form-control-sm" type="month" aria-label="End month" value={trendTo} onChange={(event) => setTrendTo(event.target.value)} style={{ flex: '1 1 140px', minWidth: 0 }} />
              <button className="btn btn-purple btn-sm" type="submit" disabled={trendLoading}>{trendLoading ? 'Applying…' : 'Apply'}</button>
            </form>
          }>
            <LineChart data={a.trend}><CartesianGrid strokeDasharray="3 3" stroke="#e8e0d6" /><XAxis dataKey="month" /><YAxis tickFormatter={compact} /><Tooltip formatter={(v) => inr(v)} /><Line type="monotone" dataKey="amount" stroke="#6d4ae0" strokeWidth={3} dot={{ r: 4 }} /></LineChart>
          </Chart>
        </div>
        <div className="col-lg-6"><Chart title="Spend by branch" actions={
          <div className="d-flex gap-2">
            <input type="month" className="form-control form-control-sm" aria-label="Filter spend by branch month" required value={branchSpendMonth} onChange={(event) => setBranchSpendMonth(event.target.value || utcMonthValue(new Date()))} style={{ width: 150 }} />
            <select className="form-select form-select-sm" aria-label="Filter spend by branch category" value={branchSpendCategory} onChange={(event) => setBranchSpendCategory(event.target.value)} style={{ width: 150 }}>
              <option value="">All categories</option>
              {a.categories.map((category) => <option key={category.key} value={category.key}>{category.label}</option>)}
            </select>
          </div>
        }><BarChart data={a.byBranch}><CartesianGrid strokeDasharray="3 3" stroke="#e8e0d6" /><XAxis dataKey="name" /><YAxis tickFormatter={compact} /><Tooltip formatter={(v) => inr(v)} /><Bar dataKey="amount" fill="#6d4ae0" radius={[6, 6, 0, 0]} /></BarChart></Chart></div>
        <div className="col-lg-6"><Chart title={`${spendPeriod === 'monthly' ? 'Monthly' : 'Quarterly'} spend`} actions={
          hasQuarterFilters ? (
            <div className="d-flex flex-wrap gap-2 align-items-start">
              <select className="form-select form-select-sm" aria-label="Spend period" value={spendPeriod} onChange={(event) => setSpendPeriod(event.target.value)} style={{ width: 'auto', minWidth: 120 }}>
                <option value="quarterly">Quarterly</option>
                <option value="monthly">Monthly</option>
              </select>
              <select className="form-select form-select-sm" aria-label="Filter quarterly spend by year" value={quarterlyYear} onChange={(event) => setQuarterlyYear(event.target.value)} style={{ width: 'auto', minWidth: 100 }}>
                {a.quarterYears.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
              <details className="position-relative">
                <summary className="btn btn-outline-purple btn-sm">{quarterlyBranches.length ? `${quarterlyBranches.length} branches` : 'All branches'}</summary>
                <div className="position-absolute end-0 bg-white border rounded shadow p-2" style={{ top: '100%', minWidth: 220, zIndex: 20 }}>
                  <label className="form-check mb-1">
                    <input className="form-check-input" type="checkbox" checked={!quarterlyBranches.length} onChange={() => setQuarterlyBranches([])} />
                    <span className="form-check-label">All branches</span>
                  </label>
                  {a.byBranch.map((branch) => (
                    <label className="form-check mb-1" key={branch.name}>
                      <input className="form-check-input" type="checkbox" checked={quarterlyBranches.includes(branch.name)} onChange={() => setQuarterlyBranches((selected) => selected.includes(branch.name) ? selected.filter((item) => item !== branch.name) : [...selected, branch.name])} />
                      <span className="form-check-label">{branch.name}</span>
                    </label>
                  ))}
                </div>
              </details>
            </div>
          ) : <span className="small text-danger" role="alert">Spend filters unavailable. Restart the backend.</span>
        }><BarChart data={spendPeriod === 'monthly' ? a.monthlySpend : a.quarterlySpend}><CartesianGrid strokeDasharray="3 3" stroke="#e8e0d6" /><XAxis dataKey={spendPeriod === 'monthly' ? 'month' : 'quarter'} /><YAxis tickFormatter={compact} /><Tooltip formatter={(v) => inr(v)} /><Bar dataKey="amount" fill="#8b7cf6" radius={[6, 6, 0, 0]} /></BarChart></Chart></div>
        <div className="col-lg-6">
          <Chart title="Claims by status" actions={
            <form className="d-flex flex-nowrap gap-2" aria-label="Filter claims by status" onSubmit={applyStatusFilter} style={{ width: 460, maxWidth: '100%' }}>
              <input className="form-control form-control-sm" type="month" aria-label="Status filter start month" value={statusFrom} onChange={(event) => setStatusFrom(event.target.value)} style={{ flex: '1 1 0', minWidth: 0 }} />
              <input className="form-control form-control-sm" type="month" aria-label="Status filter end month" value={statusTo} onChange={(event) => setStatusTo(event.target.value)} style={{ flex: '1 1 0', minWidth: 0 }} />
              <select className="form-select form-select-sm" aria-label="Filter claims by branch" value={statusBranch} onChange={(event) => setStatusBranch(event.target.value)} style={{ flex: '1 1 0', minWidth: 0 }}>
                <option value="">All branches</option>
                {a.byBranch.map((branch) => <option key={branch.name} value={branch.name}>{branch.name}</option>)}
              </select>
              <button className="btn btn-purple btn-sm text-nowrap" type="submit" disabled={trendLoading}>{trendLoading ? 'Applying…' : 'Apply'}</button>
            </form>
          }>
            <BarChart data={a.statusCounts}><CartesianGrid strokeDasharray="3 3" stroke="#e8e0d6" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#FF7F50" radius={[6, 6, 0, 0]} /></BarChart>
          </Chart>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">Employee claim summary</div>
        <div className="card-body border-bottom">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-sm-6 col-lg-2">
              <label className="form-label small" htmlFor="employee-claim-search">Employee</label>
              <input id="employee-claim-search" className="form-control" type="search" placeholder="Search employee" value={employeeSearch} onChange={(event) => setEmployeeSearch(event.target.value)} />
            </div>
            <div className="col-12 col-sm-6 col-lg-2">
              <label className="form-label small" htmlFor="employee-claim-branch">Branch</label>
              <select id="employee-claim-branch" className="form-select" value={claimBranch} onChange={(event) => setClaimBranch(event.target.value)}>
                <option value="">All branches</option>
                {claimBranchOptions.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
              </select>
            </div>
            <div className="col-12 col-sm-6 col-lg-2">
              <label className="form-label small" htmlFor="employee-claim-period-type">Period</label>
              <select id="employee-claim-period-type" className="form-select" value={claimPeriodType} onChange={(event) => setClaimPeriodType(event.target.value)}>
                <option value="month">Month</option>
                <option value="quarter">Quarter</option>
              </select>
            </div>
            {claimPeriodType === 'month' ? (
              <div className="col-12 col-sm-6 col-lg-3">
                <label className="form-label small" htmlFor="employee-claim-month">Month</label>
                <input id="employee-claim-month" className="form-control" type="month" value={claimMonth} onChange={(event) => setClaimMonth(event.target.value)} />
              </div>
            ) : (
              <>
                <div className="col-6 col-lg-2">
                  <label className="form-label small" htmlFor="employee-claim-quarter">Quarter</label>
                  <select id="employee-claim-quarter" className="form-select" value={claimQuarter} onChange={(event) => setClaimQuarter(event.target.value)}>
                    <option value="1">Q1</option>
                    <option value="2">Q2</option>
                    <option value="3">Q3</option>
                    <option value="4">Q4</option>
                  </select>
                </div>
                <div className="col-6 col-lg-2">
                  <label className="form-label small" htmlFor="employee-claim-year">Year</label>
                  <select id="employee-claim-year" className="form-select" value={claimQuarterYear} onChange={(event) => setClaimQuarterYear(event.target.value)}>
                    {claimYearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
                  </select>
                </div>
              </>
            )}
            <div className="col-12 col-lg-2">
              <label className="form-label small" htmlFor="employee-claim-category">Category</label>
              <select id="employee-claim-category" className="form-select" value={claimCategory} onChange={(event) => setClaimCategory(event.target.value)}>
                <option value="">All categories</option>
                {a.categories.map((category) => <option key={category.key} value={category.key}>{category.label}</option>)}
              </select>
            </div>
          </div>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
            <label className="form-check mb-0">
              <input className="form-check-input" type="checkbox" checked={hideEmployeesWithoutClaims} onChange={(event) => setHideEmployeesWithoutClaims(event.target.checked)} />
              <span className="form-check-label">Hide employees with no claims</span>
            </label>
            <div className="d-flex flex-wrap gap-2">
              <button className="btn btn-outline-secondary" type="button" onClick={resetEmployeeClaimFilters}>Reset</button>
              <button className="btn btn-outline-purple" type="button" onClick={exportEmployeeClaims} disabled={!employeeClaims || !visibleEmployeeClaims.length}>Export CSV</button>
            </div>
          </div>
          <div className="form-text mt-2">Spend totals include approved and paid claims. Pending and rejected claims are shown separately.</div>
          <div className="row g-3 mt-1">
            <div className="col-6 col-xl-3"><Stat label="Employees" value={employeeClaims === null ? '—' : visibleEmployeeClaims.length} /></div>
            <div className="col-6 col-xl-3"><Stat label="Avg per employee" value={employeeClaims === null ? '—' : inr(visibleEmployeeClaims.length ? employeeSummarySpend / visibleEmployeeClaims.length : 0)} /></div>
            <div className="col-6 col-xl-3"><Stat label="Total spend" value={employeeClaims === null ? '—' : inr(employeeSummarySpend)} /></div>
            <div className="col-6 col-xl-3"><Stat label="Pending" value={employeeClaims === null ? '—' : inr(employeeSummaryPending)} /></div>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table align-middle mb-0" style={{ minWidth: 900 }}>
            <thead><tr><th>Employee</th><th>Branch</th><th className="text-end">Claims</th><th className="text-end" aria-sort="descending">Total spend ↓</th><th className="text-end">Avg / claim</th><th className="text-end">Pending</th><th className="text-end">Rejected</th><th className="text-end">Vs branch avg</th></tr></thead>
            <tbody>
              {claimErr ? <tr><td colSpan="8" className="text-center text-danger py-4">{claimErr}</td></tr>
                : employeeClaims === null ? <tr><td colSpan="8" className="text-center text-muted py-4">Loading employee claims…</td></tr>
                  : visibleEmployeeClaims.length ? visibleEmployeeClaims.map((employee) => (
                    <tr key={employee.id}>
                      <td>{employee.fullName}</td>
                      <td>{employee.branch}</td>
                      <td className="text-end">{employee.claimCount}</td>
                      <td className="text-end">{inr(employee.totalSpend)}</td>
                      <td className="text-end">{inr(employee.averagePerClaim)}</td>
                      <td className="text-end">{inr(employee.pendingTotal)}</td>
                      <td className="text-end">{employee.rejectedCount || '—'}</td>
                      <td className="text-end">
                        {employee.branchVariancePct === null
                          ? '—'
                          : <span className={`badge rounded-pill text-bg-${employee.branchVariancePct > 0 ? 'warning' : 'success'}`}>{employee.branchVariancePct > 0 ? '+' : ''}{Math.round(employee.branchVariancePct)}%</span>}
                      </td>
                    </tr>
                  )) : <tr><td colSpan="8" className="text-center text-muted py-4">{employeeSearch.trim() || claimBranch || hideEmployeesWithoutClaims ? 'No employees match these filters.' : 'No employees found.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

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
      {filterPopup && (
        <div className="modal d-block" tabIndex="-1" role="dialog" aria-modal="true" aria-labelledby="filter-error-title" style={{ background: 'rgba(0,0,0,.4)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content" style={{ borderRadius: 16 }}>
              <div className="modal-header">
                <h2 className="modal-title h5" id="filter-error-title">Invalid date range</h2>
                
              </div>
              <div className="modal-body">{filterPopup}</div>
              <div className="modal-footer"><button className="btn btn-purple" type="button" onClick={() => setFilterPopup('')}>OK</button></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
