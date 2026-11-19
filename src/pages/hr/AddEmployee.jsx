import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCheck } from 'react-icons/fi';
import { createEmployee, getNextEmployeeCode } from '../../services/hrService';
import { errMsg, errList } from '../../services/api';
import { Alert, PageHeader } from '../../components/ui';
import { isValidPersonName } from '../../utils/validation';

const BRANCHES = ['Corporate HQ', 'Branch A', 'Branch B'];
const STEPS = ['Profile', 'Bank details', 'Review & Submit'];
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export default function AddEmployee() {
  const [step, setStep] = useState(0);
  const [code, setCode] = useState('…');
  const [f, setF] = useState({
    fullName: '', email: '', phoneNumber: '', branchLocation: '', joiningDate: '',
    accountHolderName: '', bankName: '', accountNumber: '', ifscCode: '',
  });
  const [errs, setErrs] = useState({});
  const [apiErr, setApiErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    getNextEmployeeCode().then(setCode).catch(() => setCode('EMP-????'));
  }, []);

  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const validate = (s) => {
    const e = {};
    const req = (k, label) => { if (!String(f[k]).trim()) e[k] = `${label} is required`; };
    if (s === 0) {
      req('fullName', 'Full name'); req('email', 'Official email'); req('phoneNumber', 'Phone'); req('branchLocation', 'Branch location'); req('joiningDate', 'Joining date');
      if (f.fullName.trim() && !isValidPersonName(f.fullName)) e.fullName = 'Full name can contain letters and spaces only';
      if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Enter a valid email address';
    }
    if (s === 1) {
      req('accountHolderName', 'Account holder name'); req('bankName', 'Bank name'); req('accountNumber', 'Account number'); req('ifscCode', 'IFSC code');
      if (f.accountHolderName.trim() && !isValidPersonName(f.accountHolderName)) e.accountHolderName = 'Account holder name can contain letters and spaces only';
      if (f.accountNumber && !/^\d{9,18}$/.test(f.accountNumber)) e.accountNumber = 'Account number must be 9–18 digits';
      if (f.ifscCode && !IFSC_RE.test(f.ifscCode.toUpperCase())) e.ifscCode = 'Invalid IFSC (format: ABCD0XXXXXX)';
    }
    return e;
  };
  const next = () => {
    const errors = validate(step);
    setErrs(errors);
    if (!Object.keys(errors).length && step < STEPS.length - 1) setStep((current) => current + 1);
  };
  const back = () => { setErrs({}); setStep((current) => Math.max(0, current - 1)); };

  const submit = async () => {
    setBusy(true); setApiErr('');
    try {
      const { data } = await createEmployee(f);
      setDone(data);
    } catch (e) {
      const list = errList(e);
      setApiErr(list ? list.join(' · ') : errMsg(e));
    } finally { setBusy(false); }
  };

  const fld = (k, label, props = {}) => (
    <div className={props.col || 'col-md-6'}>
      <label className="form-label fw-semibold">{label} <span className="text-danger">*</span></label>
      <input className={`form-control ${errs[k] ? 'is-invalid' : ''}`} value={f[k]} onChange={(e) => set(k, e.target.value)} {...props.input} />
      {errs[k] && <div className="invalid-feedback">{errs[k]}</div>}
    </div>
  );

  if (done) {
    return (
      <div className="card wizard-card text-center">
        <div className="display-4 text-success"><FiCheck /></div>
        <h2 className="h4 fw-bold">Employee created</h2>
        <p className="mb-1"><strong>{done.employee.fullName}</strong> · {done.employee.empCode}</p>
        <p className="text-warning">Bank details are pending HR verification.</p>
        <div className="alert alert-info text-start">
          A one-time password setup link was sent to <code>{done.employee.email}</code>. The link expires after 30 minutes.
        </div>
        <div className="d-flex gap-2 justify-content-center"><Link to="/hr/employees" className="btn btn-purple">Employee list</Link>
          <button className="btn btn-outline-purple" onClick={() => window.location.reload()}>Add another</button></div>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Add employee" sub="Provision an employee profile and payout bank details" />
      <div className="card wizard-card">
        <div className="steps">
          {STEPS.map((s, i) => (
            <div key={s} className={`step ${i === step ? 'current' : i < step ? 'done' : ''}`}>
              <div className="bubble">{i < step ? <FiCheck /> : i + 1}</div><span className="lbl">{s}</span>
            </div>))}
        </div>
        <Alert onClose={() => setApiErr('')}>{apiErr}</Alert>

        {step === 0 && (
          <>
            <div className="mb-3">
              <h2 className="h6 fw-bold mb-1">Profile</h2>
              <p className="small text-muted mb-0">Basic employee details.</p>
            </div>
            <div className="row g-3">
              <div className="col-md-6"><label className="form-label fw-semibold">Employee code</label>
                <input className="form-control" value={code} readOnly /><div className="form-text">Auto-generated</div></div>
              {fld('fullName', 'Full name', { input: { placeholder: 'Priya Sharma' } })}
              {fld('email', 'Official email', { input: { type: 'email', placeholder: 'name@company.com' } })}
              {fld('phoneNumber', 'Phone', { input: { type: 'tel', placeholder: '98765 43210', maxLength: 10 } })}
              <div className="col-md-6"><label className="form-label fw-semibold">Branch location <span className="text-danger">*</span></label>
                <select className={`form-select ${errs.branchLocation ? 'is-invalid' : ''}`} value={f.branchLocation} onChange={(e) => set('branchLocation', e.target.value)}>
                  <option value="">Select branch</option>{BRANCHES.map((b) => <option key={b}>{b}</option>)}</select>
                {errs.branchLocation && <div className="invalid-feedback">{errs.branchLocation}</div>}</div>
              {fld('joiningDate', 'Joining date', { input: { type: 'date' } })}
            </div>
          </>)}

        {step === 1 && (
          <>
            <h2 className="h5 fw-bold mb-0">Payout bank details</h2>
            <p className="text-muted">Bank details are saved as pending until HR verifies them.</p>
            <div className="row g-3 mb-3">
              {fld('accountHolderName', 'Account holder name', { input: { placeholder: 'Name as shown on bank passbook' } })}
              {fld('bankName', 'Bank name', { input: { placeholder: 'State Bank of India' } })}
              {fld('accountNumber', 'Account number', { input: { inputMode: 'numeric', maxLength: 18, placeholder: '9–18 digit account number', onChange: (e) => set('accountNumber', e.target.value.replace(/\D/g, '')) } })}
              {fld('ifscCode', 'IFSC code', { input: { maxLength: 11, placeholder: 'SBIN0001234', style: { textTransform: 'uppercase' } } })}
            </div>
          </>)}

        {step === 2 && (
          <>
            <h2 className="h5 fw-bold mb-0">Review &amp; submit</h2>
            <p className="text-muted">Check the details below. A one-time password setup link will be sent to the employee’s email address.</p>
            <div className="review-grid">
              {[
                ['Employee code', code], ['Full name', f.fullName], ['Official email', f.email], ['Phone', f.phoneNumber],
                ['Branch', f.branchLocation], ['Joining date', f.joiningDate],
                ['Bank', `${f.bankName} · ${f.ifscCode.toUpperCase()}`], ['Account', `••••••${f.accountNumber.slice(-4)}`],
              ].map(([k, v]) => (<div key={k}><div className="k">{k}</div><div className="v">{v || '—'}</div></div>))}
            </div>
          </>)}

        <div className="d-flex justify-content-between mt-4">
          {step === 0
            ? <Link to="/hr/employees" className="btn btn-light rounded-pill px-4">Cancel</Link>
            : <button type="button" className="btn btn-outline-secondary" onClick={back} disabled={busy}>Back</button>}
          {step < STEPS.length - 1
            ? <button type="button" className="btn btn-purple rounded-pill px-4" onClick={next} disabled={busy}>Next</button>
            : <button className="btn btn-purple rounded-pill px-4" onClick={submit} disabled={busy}><FiCheck className="me-1" />{busy ? 'Creating…' : 'Create employee'}</button>}
        </div>
      </div>
    </>
  );
}
