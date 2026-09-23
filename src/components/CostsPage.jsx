import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { api } from '../lib/api';

export default function CostsPage({ currentProject, onUpdated }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ stage: '', category: '', materialCost: '', laborCost: '', status: 'In Progress' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const canEdit = currentProject.role !== 'viewer';
  const stageCosts = currentProject?.stageCosts || [];
  const categories = [...new Set(stageCosts.map(row => row.category))];

  const filteredCosts = stageCosts.filter(item =>
    (!category || item.category === category) &&
    (item.stage.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  function edit(row) {
    setEditingId(row.id);
    setForm({ stage: row.stage, category: row.category, materialCost: row.materialCost, laborCost: row.laborCost, status: row.status });
    setError('');
  }

  function add() {
    setEditingId('new');
    setForm({ stage: '', category: '', materialCost: '', laborCost: '', status: 'In Progress' });
    setError('');
  }

  async function saveExpense(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const creating = editingId === 'new';
      const path = `/api/projects/${currentProject.id}/expenses${creating ? '' : `/${editingId}`}`;
      const result = await api(path, { method: creating ? 'POST' : 'PATCH', body: JSON.stringify(form) });
      onUpdated(result.project);
      setForm({ stage: '', category: '', materialCost: '', laborCost: '', status: 'In Progress' });
      setEditingId(null);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0F172A', margin: 0 }}>Itemized Expense Ledger</h2>
          <span style={{ fontSize: '13px', color: '#64748B' }}>Detailed material and labor transactions for {currentProject.name}</span>
        </div>
        {canEdit && <button onClick={add} style={{
          backgroundColor: '#2563EB',
          color: '#FFFFFF',
          border: 'none',
          padding: '10px 16px',
          borderRadius: '8px',
          fontWeight: '600',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer'
        }}>
          <Plus size={16} /> Add Expense
        </button>}
      </div>

      {editingId && <form className="entry-form" onSubmit={saveExpense}>
        <h3>{editingId === 'new' ? 'Add expense' : 'Edit expense'}</h3>
        <div className="form-grid">
          <label>Stage or item<input required maxLength="120" value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })} /></label>
          <label>Category<input required maxLength="80" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></label>
          <label>Material cost (₹)<input type="number" required min="0" step="0.01" value={form.materialCost} onChange={e => setForm({ ...form, materialCost: e.target.value })} /></label>
          <label>Labor cost (₹)<input type="number" required min="0" step="0.01" value={form.laborCost} onChange={e => setForm({ ...form, laborCost: e.target.value })} /></label>
          <label>Status<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option>In Progress</option><option>Completed</option><option>Over Budget</option></select></label>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setEditingId(null)}>Cancel</button><button className="primary-button" disabled={busy}>{busy ? 'Saving…' : 'Save expense'}</button></div>
      </form>}

      {/* Filter & Search Bar */}
      <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F8FAFC', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', flex: 1 }}>
          <Search size={16} color="#94A3B8" />
          <input 
            type="text" 
            placeholder="Search by stage or material type..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', width: '100%', color: '#1E293B' }}
          />
        </div>
        <select aria-label="Filter category" value={category} onChange={e => setCategory(e.target.value)}><option value="">All categories</option>{categories.map(value => <option key={value}>{value}</option>)}</select>
      </div>

      {/* Ledger Table */}
      <div className="table-scroll" style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #F1F5F9', color: '#64748B', textAlign: 'left' }}>
              <th style={{ paddingBottom: '12px' }}>Stage Item</th>
              <th style={{ paddingBottom: '12px' }}>Category</th>
              <th style={{ paddingBottom: '12px', textAlign: 'right' }}>Material Cost</th>
              <th style={{ paddingBottom: '12px', textAlign: 'right' }}>Labor Cost</th>
              <th style={{ paddingBottom: '12px', textAlign: 'right' }}>Total Expense</th>
              <th style={{ paddingBottom: '12px', textAlign: 'center' }}>Status</th>
              {canEdit && <th style={{ paddingBottom: '12px', textAlign: 'right' }}>Action</th>}
            </tr>
          </thead>
          <tbody>
            {filteredCosts.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #F8FAFC' }}>
                <td style={{ padding: '14px 0', fontWeight: '600', color: '#0F172A' }}>{row.stage}</td>
                <td style={{ padding: '14px 0', color: '#64748B' }}>
                  <span style={{ backgroundColor: '#F1F5F9', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', color: '#475569', fontWeight: '500' }}>
                    {row.category}
                  </span>
                </td>
                <td style={{ padding: '14px 0', textAlign: 'right', color: '#475569' }}>₹{row.materialCost?.toLocaleString('en-IN')}</td>
                <td style={{ padding: '14px 0', textAlign: 'right', color: '#475569' }}>₹{row.laborCost?.toLocaleString('en-IN')}</td>
                <td style={{ padding: '14px 0', textAlign: 'right', fontWeight: '700', color: '#0F172A' }}>₹{row.totalCost?.toLocaleString('en-IN')}</td>
                <td style={{ padding: '14px 0', textAlign: 'center' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    backgroundColor: row.status === 'Completed' ? '#DCFCE7' : row.status === 'Over Budget' ? '#FEE2E2' : '#FEF3C7',
                    color: row.status === 'Completed' ? '#16A34A' : row.status === 'Over Budget' ? '#DC2626' : '#D97706'
                  }}>
                    {row.status}
                  </span>
                </td>
                {canEdit && <td style={{ padding: '14px 0', textAlign: 'right' }}><button className="text-button" onClick={() => edit(row)}>Edit</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCosts.length === 0 && <p className="empty-state">No expenses match your search.</p>}
      </div>
    </div>
  );
}
