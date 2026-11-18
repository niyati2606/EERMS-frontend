import api from './api';

export const getNextEmployeeCode = () => api.get('/hr/next-employee-code').then((r) => r.data.code);
export const getActiveEmployees = () => api.get('/hr/employees', { params: { status: 'active' } }).then((r) => r.data);
export const getHrMeta = () => api.get('/hr/meta').then((r) => r.data);

export function createEmployee(d) {
  return api.post('/hr/employees', {
    fullName: d.fullName.trim(),
    email: d.email.trim(),
    phoneNumber: d.phoneNumber.trim(),
    branchLocation: d.branchLocation,
    joiningDate: d.joiningDate,
    accountHolderName: d.accountHolderName.trim(),
    bankName: d.bankName.trim(),
    accountNumber: d.accountNumber.trim(),
    ifscCode: d.ifscCode.trim().toUpperCase(),
  });
}

export const getFinanceStaff = () => api.get('/hr/finance').then((r) => r.data);
export const createFinanceStaff = (d) => api.post('/hr/finance', d);
export const updateFinanceStaff = (id, d) => api.put(`/hr/finance/${id}`, d).then((r) => r.data);
export const resendSetupEmail = (id) => api.post(`/hr/employees/${id}/resend-setup`).then((r) => r.data);
