import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api, { errMsg } from '../services/api';
import { Alert } from '../components/ui';

export default function SetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!token) {
      setError('This password setup link is missing its token.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      await api.post('/auth/setup-password', { token, newPassword: password });
      navigate('/login', { replace: true, state: { passwordSetupComplete: true } });
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="card login-card">
        <h1 className="h3 fw-bold text-purple mb-1">Set your password</h1>
        <p className="text-muted">Create a password for your EERMS employee account.</p>
        <Alert>{error}</Alert>
        <form onSubmit={submit}>
          <label className="form-label fw-semibold">New password</label>
          <input className="form-control mb-3" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
          <label className="form-label fw-semibold">Confirm new password</label>
          <input className="form-control mb-3" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <button className="btn btn-purple w-100" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Set password'}</button>
        </form>
      </div>
    </div>
  );
}
