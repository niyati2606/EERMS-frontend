import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../services/api';
import EmployeeTable from '../../components/EmployeeTable';
import { PageHeader, Hero, Stat, Alert, LoadingSkeleton } from '../../components/ui';

export default function HrDashboard() {
  const location = useLocation();
  const [notice, setNotice] = useState(location.state?.notice || '');
  const [s, setS] = useState(null);
  const loadStats = useCallback(() => api.get('/hr/stats').then((r) => setS(r.data)), []);
  useEffect(() => {
    loadStats();
    const refresh = () => {
      if (document.visibilityState === 'visible') loadStats();
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [loadStats]);
  if (!s) return <LoadingSkeleton />;

  return (
    <>
      <Alert type="success" onClose={() => setNotice('')}>{notice}</Alert>
      <Hero eyebrow="HR master data" chips={s.byBranch.map((b) => ({ title: b.branch, sub: `${b.count} active staff`, avatar: b.branch }))}>
        <b>{s.active} active employees</b> across 3 offices. <b>{s.pendingBank}</b> bank verification{s.pendingBank === 1 ? '' : 's'} pending.
      </Hero>
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3"><Stat label="Total staff" value={s.total} /></div>
        <div className="col-6 col-lg-3"><Stat label="Active" value={s.active} tone="success" /></div>
        <div className="col-6 col-lg-3"><Stat label="Frozen" value={s.frozen} tone="secondary" /></div>
        <div className="col-6 col-lg-3"><Stat label="Bank verification pending" value={s.pendingBank} tone="coral" sub={<Link to="/hr/bank-verification">Review queue →</Link>} /></div>
      </div>

      <PageHeader title="Employees" sub="Search, filter and manage employee records." actionsClassName="hr-dashboard-header-actions">
        {/* <Link className="btn btn-purple rounded-pill px-4" to="/hr/employees/new" style={{ textDecoration: 'none', textsize: '1.1rem', alignItems: 'center', display: 'flex', aignself: 'en' }}>
          Add employee
        </Link> */}
        <Link className="btn btn-purple rounded-pill px-4" to="/hr/employees/new">
          Add employee
        </Link>
      </PageHeader>
      <EmployeeTable />
    </>
  );
}
