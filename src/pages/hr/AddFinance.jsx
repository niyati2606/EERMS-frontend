import React, { useEffect, useState } from 'react';
import { FiCheck, FiMail, FiRefreshCw, FiCopy } from 'react-icons/fi';
import { getNextEmployeeCode, getFinanceStaff, createFinanceStaff, resendSetupEmail, getHrMeta } from '../../services/hrService';
import { errMsg, errList } from '../../services/api';
import { Alert, PageHeader, StatusBadge } from '../../components/ui';

const BRANCHES = ['Corporate HQ', 'Branch A', 'Branch B'];

export default function AddFinance() {
  const [list, setList] = useState([]);
  const [branches, setBranches] = useState(BRANCHES);
  const [code, setCode] = useState('');
  const [f, setF] = useState({ fullName: '', email: '', phone: '', branch: 'Corporate HQ', empCode: '' });
  const [errs, setErrs] = useState({});
  const [apiErr, setApiErr] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState(null);
  const [lastSetupUrl, setLastSetupUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const loadData = () => {
    getFinanceStaff().then(setList).catch(() => {});
    getNextEmployeeCode().then((c) => {
      setCode(c);
      setF((prev) => ({ ...prev, empCode: prev.empCode || c }));
    }).catch(() => {});
    getHrMeta().then((m) => {
      if (m?.branches?.length) setBranches(m.branches);
    }).catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const validate = () => {
    const e = {};
    if (!f.fullName.trim()) e.fullName = 'Full name is required';
    if (!f.email.trim()) e.email = 'Official email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Enter a valid email address';
    if (!f.phone.trim()) e.phone = 'Phone number is required';
    if (!f.branch) e.branch = 'Branch is required';
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errors = validate();
    setErrs(errors);
    if (Object.keys(errors).length) return;

    setBusy(true);
    setApiErr('');
    setApiSuccess('');
    setLastSetupUrl('');
    setCopied(false);

    try {
      const { data } = await createFinanceStaff({
        fullName: f.fullName.trim(),
        email: f.email.trim(),
        phone: f.phone.trim(),
        branch: f.branch,
        empCode: f.empCode || code,
      });

      setApiSuccess(data.message || 'Finance staff created successfully! Password setup email sent.');
      if (data.setupUrl) setLastSetupUrl(data.setupUrl);

      // Reset form and reload list
      setF({ fullName: '', email: '', phone: '', branch: branches[0] || 'Corporate HQ', empCode: '' });
      loadData();
    } catch (err) {
      const list = errList(err);
      setApiErr(list ? list.join(' · ') : errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async (user) => {
    setActionBusy(user.id);
    setApiErr('');
    setApiSuccess('');
    setLastSetupUrl('');
    setCopied(false);

    try {
      const data = await resendSetupEmail(user.id);
      setApiSuccess(data.message || `Password setup email resent to ${user.email}.`);
      if (data.setupUrl) setLastSetupUrl(data.setupUrl);
      loadData();
    } catch (err) {
      setApiErr(errMsg(err));
    } finally {
      setActionBusy(null);
    }
  };

  const copyUrl = () => {
    if (!lastSetupUrl) return;
    navigator.clipboard.writeText(lastSetupUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <>
      <PageHeader
        title="Finance Staff"
        sub="Add Finance Officers to review expense claims and manage setup invitations"
      />

      <Alert onClose={() => setApiErr('')}>{apiErr}</Alert>
      {apiSuccess && (
        <Alert type="success" onClose={() => setApiSuccess('')}>
          <div className="d-flex flex-column gap-2">
            <div><strong>Success:</strong> {apiSuccess}</div>
            {lastSetupUrl && (
              <div className="d-flex align-items-center gap-2 mt-1">
                <span className="small text-muted">Setup link:</span>
                <code className="text-break bg-light p-1 rounded small">{lastSetupUrl}</code>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={copyUrl}>
                  {copied ? <><FiCheck className="me-1" /> Copied</> : <><FiCopy className="me-1" /> Copy</>}
                </button>
              </div>
            )}
          </div>
        </Alert>
      )}

      <div className="row g-4">
        {/* Form Card */}
        <div className="col-lg-5">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white py-3">
              <h3 className="h6 fw-bold mb-0">Add Finance Officer</h3>
            </div>
            <div className="card-body">
              <form onSubmit={submit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Employee Code</label>
                  <input
                    type="text"
                    className="form-control"
                    value={f.empCode}
                    placeholder={code}
                    onChange={(e) => set('empCode', e.target.value)}
                  />
                  <div className="form-text small">Auto-generated or custom code</div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errs.fullName ? 'is-invalid' : ''}`}
                    placeholder="e.g. Rahul Verma"
                    value={f.fullName}
                    onChange={(e) => set('fullName', e.target.value)}
                  />
                  {errs.fullName && <div className="invalid-feedback">{errs.fullName}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">
                    Official Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className={`form-control ${errs.email ? 'is-invalid' : ''}`}
                    placeholder="name@abcsolutions.com"
                    value={f.email}
                    onChange={(e) => set('email', e.target.value)}
                  />
                  {errs.email && <div className="invalid-feedback">{errs.email}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">
                    Phone Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="tel"
                    className={`form-control ${errs.phone ? 'is-invalid' : ''}`}
                    placeholder="e.g. 9876543210"
                    value={f.phone}
                    onChange={(e) => set('phone', e.target.value)}
                  />
                  {errs.phone && <div className="invalid-feedback">{errs.phone}</div>}
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-semibold">
                    Branch <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${errs.branch ? 'is-invalid' : ''}`}
                    value={f.branch}
                    onChange={(e) => set('branch', e.target.value)}
                  >
                    {branches.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  {errs.branch && <div className="invalid-feedback">{errs.branch}</div>}
                </div>

                <button type="submit" className="btn btn-purple w-100" disabled={busy}>
                  {busy ? 'Creating Finance Staff…' : '+ Add Finance Officer'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Existing Finance Staff List */}
        <div className="col-lg-7">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h3 className="h6 fw-bold mb-0">Finance Team ({list.length})</h3>
              <button className="btn btn-sm btn-outline-secondary" onClick={loadData} title="Refresh list">
                <FiRefreshCw />
              </button>
            </div>
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
                  {list.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-4">
                        No finance staff found.
                      </td>
                    </tr>
                  ) : (
                    list.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className="fw-semibold">{u.fullName}</div>
                          <code className="small">{u.empCode}</code>
                        </td>
                        <td>
                          <div className="small text-truncate" style={{ maxWidth: 180 }}>{u.email}</div>
                          <div className="small text-muted">{u.phone || '—'}</div>
                        </td>
                        <td className="small">{u.branch || 'Corporate HQ'}</td>
                        <td>
                          <StatusBadge s={u.status} />
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-purple"
                            disabled={actionBusy === u.id}
                            onClick={() => handleResend(u)}
                            title="Resend password setup email"
                          >
                            <FiMail className="me-1" />
                            {actionBusy === u.id ? 'Sending…' : 'Resend link'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
