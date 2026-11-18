import React, { useEffect, useState } from 'react';
import api from '../services/api';

export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
export const fmtDT = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
export const CATS = {
  PLANE: 'Transport – By Plane', TRAIN: 'Transport – By Train', ROAD: 'Transport – By Road', MEALS: 'Meals & Dining', HOTEL: 'Hotel Stays', SUPPLIES: 'Office Supplies',
};
export const ago = (d) => {
  const h = (Date.now() - new Date(d)) / 3600000;
  return h < 1 ? `${Math.max(1, Math.round(h * 60))}m` : h < 48 ? `${Math.round(h)}h` : `${Math.round(h / 24)}d`;
};

const STATUS = {
  DRAFT: 'secondary', SUBMITTED: 'info', UNDER_REVIEW: 'warning', INFO_REQUESTED: 'warning', APPROVED: 'success', REJECTED: 'danger', PAID: 'success',
  Pending: 'warning', Verified: 'success', Rejected: 'danger', active: 'success', frozen: 'secondary', pending: 'warning', invited: 'info',
};
export const StatusBadge = ({ s }) => (
  <span
    className={`badge rounded-pill text-bg-${STATUS[s] || 'secondary'} d-inline-flex align-items-center justify-content-center`}
  >
    {String(s).replace('_', ' ')}
  </span>
);

export const Flags = ({ flags = [] }) => (
  <>{flags.map((f) => (
    <span key={f.code} className={`badge me-1 ${['HIGH_VALUE', 'RECEIPT_DUPLICATE'].includes(f.code) ? 'text-bg-danger' : 'text-bg-warning'}`} title={f.label}>{f.label}</span>
  ))}</>
);

export const PageHeader = ({ title, sub, children, actionsClassName = '' }) => (
  <div className="d-flex flex-wrap justify-content-between align-items-end mb-4 gap-2">
    <div><h2 className="h4 fw-bold mb-1">{title}</h2>{sub && <div className="text-muted">{sub}</div>}</div>
    <div className={`d-flex gap-2 ${actionsClassName}`}>{children}</div>
  </div>
);

export const Alert = ({ type = 'danger', children, onClose }) =>
  children ? <div className={`alert alert-${type} d-flex justify-content-between`}><div>{children}</div>{onClose && <button className="btn-close" onClick={onClose} />}</div> : null;

// Fetch an authenticated file as a blob URL
export function useBlobUrl(path) {
  const [state, setState] = useState({ url: null, type: null, err: null });
  useEffect(() => {
    if (!path) { setState({ url: null, type: null, err: null }); return undefined; }
    let u; let live = true;
    api.get(path, { responseType: 'blob' }).then((r) => {
      if (!live) return;
      u = URL.createObjectURL(r.data);
      setState({ url: u, type: r.data.type, err: null });
    }).catch(() => live && setState({ url: null, type: null, err: 'Could not load file' }));
    return () => { live = false; if (u) URL.revokeObjectURL(u); };
  }, [path]);
  return state;
}

export function FileViewer({ path, zoom = 1, rotation = 0 }) {
  const { url, type, err } = useBlobUrl(path);
  if (err) return <div className="text-danger p-4">{err}</div>;
  if (!url) return <div className="text-muted p-4">Loading…</div>;
  if (type === 'application/pdf') {
    return (
      <div style={{ overflow: 'auto', maxHeight: 560 }}>
        <iframe title="file" src={url} style={{ width: '100%', height: 560, border: 0, transform: `scale(${zoom}) rotate(${rotation}deg)`, transformOrigin: 'center center' }} />
      </div>
    );
  }
  return <div style={{ overflow: 'auto', maxHeight: 560 }}><img alt="receipt" src={url} style={{ width: `${zoom * 100}%`, maxWidth: 'none', transform: `rotate(${rotation}deg)`, transformOrigin: 'center center' }} /></div>;
}

export function downloadText(name, text, mime = 'text/csv') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: mime }));
  a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function useClaimPaths() {
  return {
    list: '/employee/dashboard',
    add: '/employee/new-claim',
    detail: (id) => `/employee/claims/${id}`,
    edit: (id) => `/employee/claims/${id}/edit`,
  };
}

export const Stat = ({ label, value, tone = 'purple', sub }) => (
  <div className="card stat h-100"><div className="card-body"><div className="small text-muted fw-semibold text-uppercase">{label}</div>
    <div className={`display-6 fw-bold text-${tone}`}>{value}</div>{sub && <div className="small text-muted">{sub}</div>}</div></div>
);

export const initials = (n = '') => n.split(' ').filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase();
export const Avatar = ({ name, lg }) => <span className={`avatar ${lg ? 'lg' : ''}`}>{initials(name)}</span>;

// Gradient "briefing" banner shown at the top of each dashboard
export function Hero({ eyebrow, children, chips = [] }) {
  return (
    <div className="hero">
      <div className="eyebrow"><span className="dot" />{eyebrow}</div>
      <h2>{children}</h2>
      {chips.length > 0 && (
        <div className="hero-chips">
          {chips.slice(0, 3).map((c, i) => (
            <div className="hero-chip" key={i}><Avatar name={c.avatar || c.title} />
              <div style={{ minWidth: 0 }}><div className="t">{c.title}</div><div className="s">{c.sub}</div></div></div>))}
        </div>)}
    </div>
  );
}
