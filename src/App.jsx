import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import SetPassword from './pages/SetPassword';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeProfile from './pages/employee/EmployeeProfile';
import NewClaim from './pages/employee/NewClaim';
import ClaimDetail from './pages/employee/ClaimDetail';
import FinanceDashboard from './pages/finance/FinanceDashboard';
import ClaimReview from './pages/finance/ClaimReview';
import Payments from './pages/finance/Payments';
import HrDashboard from './pages/hr/HrDashboard';
import EmployeeList from './pages/hr/EmployeeList';
import EmployeeDetail from './pages/hr/EmployeeDetail';
import AddEmployee from './pages/hr/AddEmployee';
import BankVerification from './pages/hr/BankVerification';
import AdminDashboard from './pages/admin/AdminDashboard';
import AuditLog from './pages/admin/AuditLog';

const HOME = { employee: '/employee/dashboard', finance: '/finance/dashboard', hr: '/hr/dashboard', admin: '/admin/dashboard' };

function Guard({ roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={HOME[user.role]} replace />;
  return <Layout />;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={HOME[user.role]} replace /> : <Login />} />
      <Route path="/set-password" element={<SetPassword />} />
      <Route element={<Guard roles={['employee']} />}>
        <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
        <Route path="/employee/profile" element={<EmployeeProfile />} />
        <Route path="/employee/new-claim" element={<NewClaim />} />
        <Route path="/employee/claims/:id" element={<ClaimDetail />} />
        <Route path="/employee/claims/:id/edit" element={<NewClaim />} />
      </Route>
      <Route element={<Guard roles={['finance']} />}>
        <Route path="/finance/dashboard" element={<FinanceDashboard />} />
        <Route path="/finance/review/:id" element={<ClaimReview />} />
        <Route path="/finance/payments" element={<Payments />} />
      </Route>
      <Route element={<Guard roles={['hr']} />}>
        <Route path="/hr/dashboard" element={<HrDashboard />} />
        <Route path="/hr/employees" element={<EmployeeList />} />
        <Route path="/hr/employees/new" element={<AddEmployee />} />
        <Route path="/hr/employees/:id" element={<EmployeeDetail />} />
        <Route path="/hr/bank-verification" element={<BankVerification />} />
      </Route>
      <Route element={<Guard roles={['admin']} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/audit" element={<AuditLog />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? HOME[user.role] : '/login'} replace />} />
    </Routes>
  );
}
