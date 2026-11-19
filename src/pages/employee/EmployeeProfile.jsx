import React, { useEffect, useState } from 'react';
import api, { errMsg } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Alert, PageHeader, StatusBadge, LoadingSkeleton } from '../../components/ui';
import { isValidPersonName } from '../../utils/validation';

export default function EmployeeProfile() {
  const { syncUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [personal, setPersonal] = useState({ fullName: '', phone: '' });
  const [nameError, setNameError] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await api.get('/employee/profile');
    setProfile(data);
    setPersonal({ fullName: data.employee.fullName || '', phone: data.employee.phone || '' });
  };

  useEffect(() => {
    load().catch((e) => setError(errMsg(e)));
  }, []);

  const savePersonal = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!isValidPersonName(personal.fullName)) {
      setNameError('Full name can contain letters and spaces only.');
      return;
    }
    setNameError('');
    setBusy(true);
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

  if (!profile && !error) return <LoadingSkeleton variant="detail" />;

  const employee = profile?.employee;
  const currentBank = profile?.bank;

  return (
    <>
      <PageHeader title="My profile" sub="View your work and payout details, and update your personal details." />
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
                    <div className="col-md-6"><label className="form-label fw-semibold">Employee code</label><div className="form-control-plaintext mb-0">{employee.empCode}</div></div>
                    <div className="col-md-6"><label className="form-label fw-semibold">Official email</label><div className="form-control-plaintext mb-0">{employee.email}</div></div>
                    <div className="col-md-6"><label className="form-label fw-semibold">Full name</label><input className={`form-control${nameError ? ' is-invalid' : ''}`} maxLength={150} required value={personal.fullName} aria-invalid={Boolean(nameError)} aria-describedby={nameError ? 'profile-name-error' : undefined} onChange={(e) => { setPersonal({ ...personal, fullName: e.target.value }); setNameError(e.target.value && !isValidPersonName(e.target.value) ? 'Full name can contain letters and spaces only.' : ''); }} />
                      {nameError && <div className="invalid-feedback d-block" id="profile-name-error">{nameError}</div>}</div>
                    <div className="col-md-6"><label className="form-label fw-semibold">Phone</label><input className="form-control" maxLength={20} value={personal.phone} onChange={(e) => setPersonal({ ...personal, phone: e.target.value })} /></div>
                    <div className="col-md-6"><label className="form-label fw-semibold">Branch</label><div className="form-control-plaintext mb-0">{employee.branch || '—'}</div></div>
                    <div className="col-md-6"><label className="form-label fw-semibold">Joining date</label><div className="form-control-plaintext mb-0">{(() => { const m = String(employee.joiningDate || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}/${m[2]}/${m[1]}` : '—'; })()}</div></div>
                  </div>
                  <div className="d-flex justify-content-end mt-3">
                    <button className="btn btn-purple" type="submit" disabled={busy}>Save personal details</button>
                  </div>
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
                <p className="small text-muted">To update your bank details, please contact your HR team.</p>
                {currentBank ? (
                  <>
                    <dl className="mb-0">
                      <dt>Account holder</dt><dd>{currentBank.accountHolder}</dd>
                      <dt>Bank name</dt><dd>{currentBank.bankName}</dd>
                      <dt>Account number</dt><dd>Ending {currentBank.accountNumber.slice(-4)}</dd>
                      <dt>IFSC</dt><dd>{currentBank.ifsc}</dd>
                    </dl>
                    {currentBank.rejectReason && <div className="text-danger mt-2">Update requested: {currentBank.rejectReason}</div>}
                  </>
                ) : <p className="text-muted mb-0">No bank details on file.</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
