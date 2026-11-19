import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FiGrid, FiPlusCircle, FiList, FiInbox, FiCreditCard, FiUsers, FiUserPlus, FiShield, FiBarChart2, FiClipboard, FiBell, FiLogOut, FiUser, FiMenu, FiX, FiClock } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { fmtDT, Avatar } from './ui';
import PasswordChangeForm from './PasswordChangeForm';

const NAV = {
  employee: [['/employee/dashboard', 'My Claims', FiList],
  //  ['/employee/new-claim', 'New Claim', FiPlusCircle],
    ['/employee/profile', 'My Profile', FiUser]],
  finance: [['/finance/dashboard', 'Shared Queue', FiInbox], ['/finance/history', 'Claim History', FiClock], ['/finance/payments', 'Payments', FiCreditCard]],
  hr: [['/hr/dashboard', 'Today', FiGrid], ['/hr/employees', 'Employees', FiUsers],
  //  ['/hr/employees/new', 'Add Employee', FiUserPlus], 
  ['/hr/finance/employees', 'Finance Employees', FiUsers],
  // ['/hr/finance', 'Add Finance Employees', FiCreditCard],
  ['/hr/bank-verification', 'Bank Verification', FiShield]],
  admin: [['/admin/dashboard', 'Spend Analytics', FiBarChart2], ['/admin/audit', 'Audit Trail', FiClipboard]],
};
const ROLE = { employee: 'Employee', finance: 'Finance Officer', hr: 'HR Administrator', admin: 'Admin / Executive' };

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [n, setN] = useState({ unread: 0, items: [] });
  const [open, setOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [passwordPrompt, setPasswordPrompt] = useState(user.role === 'employee' && user.mustChange);
  const last = useRef(0);
  const h = new Date().getHours();
  const hello = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    let live = true;
    const poll = () => api.get('/notifications').then((r) => {
      if (!live) return;
      setN(r.data);
      if (r.data.unread > last.current && r.data.items[0]) { setToast(r.data.items[0]); setTimeout(() => setToast(null), 6000); }
      last.current = r.data.unread;
    }).catch(() => { });
    poll();
    const t = setInterval(poll, 10000);
    return () => { live = false; clearInterval(t); };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('mobile-nav-open', mobileNavOpen);
    return () => document.body.classList.remove('mobile-nav-open');
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const closeOnResize = () => setMobileNavOpen(false);
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMobileNavOpen(false);
    };
    window.addEventListener('resize', closeOnResize);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('resize', closeOnResize);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [mobileNavOpen]);

  const markRead = () => api.post('/notifications/read').then(() => { setN((x) => ({ ...x, unread: 0 })); last.current = 0; });
  return (
    <div className="app-shell">
      {mobileNavOpen && <button className="sidebar-backdrop" type="button" aria-label="Close navigation menu" onClick={() => setMobileNavOpen(false)} />}
      <aside className={`sidebar${mobileNavOpen ? ' is-open' : ''}`} id="app-navigation" aria-label="Main navigation">
        <div className="ws-card"><div className="ws-logo">E</div><div><div className="ws-name">EERMS</div><div className="ws-sub">ABC Solutions</div></div></div>
        {/* <div className="sidebar-intro">
          <div className="date-label">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <h1 className="sidebar-greeting">{hello}, {user.fullName.split(' ')[0]}</h1>
        </div> */}
        <div className="nav-label">WORKSPACE</div>
        <nav className="nav flex-column">
          {NAV[user.role].map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end className="nav-link side-link" onClick={() => setMobileNavOpen(false)}><Icon className="me-2" />{label}</NavLink>
          ))}
        </nav>
        <div className="mt-auto">
          <div className="agent-card">● Secure account</div>
          <div className="user-chip"><Avatar name={user.fullName} lg />
            <div style={{ minWidth: 0 }}><div className="fw-semibold text-truncate">{user.fullName}</div><div className="small" style={{ opacity: .65 }}>{ROLE[user.role]}</div></div></div>
          <button className="nav-link side-link sidebar-logout" type="button" onClick={() => { setMobileNavOpen(false); logout(); nav('/login'); }}>
            <FiLogOut className="me-2" />Sign out
          </button>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <button
            className="mobile-nav-toggle"
            type="button"
            aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-controls="app-navigation"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((isOpen) => !isOpen)}
          >
            {mobileNavOpen ? <FiX /> : <FiMenu />}
          </button>
          <h1 className="topbar-tagline">Business travel, streamlined</h1>
          <div className="topbar-notifications position-relative">
            <button className="bell-btn" onClick={() => { setOpen(!open); if (!open && n.unread) markRead(); }} aria-label="Notifications">
              <FiBell />{n.unread > 0 && <span className="badge text-bg-danger position-absolute top-0 start-100 translate-middle rounded-pill" style={{ background: '#e5484d !important', color: '#fff' }}>{n.unread}</span>}
            </button>
            {open && (
              <div className="card shadow notif-panel"><div className="card-header">Notifications</div>
                <div className="list-group list-group-flush">
                  {n.items.length === 0 && <div className="list-group-item text-muted">Nothing yet</div>}
                  {n.items.map((i) => (
                    <button key={i.id} className="list-group-item list-group-item-action small" onClick={() => { setOpen(false); if (i.link) nav(i.link); }}>
                      {i.message}<div className="text-muted">{fmtDT(i.at)}</div>
                    </button>
                  ))}
                </div></div>
            )}
          </div>
        </header>
        <main className="content"><Outlet /></main>
      </div>
      {toast && <div className="toast-box shadow" onClick={() => { setToast(null); if (toast.link) nav(toast.link); }}><strong>New alert</strong><div>{toast.message}</div></div>}
      {passwordPrompt && user.role === 'employee' && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ background: 'rgba(20, 16, 45, .55)', zIndex: 1100 }}>
          <div className="card w-100" style={{ maxWidth: 480 }}>
            <div className="card-header d-flex align-items-center justify-content-between">
              <span>Change your temporary password</span>
              <button type="button" className="btn-close" aria-label="Close" onClick={() => setPasswordPrompt(false)} />
            </div>
            <div className="card-body">
              <p className="text-muted">For account security, change the temporary password provided with your account. You can do this later from My Profile.</p>
              <PasswordChangeForm onSuccess={() => setPasswordPrompt(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
