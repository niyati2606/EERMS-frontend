import React from 'react';
import { Link } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import EmployeeTable from '../../components/EmployeeTable';
import { PageHeader } from '../../components/ui';

export default function EmployeeList() {
  return (
    <>
      <PageHeader title="Employees" sub="Search, filter and manage employee records.">
        <Link className="btn btn-purple btn-lg rounded-pill px-4" to="/hr/employees/new"><FiPlus className="me-2" />Add employee</Link>
      </PageHeader>
      <EmployeeTable />
    </>
  );
}
