import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import EmployeeTable from '../../components/EmployeeTable';
import { PageHeader, Hero, Stat } from '../../components/ui';

export default function HrDashboard() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get('/hr/stats').then((r) => setS(r.data)); }, []);
  if (!s) return <div className="text-muted">Loading…</div>;

  return (
    <>
      <Hero eyebrow="HR master data" chips={s.byBranch.map((b) => ({ title: b.branch, sub: `${b.count} active staff`, avatar: b.branch }))}>
        <b>{s.active} active employees</b> across 3 offices. <b>{s.pendingBank}</b> bank verification{s.pendingBank === 1 ? '' : 's'} pending.
      </Hero>
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3"><Stat label="Total staff" value={s.total} /></div>
        <div className="col-6 col-lg-3"><Stat label="Active" value={s.active} tone="success" /></div>
        <div className="col-6 col-lg-3"><Stat label="Frozen" value={s.frozen} tone="secondary" /></div>
        <div className="col-6 col-lg-3"><Stat label="Bank verification pending" value={s.pendingBank} tone="coral" sub={<Link to="/hr/bank-verification">Review queue →</Link>} /></div>
      </div>

      <PageHeader title="Employees" sub="Search, filter and manage employee records.">
        <Link className="btn btn-purple rounded-pill px-4" to="/hr/employees/new">+ Add employee</Link>
      </PageHeader>
      <EmployeeTable />
    </>
  );
}
