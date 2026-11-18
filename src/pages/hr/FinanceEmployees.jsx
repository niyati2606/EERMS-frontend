import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiCheck, FiChevronDown, FiCopy, FiMail, FiPlus, FiSearch, FiUsers } from 'react-icons/fi';
import { errMsg } from '../../services/api';
import { getFinanceStaff, resendSetupEmail } from '../../services/hrService';
import { Alert, PageHeader, StatusBadge, LoadingSkeleton } from '../../components/ui';

export default function FinanceEmployees() {
  const location = useLocation();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.notice || '');
  const [actionBusy, setActionBusy] = useState(null);
  const [setupUrl, setSetupUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const normalizedSearch = search.trim().toLowerCase();
  const branches = [...new Set(employees.map((employee) => employee.branch || 'Corporate HQ'))].sort();
  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch = !normalizedSearch || [employee.fullName, employee.email, employee.empCode]
      .some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
    const matchesBranch = !branchFilter || (employee.branch || 'Corporate HQ') === branchFilter;
    const matchesStatus = !statusFilter || employee.status === statusFilter;
    return matchesSearch && matchesBranch && matchesStatus;
  });
  const hasFilters = Boolean(normalizedSearch || branchFilter || statusFilter);
  const clearFilters = () => {
    setSearch('');
    setBranchFilter('');
    setStatusFilter('');
  };

  const loadEmployees = async () => {
    setLoading(true);
    setError('');
    try {
      setEmployees(await getFinanceStaff());
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEmployees(); }, []);

  const resendSetup = async (employee) => {
    setActionBusy(employee.id);
    setError('');
    setSuccess('');
    setSetupUrl('');
    setCopied(false);
    try {
      const result = await resendSetupEmail(employee.id);
      setSuccess(result.message || `Password setup email resent to ${employee.email}.`);
      setSetupUrl(result.setupUrl || '');
      await loadEmployees();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setActionBusy(null);
    }
  };

  const copySetupUrl = async () => {
    try {
      await navigator.clipboard.writeText(setupUrl);
      setCopied(true);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  return (
    <>
      <PageHeader title="Finance employees" sub="View Finance accounts and manage password setup invitations." actionsClassName="finance-employees-header-actions">
        <Link className="btn btn-purple btn-lg rounded-pill px-4" to="/hr/finance">Add finance officer</Link>
      </PageHeader>

      <Alert onClose={() => setError('')}>{error}</Alert>
      {success && (
        <Alert type="success" onClose={() => setSuccess('')}>
          <div className="d-flex flex-column gap-2">
            <div><strong>Success:</strong> {success}</div>
            {setupUrl && (
              <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">
                <span className="small text-muted">Setup link:</span>
                <code className="text-break bg-light p-1 rounded small">{setupUrl}</code>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={copySetupUrl}>
                  {copied ? <><FiCheck className="me-1" />Copied</> : <><FiCopy className="me-1" />Copy</>}
                </button>
              </div>
            )}
          </div>
        </Alert>
      )}

      {!loading && !(error && employees.length === 0) && (
        <div className="emp-filters">
          <div className="search-field">
            <FiSearch />
            <input
              aria-label="Search finance employees"
              placeholder="Search name, email or code"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="select-field">
            <select aria-label="Filter finance employees by branch" value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)}>
              <option value="">All branches</option>
              {branches.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
            </select>
            <FiChevronDown />
          </div>
          <div className="select-field">
            <select aria-label="Filter finance employees by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">All statuses</option>
              {['active', 'pending', 'frozen'].map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}
            </select>
            <FiChevronDown />
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSkeleton variant="table" rows={5} />
      ) : error && employees.length === 0 ? (
        <div className="card text-center py-5">
          <div className="card-body">
            <p className="text-muted mb-3">Could not load finance employees.</p>
            <button className="btn btn-outline-purple" type="button" onClick={loadEmployees}>Try again</button>
          </div>
        </div>
      ) : employees.length === 0 ? (
        <div className="card emp-empty">
          <div className="emp-empty-icon"><FiUsers /></div>
          <h2>No finance employees yet</h2>
          <p>Finance employee records will appear here after you add your first finance employee.</p>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="card emp-empty">
          <div className="emp-empty-icon"><FiSearch /></div>
          <h2>No matching finance employees</h2>
          <p>{hasFilters ? 'Try different search terms or filters.' : 'No finance employees found.'}</p>
          <button type="button" className="btn btn-outline-purple" onClick={clearFilters}>Clear filters</button>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Staff</th>
                  <th>Contact</th>
                  <th>Branch</th>
                  <th>Status</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td>
                      <div className="fw-semibold">{employee.fullName}</div>
                      <code className="small">{employee.empCode}</code>
                    </td>
                    <td>
                      <div className="small text-break">{employee.email}</div>
                      <div className="small text-muted">{employee.phone || '—'}</div>
                    </td>
                    <td className="small">{employee.branch || 'Corporate HQ'}</td>
                    <td><StatusBadge s={employee.status} /></td>
                    <td className="text-end">
                      {employee.status !== 'active' ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-purple"
                          disabled={actionBusy === employee.id}
                          onClick={() => resendSetup(employee)}
                          title="Resend password setup email"
                        >
                          <FiMail className="me-1" />
                          {actionBusy === employee.id ? 'Sending…' : 'Resend link'}
                        </button>
                      ) : <span className="text-muted small">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
