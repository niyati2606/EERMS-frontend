import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNextEmployeeCode, createFinanceStaff, getHrMeta } from '../../services/hrService';
import { errMsg, errList } from '../../services/api';
import { Alert, PageHeader } from '../../components/ui';
import { isValidPersonName } from '../../utils/validation';

const BRANCHES = ['Corporate HQ', 'Branch A', 'Branch B'];

export default function AddFinance() {
  const [branches, setBranches] = useState(BRANCHES);
  const [code, setCode] = useState('');
  const [f, setF] = useState({ fullName: '', email: '', phone: '', branch: 'Corporate HQ', empCode: '' });
  const [errs, setErrs] = useState({});
  const [apiErr, setApiErr] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const loadData = () => {
    getNextEmployeeCode().then((c) => {
      setCode(c);
      setF((prev) => ({ ...prev, empCode: prev.empCode || c }));
    }).catch((e) => setApiErr(errMsg(e)));
    getHrMeta().then((m) => {
      if (m?.branches?.length) setBranches(m.branches);
    }).catch((e) => setApiErr(errMsg(e)));
  };

  useEffect(() => {
    loadData();
  }, []);

  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const validate = () => {
    const e = {};
    if (!f.fullName.trim()) e.fullName = 'Full name is required';
    else if (!isValidPersonName(f.fullName)) e.fullName = 'Full name can contain letters and spaces only';
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

    try {
      const { data } = await createFinanceStaff({
        fullName: f.fullName.trim(),
        email: f.email.trim(),
        phone: f.phone.trim(),
        branch: f.branch,
        empCode: f.empCode || code,
      });

      navigate('/hr/finance/employees', {
        replace: true,
        state: { notice: data.message || 'Finance staff created successfully! Password setup email sent.' },
      });
    } catch (err) {
      const list = errList(err);
      setApiErr(list ? list.join(' · ') : errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Add Finance Officer"
        sub="Create a Finance account and send its setup invitation."
      />

      <Alert onClose={() => setApiErr('')}>{apiErr}</Alert>

      <div className="justify-content-center">
        
          <div className="card finance-form-card shadow-sm h-100">
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
                    placeholder="Rahul Verma"
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
                    placeholder="9876543210"
                    maxLength={10}
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

                <div className="d-grid d-sm-flex justify-content-sm-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/hr/finance/employees')}
                    disabled={busy}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-purple" disabled={busy}>
                    {busy ? 'Creating Finance Staff…' : '+ Add Finance Officer'}
                  </button>
                </div>
              </form>
            </div>
          
        </div>

      </div>
    </>
  );
}

