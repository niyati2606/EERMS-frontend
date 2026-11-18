import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../services/api';
import { Alert } from '../components/ui';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.post('/auth/request-password-reset', { email });
      setSent(true);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="card login-card">
        <h1 className="h3 fw-bold text-purple mb-1">Forgot your password?</h1>
        {sent ? (
          <>
            <p className="text-muted">If an active account uses that email, we’ve sent a password reset link. Check your inbox.</p>
            <Link className="btn btn-purple w-100" to="/login">Back to sign in</Link>
          </>
        ) : (
          <>
            <p className="text-muted">Enter your work email and we’ll send you a link to reset your password.</p>
            <Alert>{error}</Alert>
            <form onSubmit={submit}>
              <label className="form-label fw-semibold" htmlFor="reset-email">Work email</label>
              <input
                className="form-control mb-3"
                id="reset-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <button className="btn btn-purple w-100 mb-3" type="submit" disabled={busy}>
                {busy ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
            <Link to="/login">Back to sign in</Link>
          </>
        )}
      </div>
    </div>
  );
}
