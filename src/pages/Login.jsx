import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../services/api';
import { Alert } from '../components/ui';

const DEMO = [
  // ['Finance Officer', 'finance@abcsolutions.com'],
  ['HR Administrator', 'hr@abcsolutions.com'],
  //['Admin / Executive', 'admin@abcsolutions.com'],
];

export default function Login() {
  const { login, takeNotice } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [notice] = useState(takeNotice);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { nav(await login(email, password), { replace: true }); } catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  };

  return (
    <div className="login-wrap">
      <div className="card login-card">
        <h1 className="h3 fw-bold text-purple mb-1">EERMS</h1>
        <p className="text-muted">Employee Expense Reimbursement · ABC Solutions</p>
        <Alert type="warning">{notice}</Alert>
        {location.state?.passwordSetupComplete && <Alert type="success">Password set successfully. You can now sign in.</Alert>}
        <Alert>{err}</Alert>
        <form onSubmit={submit}>
          <label className="form-label fw-semibold">Email</label>
          <input className="form-control mb-3" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          <label className="form-label fw-semibold">Password</label>
          <input className="form-control mb-3" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="btn btn-purple w-100" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <hr />
        <div className="small text-muted mb-2">Demo accounts (password <code>Password@123</code>)</div>
        <div className="d-grid gap-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {DEMO.map(([r, e]) => (
            <button type="button" key={e} className="demo-chip" onClick={() => { setEmail(e); setPassword('Password@123'); }}><strong>{r}</strong><br />{e}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
