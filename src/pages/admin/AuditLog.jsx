import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { PageHeader, LoadingSkeleton, fmtDT } from '../../components/ui';

export default function AuditLog() {
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [d, setD] = useState(null);
  useEffect(() => {
    const t = setTimeout(() => api.get('/admin/audit-log', { params: { q, from: from || undefined, to: to || undefined } }).then((r) => setD(r.data)), 250);
    return () => clearTimeout(t);
  }, [q, from, to]);
  return (
    <>
      <PageHeader title="Immutable audit trail" sub="Hash-chained log of every user action, timestamp and IP">
        {d && <span className={`badge fs-6 align-self-center ${d.chainValid ? 'text-bg-success' : 'text-bg-danger'}`}>{d.chainValid ? '✓ Chain intact' : '✗ Chain broken'} · {d.total} entries</span>}
      </PageHeader>
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <input className="form-control" style={{ maxWidth: 340 }} placeholder="Search claim ID, employee, action…" value={q} onChange={(e) => setQ(e.target.value)} />
        <input type="date" className="form-control" style={{ maxWidth: 170 }} value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" className="form-control" style={{ maxWidth: 170 }} value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      {!d ? <LoadingSkeleton variant="table" rows={6} /> : <div className="card"><div className="table-responsive"><table className="table table-sm align-middle mb-0">
        <thead><tr><th>#</th><th>Time</th><th>Actor</th><th>Action</th><th>Entity</th><th>Detail</th><th>IP</th><th>Hash</th></tr></thead>
        <tbody>{d?.entries.map((e) => (
          <tr key={e.seq}><td>{e.seq}</td><td>{fmtDT(e.at)}</td><td>{e.actor}</td><td><code>{e.action}</code></td><td>{e.entity}</td><td className="small">{e.detail}</td><td className="small">{e.ip}</td><td className="small text-muted"><code>{e.hash.slice(0, 10)}…</code></td></tr>))}</tbody>
      </table></div></div>}
    </>
  );
}
