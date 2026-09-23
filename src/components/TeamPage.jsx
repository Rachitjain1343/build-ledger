import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function TeamPage({ currentProject }) {
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ email: '', role: 'viewer' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const owner = currentProject.role === 'owner';

  useEffect(() => {
    api(`/api/projects/${currentProject.id}/members`)
      .then(result => { setMembers(result.members); setError(''); })
      .catch(err => setError(err.message));
  }, [currentProject.id]);

  async function addMember(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api(`/api/projects/${currentProject.id}/members`, { method: 'POST', body: JSON.stringify(form) });
      setMembers(result.members);
      setForm({ email: '', role: 'viewer' });
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function changeMember(member, role) {
    setError('');
    try {
      const result = await api(`/api/projects/${currentProject.id}/members/${member.id}`, { method: 'PATCH', body: JSON.stringify({ role }) });
      setMembers(result.members);
    } catch (err) { setError(err.message); }
  }

  async function removeMember(member) {
    if (!window.confirm(`Remove ${member.name || member.email} from this project?`)) return;
    setError('');
    try {
      const result = await api(`/api/projects/${currentProject.id}/members/${member.id}`, { method: 'DELETE' });
      setMembers(result.members);
    } catch (err) { setError(err.message); }
  }

  return <div className="page-stack">
    <div><h2>Team & roles</h2><p>Access to {currentProject.name}</p></div>
    <div className="role-guide"><span><strong>Owner</strong> manages access and data</span><span><strong>Manager</strong> updates budgets and expenses</span><span><strong>Viewer</strong> reads project data</span></div>
    {owner && <form className="entry-form" onSubmit={addMember}>
      <h3>Add a registered user</h3>
      <div className="form-grid">
        <label>Email<input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
        <label>Role<select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}><option value="viewer">Viewer</option><option value="manager">Manager</option></select></label>
      </div>
      <div className="form-actions"><button className="primary-button" disabled={busy}>{busy ? 'Adding…' : 'Add member'}</button></div>
    </form>}
    {error && <div className="form-error" role="alert">{error}</div>}
    <div className="member-list">
      {members.map(member => <div className="member-row" key={member.id}>
        <div><strong>{member.name || member.email}</strong><small>{member.email}</small></div>
        {owner && member.role !== 'owner' ? <div className="member-actions">
          <select aria-label={`Role for ${member.email}`} value={member.role} onChange={e => changeMember(member, e.target.value)}><option value="viewer">Viewer</option><option value="manager">Manager</option></select>
          <button className="secondary-button" onClick={() => removeMember(member)}>Remove</button>
        </div> : <span className="role-badge">{member.role}</span>}
      </div>)}
    </div>
  </div>;
}
