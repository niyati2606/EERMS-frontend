import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiSearch, FiChevronDown, FiMoreVertical, FiCheckCircle, FiClock, FiXCircle, FiLock, FiUser, FiUsers, FiUserPlus } from 'react-icons/fi';
import api, { errMsg } from '../services/api';
import { Alert, LoadingSkeleton } from './ui';
import FreezeEmployeeModal from './FreezeEmployeeModal';

const BRANCHES = ['Corporate HQ', 'Branch A', 'Branch B'];

const BankPill = ({ s }) => {
  if (s === 'Verified') return <span className="chip chip-green"><FiCheckCircle /> Bank verified</span>;
  if (s === 'Rejected') return <span className="chip chip-red"><FiXCircle /> Bank rejected</span>;
  if (s === 'Pending') return <span className="chip chip-amber"><FiClock /> Verification pending</span>;
  return <span className="text-muted">—</span>;
};
const StatusPill = ({ s }) => (s === 'active'
  ? <span className="chip chip-green"><span className="dot-sm" /> Active</span>
  : s === 'pending'
    ? <span className="chip chip-amber"><FiClock /> Pending setup</span>
    : <span className="chip chip-red"><FiLock /> Frozen</span>);

export default function EmployeeTable() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [q, setQ] = useState(sp.get('q') || '');
  const [branch, setBranch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState({ key: 'empCode', dir: 'desc' });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [freezeTarget, setFreezeTarget] = useState(null);
  const [freezeBusy, setFreezeBusy] = useState(false);
  const box = useRef(null);

  useEffect(() => { setQ(sp.get('q') || ''); }, [sp]);
  const load = () => {
    setLoading(true);
    setErr('');
    return api.get('/hr/employees', { params: { q, status: status || undefined } })
      .then((r) => setRows(r.data))
      .catch((e) => setErr(errMsg(e)))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [q, status]); // eslint-disable-line
  useEffect(() => {
    const close = (e) => { if (box.current && !box.current.contains(e.target)) setMenu(null); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const list = useMemo(() => {
    const get = { empCode: (u) => u.empCode, fullName: (u) => u.fullName.toLowerCase(), joiningDate: (u) => u.joiningDate || '', status: (u) => u.status };
    const f = rows.filter((u) => !branch || u.branch === branch);
    const g = get[sort.key];
    return f.sort((a, b) => (g(a) > g(b) ? 1 : g(a) < g(b) ? -1 : 0) * (sort.dir === 'asc' ? 1 : -1));
  }, [rows, branch, sort]);
  const hasFilters = Boolean(q || branch || status);
  const clearFilters = () => { setQ(''); setBranch(''); setStatus(''); };

  const toggleSort = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  const Th = ({ k, children }) => (
    <th className={k ? 'sortable' : ''} onClick={k ? () => toggleSort(k) : undefined}>{children}{k && <span className="sort-ico">⇅</span>}</th>);

  const toggleFreeze = async (u, reason = '') => {
    setMenu(null);
    const freeze = u.status === 'active';
    if (freeze && !reason.trim()) return;
    setErr(''); setMsg('');
    if (freeze) setFreezeBusy(true);
    try {
      const { data } = await api.post(`/hr/employees/${u.id}/freeze`, { freeze, reason });
      setMsg(`${u.fullName} ${freeze ? 'frozen' : 'reactivated'}.${freeze && data.unsettledClaims ? ` ${data.unsettledClaims} unsettled claim(s) remain – payouts are blocked.` : ''}`);
      setFreezeTarget(null);
      load();
    } catch (e) {
      setErr(errMsg(e));
    } finally { if (freeze) setFreezeBusy(false); }
  };

  return (
    <div ref={box}>
      <Alert onClose={() => setErr('')}>{err}</Alert><Alert type="success" onClose={() => setMsg('')}>{msg}</Alert>
      <div className="emp-filters">
        <div className="search-field"><FiSearch /><input placeholder="Search name, email or code" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        {[[branch, setBranch, 'All branches', BRANCHES], [status, setStatus, 'All statuses', ['active', 'pending', 'frozen']]].map(([v, set, label, opts]) => (
          <div className="select-field" key={label}>
            <select value={v} onChange={(e) => set(e.target.value)}><option value="">{label}</option>{opts.map((o) => <option key={o} value={o}>{o[0].toUpperCase() + o.slice(1)}</option>)}</select>
            <FiChevronDown />
          </div>))}
      </div>

      {loading ? <LoadingSkeleton variant="rows" rows={5} /> : err && rows.length === 0 ? (
        <div className="card emp-empty"><h2>Could not load employees</h2><p>Please try again.</p></div>
      ) : list.length === 0 ? (
        <div className="card emp-empty">
          <div className="emp-empty-icon">{hasFilters ? <FiSearch /> : <FiUsers />}</div>
          <h2>{hasFilters ? 'No matching employees' : 'No employees yet'}</h2>
          <p>{hasFilters
            ? 'Try a different search or clear the selected filters.'
            : 'Employee records will appear here after you add your first employee.'}</p>
          {/* {hasFilters
            ? <button type="button" className="btn btn-outline-purple" onClick={clearFilters}>Clear search and filters</button>
            : <Link className="btn btn-purple" to="/hr/employees/new"><FiUserPlus className="me-2" />Add first employee</Link>} */}
        </div>
      ) : (
        <div className="card emp-card"><div className="table-responsive" style={{ overflow: menu ? 'visible' : undefined }}>
          <table className="table emp-table align-middle mb-0">
            <thead><tr><Th k="empCode">Code</Th><Th k="fullName">Employee</Th><Th k="joiningDate">Joining date</Th><Th>Branch</Th><Th>Bank</Th><Th k="status">Status</Th><Th>Actions</Th></tr></thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id} onClick={() => nav(`/hr/employees/${u.id}`)} style={{ cursor: 'pointer' }}>
                  <td className="text-nowrap" data-label="Code">{u.empCode}</td>
                  <td data-label="Employee"><div className="fw-bold">{u.fullName}</div><div className="text-muted small">{u.email}</div></td>
                  <td className="text-nowrap" data-label="Joining date">{u.joiningDate || '—'}</td>
                  <td className="text-nowrap" data-label="Branch">{u.branch}</td>
                  <td data-label="Bank"><BankPill s={u.bank?.status} /></td><td data-label="Status"><StatusPill s={u.status} /></td>
                  <td data-label="Actions" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
                    <button className="kebab" aria-label="Actions" onClick={() => setMenu(menu === u.id ? null : u.id)}><FiMoreVertical /></button>
                    {menu === u.id && (
                      <div className="kebab-menu">
                        <Link to={`/hr/employees/${u.id}`}><FiUser /> View details</Link>
                        {u.role !== 'admin' && ['active', 'frozen'].includes(u.status) && (
                          <button
                            onClick={() => u.status === 'active' ? (setFreezeTarget(u), setMenu(null)) : toggleFreeze(u)}
                          >
                            <FiLock /> {u.status === 'active' ? 'Freeze account' : 'Reactivate'}
                          </button>
                        )}
                      </div>)}
                  </td>
                </tr>))}
            </tbody>
          </table></div></div>
      )}
      <FreezeEmployeeModal
        employee={freezeTarget}
        busy={freezeBusy}
        error={err}
        onClose={() => { setFreezeTarget(null); setErr(''); }}
        onConfirm={(reason) => toggleFreeze(freezeTarget, reason)}
      />
    </div>
  );
}
