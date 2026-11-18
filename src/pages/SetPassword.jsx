import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api, { errMsg } from '../services/api';
import { Alert } from '../components/ui';

export default function SetPassword({ isReset = false }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const passwordsMatch = Boolean(confirmPassword) && password === confirmPassword;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!token) {
      setError(`This password ${isReset ? 'reset' : 'setup'} link is missing its token.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      await api.post(isReset ? '/auth/reset-password' : '/auth/setup-password', { token, newPassword: password });
      navigate('/login', { replace: true, state: isReset ? { passwordResetComplete: true } : { passwordSetupComplete: true } });
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login-page password-page">
      <section className="login-showcase password-showcase" aria-label="Secure account setup">
        <div className="login-showcase-glow login-showcase-glow-one" />
        <div className="login-showcase-glow login-showcase-glow-two" />
        <Link className="login-brand password-brand" to="/login" aria-label="EERMS home">
          <span className="login-brand-mark" aria-hidden="true">E</span>
          <span>EERMS</span>
        </Link>

        <div className="login-showcase-copy password-showcase-copy">
          <span className="login-eyebrow"><span /> ACCOUNT SECURITY</span>
          <h1>A safer way<br />to get started.</h1>
          <p>Choose a password that’s easy for you to remember and hard for anyone else to guess.</p>
        </div>

        <div className="password-visual" aria-hidden="true">
          <div className="password-visual-orbit" />
          <div className="password-visual-card">
            <div className="password-visual-lock"><span /></div>
            <div>
              <span className="password-visual-label">YOUR ACCOUNT</span>
              <strong>Protected from day one</strong>
            </div>
            <span className="password-visual-check">✓</span>
          </div>
          <span className="password-visual-spark">✦</span>
        </div>

        <div className="login-showcase-footer">
          <span>BUILT FOR ABC SOLUTIONS</span>
          <span className="login-footer-line" />
          <span>SECURE SIGN-IN</span>
        </div>
      </section>

      <section className="login-panel password-panel" aria-labelledby="password-title">
        <div className="login-form-wrap">
          <div className="login-mobile-brand">
            <span className="login-brand-mark" aria-hidden="true">E</span>
            <span>EERMS</span>
          </div>
          <div className="login-heading">
            <span className="login-heading-label">{isReset ? 'PASSWORD RESET' : 'FIRST THINGS FIRST'}</span>
            <h2 id="password-title">{isReset ? 'Choose a new password' : 'Create your password'}</h2>
            <p>{isReset ? 'Set a new password to get back into your account.' : 'Set a password to access your account.'}</p>
          </div>

          <Alert>{error}</Alert>

          <form className="login-form" onSubmit={submit}>
            <div className="login-field">
              <label className="form-label" htmlFor="new-password">New password</label>
              <div className="login-password-wrap">
                <input
                  className="form-control"
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
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

            <div className="login-field">
              <label className="form-label" htmlFor="confirm-password">Confirm new password</label>
              <div className="login-password-wrap">
                <input
                  className="form-control"
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Enter your password again"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  aria-describedby="password-requirements"
                />
                <button
                  className="login-password-toggle"
                  type="button"
                  onClick={() => setShowConfirmPassword((shown) => !shown)}
                  aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                  aria-pressed={showConfirmPassword}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <ul className="password-requirements" id="password-requirements" aria-live="polite">
              <li className={password.length >= 8 ? 'is-valid' : ''}>
                <span aria-hidden="true">{password.length >= 8 ? '✓' : '•'}</span>
                Use at least 8 characters
              </li>
              <li className={passwordsMatch ? 'is-valid' : ''}>
                <span aria-hidden="true">{passwordsMatch ? '✓' : '•'}</span>
                Make sure both passwords match
              </li>
            </ul>

            <button className="btn btn-purple login-submit" type="submit" disabled={busy}>
              {busy ? 'Saving password…' : isReset ? 'Reset password' : 'Set password'}
              {!busy && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <div className="login-security-note">
            <span className="login-security-icon" aria-hidden="true">✓</span>
            <span>Your password is encrypted and kept private.</span>
          </div>
          <Link className="password-back-link" to="/login">Back to sign in</Link>
        </div>
        <div className="login-panel-footer">© {new Date().getFullYear()} ABC Solutions <span>·</span> Employee Expense Reimbursement</div>
      </section>
    </main>
  );
}
