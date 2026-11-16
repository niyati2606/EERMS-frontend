import React, { useEffect, useState } from 'react';

export default function FreezeEmployeeModal({ employee, busy, error, onClose, onConfirm }) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    setReason('');
  }, [employee]);

  if (!employee) return null;

  return (
    <div className="modal d-block" tabIndex="-1" role="dialog" aria-modal="true" aria-labelledby="freeze-employee-title" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="modal-dialog modal-dialog-centered" role="document">
        <form className="modal-content" onSubmit={(event) => { event.preventDefault(); onConfirm(reason.trim()); }}>
          <div className="modal-header">
            <h2 className="modal-title fs-5" id="freeze-employee-title">Freeze employee</h2>
            <button type="button" className="btn-close" aria-label="Close" disabled={busy} onClick={onClose} />
          </div>
          <div className="modal-body">
            <p>Enter a reason for freezing <strong>{employee.fullName}</strong>. Their login will be disabled.</p>
            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            <label className="form-label fw-semibold" htmlFor="freeze-reason">Reason <span className="text-danger">*</span></label>
            <textarea id="freeze-reason" className="form-control" rows="3" maxLength={500} required value={reason} onChange={(event) => setReason(event.target.value)} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-light border" disabled={busy} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-danger" disabled={busy || !reason.trim()}>{busy ? 'Freezing…' : 'Freeze employee'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
