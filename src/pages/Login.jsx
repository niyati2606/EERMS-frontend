import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../services/api';
import { Alert } from '../components/ui';

export default function Login() {
  const { login, takeNotice } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState('');
  const isPasswordJustSet = Boolean(location.state?.passwordSetupComplete || location.state?.passwordResetComplete);
  const [notice] = useState(() => {
    if (isPasswordJustSet) {
      localStorage.removeItem('eerms2_notice');
      return '';
    }
    return takeNotice();
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { nav(await login(email, password), { replace: true }); } catch (x) {
      const message = errMsg(x);
      setErr(/user not found/i.test(message) ? 'Invalid email or password' : message);
    } finally { setBusy(false); }
  };

  return (
      <main className="login-page">
        <section className="login-showcase" aria-label="About EERMS">
          <div className="login-showcase-glow login-showcase-glow-one" />
          <div className="login-showcase-glow login-showcase-glow-two" />
          <div className="login-brand">
            <span className="login-brand-mark" aria-hidden="true">E</span>
            <span>EERMS</span>
          </div>

          <div className="login-showcase-copy">
            <span className="login-eyebrow"><span /> EXPENSES, MADE SIMPLE</span>
            <h1>Business travel,<br />streamlined</h1>
            <p>Manage employee expenses and reimbursements in one clear, secure place.</p>
          </div>

          <div className="login-visual" aria-hidden="true">
            <div className="login-visual-orbit login-visual-orbit-one" />
            <div className="login-visual-orbit login-visual-orbit-two" />
            <div className="login-visual-card">
              <div className="login-visual-card-top">
                <span className="login-visual-icon">↗</span>
                <span className="login-visual-card-label">REIMBURSEMENTS</span>
                <span className="login-visual-dots">•••</span>
              </div>
              <div className="login-visual-lines">
                <span /><span /><span />
              </div>
              <div className="login-visual-card-bottom">
                <span className="login-visual-avatar">✓</span>
                <span>Everything in its place</span>
                <span className="login-visual-check">✓</span>
              </div>
            </div>
            <span className="login-visual-spark login-visual-spark-one">✳</span>
            <span className="login-visual-spark login-visual-spark-two">✦</span>
          </div>

          <div className="login-showcase-footer">
            <span>BUILT FOR ABC SOLUTIONS</span>
            <span className="login-footer-line" />
            <span>EMPLOYEE EXPENSES</span>
          </div>
        </section>

        <section className="login-panel" aria-labelledby="login-title">
          <div className="login-form-wrap">
            <div className="login-mobile-brand">
              <span className="login-brand-mark" aria-hidden="true">E</span>
              <span>EERMS</span>
            </div>
            <div className="login-heading">
              <span className="login-heading-label">WELCOME BACK</span>
              <h2 id="login-title">Sign in to your account</h2>
              <p>Enter your work email and password to continue.</p>
            </div>

            {!isPasswordJustSet && <Alert type="warning">{notice}</Alert>}
            {location.state?.passwordSetupComplete && <Alert type="success">Password set successfully. You can now sign in.</Alert>}
            {location.state?.passwordResetComplete && <Alert type="success">Password reset successfully. You can now sign in.</Alert>}
            <Alert>{err}</Alert>

            <form className="login-form" onSubmit={submit}>
              <div className="login-field">
                <label className="form-label" htmlFor="login-email">Work email</label>
                <input
                  className="form-control"
                  id="login-email"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="login-field">
                <label className="form-label" htmlFor="login-password">Password</label>
                <div className="login-password-wrap">
                  <input
                    className="form-control"
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    className="login-password-toggle"
                    type="button"
                    onClick={() => setShowPassword((shown) => !shown)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div className="text-end mb-3">
                <Link to="/forgot-password">Forgot password?</Link>
              </div>
              <button className="btn btn-purple login-submit" type="submit" disabled={busy}>
                {busy ? 'Signing in…' : 'Sign in'}
                {!busy && <span aria-hidden="true">→</span>}
              </button>
            </form>

            <div className="login-security-note">
              <span className="login-security-icon" aria-hidden="true">✓</span>
              <span>Your account is protected with secure sign-in.</span>
            </div>
          </div>
          <div className="login-panel-footer">© {new Date().getFullYear()} ABC Solutions <span>·</span> Employee Expense Reimbursement</div>
        </section>
      </main>
  );
}
