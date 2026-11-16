import api from './api';

export const getNextEmployeeCode = () => api.get('/hr/next-employee-code').then((r) => r.data.code);
export const getActiveEmployees = () => api.get('/hr/employees', { params: { status: 'active' } }).then((r) => r.data);
export const getHrMeta = () => api.get('/hr/meta').then((r) => r.data);

// The employee form remains multipart because the route accepts optional cheque uploads.
export function createEmployee(d) {
  const fd = new FormData();
  fd.append('fullName', d.fullName.trim());
  fd.append('email', d.email.trim());
  fd.append('phoneNumber', d.phoneNumber.trim());
  fd.append('joiningDate', d.joiningDate);
  fd.append('branchLocation', d.branchLocation);
  fd.append('accountHolderName', d.accountHolderName.trim());
  fd.append('bankName', d.bankName.trim());
  fd.append('accountNumber', d.accountNumber.trim());
  fd.append('ifscCode', d.ifscCode.trim().toUpperCase());
  return api.post('/hr/employees', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
}
