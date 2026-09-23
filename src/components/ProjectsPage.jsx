import { useState } from 'react';
import { Building2, ArrowRight, Plus } from 'lucide-react';
import { api } from '../lib/api';

export default function ProjectsPage({ projects, onCreated, setSelectedProjectId, setActivePage }) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', initialBudget: '', budget: '', contractors: 0 });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function create(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api('/api/projects', { method: 'POST', body: JSON.stringify(form) });
      onCreated(result.project);
      setCreating(false);
      setForm({ name: '', initialBudget: '', budget: '', contractors: 0 });
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="section-heading">
        <div>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0F172A', margin: 0 }}>All Active Projects</h2>
        <span style={{ fontSize: '13px', color: '#64748B' }}>Select a project to view its real-time cost ledger and stage progress</span>
        </div>
        <button className="primary-button" onClick={() => setCreating(!creating)}><Plus size={16} /> New Project</button>
      </div>

      {creating && <form className="entry-form" onSubmit={create}>
        <h3>New project</h3>
        <div className="form-grid">
          <label>Project name<input required maxLength="120" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
          <label>Initial budget (₹)<input type="number" min="0" step="0.01" required value={form.initialBudget} onChange={e => setForm({ ...form, initialBudget: e.target.value })} /></label>
          <label>Current budget (₹)<input type="number" min="0" step="0.01" required value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} /></label>
          <label>Contractor teams<input type="number" min="0" step="1" required value={form.contractors} onChange={e => setForm({ ...form, contractors: e.target.value })} /></label>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setCreating(false)}>Cancel</button><button className="primary-button" disabled={busy}>{busy ? 'Saving…' : 'Create project'}</button></div>
      </form>}

      <div className="project-grid">
        {Object.entries(projects).map(([key, project]) => (
          <div key={key} style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            justify: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ backgroundColor: '#EFF6FF', padding: '10px', borderRadius: '10px' }}>
                  <Building2 size={20} color="#2563EB" />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#0F172A', margin: 0 }}>{project.name}</h3>
                  <span style={{ fontSize: '11px', color: '#16A34A', fontWeight: '600' }}>{project.statusBadge}</span>
                  <span className="role-badge" style={{ marginLeft: 8 }}>{project.role}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '16px 0', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Total Budget:</span>
                  <strong style={{ color: '#0F172A' }}>{project.revisedDesignerBudget}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Spent to Date:</span>
                  <strong style={{ color: '#2563EB' }}>{project.totalSpentToDate}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Remaining:</span>
                  <strong style={{ color: '#16A34A' }}>{project.remainingBudget}</strong>
                </div>
              </div>
            </div>

            <button 
              onClick={() => {
                setSelectedProjectId(key);
                setActivePage('dashboard');
              }}
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                padding: '10px',
                borderRadius: '8px',
                color: '#2563EB',
                fontWeight: '600',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              Open Dashboard <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
