import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../services/api';
import { Alert } from './ui';

export default function PasswordChangeForm({ onSuccess }) {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Password updated successfully.');
      if (onSuccess) onSuccess();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <Alert>{error}</Alert>
      <Alert type="success">{message}</Alert>
      <label className="form-label fw-semibold">Current password</label>
      <input className="form-control mb-3" type="password" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
      <label className="form-label fw-semibold">New password</label>
      <input className="form-control mb-3" type="password" autoComplete="new-password" minLength={8} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
      <label className="form-label fw-semibold">Confirm new password</label>
      <input className="form-control mb-3" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
      <button className="btn btn-purple" type="submit" disabled={busy}>{busy ? 'Updating…' : 'Update password'}</button>
    </form>
  );
}
