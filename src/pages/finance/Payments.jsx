import React, { useEffect, useState } from 'react';
import api, { errMsg } from '../../services/api';
import { PageHeader, StatusBadge, Alert, LoadingSkeleton, inr, fmtDate, downloadText } from '../../components/ui';

export default function Payments() {
  const [tab, setTab] = useState('payable');
  const [rows, setRows] = useState([]);
  const [sel, setSel] = useState({});
  const [utr, setUtr] = useState({});
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    return api.get(`/finance/${tab}`).then((r) => setRows(r.data)).catch((e) => setErr(errMsg(e))).finally(() => setLoading(false));
  };
  useEffect(() => { load(); setSel({}); }, [tab]); // eslint-disable-line

  const exportBatch = async () => {
    setErr(''); setMsg(null);
    const ids = Object.keys(sel).filter((k) => sel[k]);
    try {
      const { data } = await api.post('/finance/export', { ids: ids.length ? ids : undefined });
      downloadText(`${data.batchId}.csv`, data.csv);
      setMsg(`${data.batchId}: ${data.count} payments, ${inr(data.total)} exported.${data.skipped.length ? ` Skipped: ${data.skipped.map((s) => `${s.ticketRef} (${s.reason})`).join('; ')}` : ''}`);
      load();
    } catch (e) { setErr(errMsg(e)); }
  };
  const pay = async (c) => {
    setErr(''); setMsg(null);
    try { await api.post(`/finance/claims/${c.id}/pay`, { utr: utr[c.id] }); setMsg(`${c.ticketRef} marked PAID`); load(); } catch (e) { setErr(errMsg(e)); }
  };

  return (
    <>
      <PageHeader title="Settlement" sub="Export the bank EFT batch, then record the bank UTR to mark claims PAID">
        {tab === 'payable' && <button className="btn btn-purple" onClick={exportBatch}>Export EFT batch (CSV)</button>}
      </PageHeader>
      <ul className="nav nav-pills mb-3">
        {[['payable', 'Ready to pay'], ['paid', 'Paid']].map(([k, l]) => (
          <li className="nav-item" key={k}><button className={`nav-link ${tab === k ? 'active bg-purple' : ''}`} style={tab === k ? { background: '#6d4ae0' } : { color: '#6d4ae0' }} onClick={() => setTab(k)}>{l}</button></li>))}
      </ul>
      <Alert onClose={() => setErr('')}>{err}</Alert>
      <Alert type="success" onClose={() => setMsg(null)}>{msg}</Alert>
      {loading ? <LoadingSkeleton variant="rows" rows={5} /> : <div className="card"><div className="table-responsive"><table className="table align-middle mb-0">
        <thead><tr>{tab === 'payable' && <th />}<th>Ticket</th><th>Employee</th><th>Bank</th><th className="text-end">Amount</th>{tab === 'payable' ? <th>Bank UTR</th> : <><th>Paid</th><th>UTR</th></>}</tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan="7" className="text-center text-muted py-4">Nothing here</td></tr>}
          {rows.map((c) => (
            <tr key={c.id}>
              {tab === 'payable' && <td><input type="checkbox" className="form-check-input" checked={!!sel[c.id]} onChange={(e) => setSel({ ...sel, [c.id]: e.target.checked })} /></td>}
              <td className="fw-semibold">{c.ticketRef}{c.batchId && <div className="small text-muted">{c.batchId}</div>}</td>
              <td>{c.employee.fullName}<div className="small text-muted">{c.employee.empCode}</div></td>
              <td className="small">{c.employee.bank?.bankName}<br />{c.employee.bank?.account} <StatusBadge s={c.employee.bank?.status || 'Pending'} /></td>
              <td className="text-end">{inr(c.total)}</td>
              {tab === 'payable' ? (
                <td style={{ minWidth: 260 }}><div className="input-group input-group-sm">
                  <input className="form-control" placeholder="Bank UTR / reference" value={utr[c.id] || ''} onChange={(e) => setUtr({ ...utr, [c.id]: e.target.value })} />
                  <button className="btn btn-purple" onClick={() => pay(c)}>Mark PAID</button></div></td>
              ) : (<><td>{fmtDate(c.paidAt)}</td><td><code>{c.utr}</code></td></>)}
            </tr>))}
        </tbody></table>        </div></div>}
    </>
  );
}
