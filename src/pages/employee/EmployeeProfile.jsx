import React, { useEffect, useState } from 'react';
import api, { errMsg } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PasswordChangeForm from '../../components/PasswordChangeForm';
import { Alert, PageHeader, StatusBadge, fmtDate } from '../../components/ui';

const EMPTY_BANK = { accountHolder: '', bankName: '', accountNumber: '', ifsc: '' };

export default function EmployeeProfile() {
  const { syncUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [personal, setPersonal] = useState({ fullName: '', phone: '' });
  const [bank, setBank] = useState(EMPTY_BANK);
  const [cheque, setCheque] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await api.get('/employee/profile');
    setProfile(data);
    setPersonal({ fullName: data.employee.fullName || '', phone: data.employee.phone || '' });
    setBank({ ...EMPTY_BANK, ...(data.bank || {}) });
  };

  useEffect(() => {
    load().catch((e) => setError(errMsg(e)));
  }, []);

  const savePersonal = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const { data } = await api.put('/employee/profile', personal);
      setProfile(data);
      setPersonal({ fullName: data.employee.fullName || '', phone: data.employee.phone || '' });
      syncUser(data.employee);
      setMessage('Personal details updated.');
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const saveBank = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const form = new FormData();
      form.append('accountHolder', bank.accountHolder);
      form.append('bankName', bank.bankName);
      form.append('accountNumber', bank.accountNumber);
      form.append('ifsc', bank.ifsc.toUpperCase());
      form.append('chequeFile', cheque);
      const { data } = await api.put('/employee/profile/bank', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile(data);
      setBank({ ...EMPTY_BANK, ...(data.bank || {}) });
      setCheque(null);
      setFileInputKey((key) => key + 1);
      setMessage(data.message);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  if (!profile && !error) return <div className="text-muted">Loading profile…</div>;

  const employee = profile?.employee;
  const currentBank = profile?.bank;

  return (
    <>
      <PageHeader title="My profile" sub="View and update your personal and payout details." />
      <Alert onClose={() => setError('')}>{error}</Alert>
      <Alert type="success" onClose={() => setMessage('')}>{message}</Alert>

      {employee && (
        <div className="row g-3">
          <div className="col-lg-6">
            <div className="card h-100">
              <div className="card-header">Personal and work details</div>
              <div className="card-body">
                <form onSubmit={savePersonal}>
                  <div className="row g-3">
                    <div className="col-md-6"><label className="form-label fw-semibold">Employee code</label><input className="form-control" value={employee.empCode} readOnly /></div>
                    <div className="col-md-6"><label className="form-label fw-semibold">Official email</label><input className="form-control" value={employee.email} readOnly /></div>
                    <div className="col-md-6"><label className="form-label fw-semibold">Full name</label><input className="form-control" maxLength={150} required value={personal.fullName} onChange={(e) => setPersonal({ ...personal, fullName: e.target.value })} /></div>
                    <div className="col-md-6"><label className="form-label fw-semibold">Phone</label><input className="form-control" maxLength={20} value={personal.phone} onChange={(e) => setPersonal({ ...personal, phone: e.target.value })} /></div>
                    <div className="col-md-6"><label className="form-label fw-semibold">Date of joining</label><input className="form-control" value={fmtDate(employee.joiningDate)} readOnly /></div>
                    <div className="col-md-6"><label className="form-label fw-semibold">Designation</label><input className="form-control" value={employee.designation || ''} readOnly /></div>
                    <div className="col-md-6"><label className="form-label fw-semibold">Department</label><input className="form-control" value={employee.department || ''} readOnly /></div>
                    <div className="col-md-6"><label className="form-label fw-semibold">Cost center</label><input className="form-control" value={employee.costCenter || ''} readOnly /></div>
                    <div className="col-md-6"><label className="form-label fw-semibold">Branch</label><input className="form-control" value={employee.branch || ''} readOnly /></div>
                    <div className="col-md-6"><label className="form-label fw-semibold">Reporting manager</label><input className="form-control" value={employee.reportingManager || 'None'} readOnly /></div>
                  </div>
                  <button className="btn btn-purple mt-3" type="submit" disabled={busy}>Save personal details</button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card h-100">
              <div className="card-header d-flex justify-content-between align-items-center">
                <span>Bank details</span>{currentBank && <StatusBadge s={currentBank.status} />}
              </div>
              <div className="card-body">
                {currentBank && (
                  <div className="small text-muted mb-3">
                    Current account: {currentBank.bankName} · ending {currentBank.accountNumber.slice(-4)}
                    {currentBank.chequeFileName && <div>Cancelled cheque: {currentBank.chequeFileName}</div>}
                    {currentBank.rejectReason && <div className="text-danger mt-1">Update requested: {currentBank.rejectReason}</div>}
                  </div>
                )}
                <p className="small text-muted">To add or change payout details, upload a new cancelled cheque. Updated details require HR verification before payouts.</p>
                <form onSubmit={saveBank}>
                  <label className="form-label fw-semibold">Account holder name</label>
                  <input className="form-control mb-3" required maxLength={150} value={bank.accountHolder} onChange={(e) => setBank({ ...bank, accountHolder: e.target.value })} />
                  <label className="form-label fw-semibold">Bank name</label>
                  <input className="form-control mb-3" required maxLength={100} value={bank.bankName} onChange={(e) => setBank({ ...bank, bankName: e.target.value })} />
                  <div className="row">
                    <div className="col-md-7"><label className="form-label fw-semibold">Account number</label><input className="form-control mb-3" required inputMode="numeric" minLength={9} maxLength={18} value={bank.accountNumber} onChange={(e) => setBank({ ...bank, accountNumber: e.target.value.replace(/\D/g, '') })} /></div>
                    <div className="col-md-5"><label className="form-label fw-semibold">IFSC</label><input className="form-control mb-3 text-uppercase" required maxLength={11} value={bank.ifsc} onChange={(e) => setBank({ ...bank, ifsc: e.target.value.toUpperCase() })} /></div>
                  </div>
                  <label className="form-label fw-semibold">New cancelled cheque (JPG, PNG or PDF; max 2 MB)</label>
                  <input key={fileInputKey} className="form-control mb-3" type="file" accept=".jpg,.jpeg,.png,.pdf" required onChange={(e) => setCheque(e.target.files[0] || null)} />
                  <button className="btn btn-purple" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save bank details for verification'}</button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card">
              <div className="card-header">Change password</div>
              <div className="card-body"><PasswordChangeForm /></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
