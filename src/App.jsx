import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import StatCard from './components/StatCard';
import BudgetVsActualChart from './components/BudgetVsActualChart';
import CostStatusChart from './components/CostStatusChart';
import DashboardTables from './components/DashboardTables';
import CostsPage from './components/CostsPage';
import ReportsPage from './components/ReportsPage';
import ProjectsPage from './components/ProjectsPage';
import BudgetVsActualPage from './components/BudgetVsActualPage';
import StagesPage from './components/StagesPage';
import ContractsPage from './components/ContractsPage';
import TeamPage from './components/TeamPage';
import { Wallet, CircleDollarSign, TrendingDown, Users, LogOut } from 'lucide-react';
import { api } from './lib/api';

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const result = await api(`/api/auth/${mode}`, { method: 'POST', body: JSON.stringify(form) });
      if (result.confirmationRequired) {
        setMode('login');
        setNotice(result.message);
      } else {
        onAuth(result.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return <div className="auth-screen">
    <div className="auth-card">
      <div className="auth-brand">▣ BuildLedger</div>
      <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
      <p>Track construction budgets and expenses in one place.</p>
      <form onSubmit={submit} className="form-stack">
        {mode === 'register' && <label>Name<input required maxLength="100" autoComplete="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>}
        <label>Email<input type="email" required autoComplete="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
        <label>Password<input type="password" required minLength={mode === 'register' ? 8 : 1} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
        {error && <div className="form-error" role="alert">{error}</div>}
        {notice && <div className="form-notice" role="status">{notice}</div>}
        <button className="primary-button" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Register'}</button>
      </form>
      <button className="text-button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
        {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Log in'}
      </button>
    </div>
  </div>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState({});
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/me').then(result => setUser(result.user)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    api('/api/projects').then(result => {
      setProjects(result.projects);
      setSelectedProjectId(id => result.projects[id] ? id : Object.keys(result.projects)[0] || '');
    }).catch(err => setError(err.message));
  }, [user]);

  async function logout() {
    try {
      await api('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setProjects({});
      setSelectedProjectId('');
      setActivePage('dashboard');
    } catch (err) { setError(err.message); }
  }

  function updateProject(project) {
    setProjects(previous => ({ ...previous, [project.id]: project }));
    setSelectedProjectId(project.id);
  }

  if (loading) return <div className="loading-screen">Loading BuildLedger…</div>;
  if (!user) return <AuthScreen onAuth={setUser} />;

  const currentProject = projects[selectedProjectId];
  const isLakhs = currentProject?.unit !== 'Cr';

  return <div className="app-shell">
    <Sidebar activePage={activePage} setActivePage={setActivePage} />
    <main className="app-main">
      <header className="top-bar">
        <div>
          <h1>{activePage === 'projects' ? 'Projects' : currentProject?.name || 'BuildLedger'}</h1>
          <p>Construction cost and contractor payment tracking</p>
        </div>
        <div className="top-actions">
          {currentProject && <select aria-label="Select project" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
            {Object.entries(projects).map(([id, project]) => <option key={id} value={id}>{project.name}</option>)}
          </select>}
          <span className="user-name">{user.name}</span>
          <button className="icon-button" title="Log out" aria-label="Log out" onClick={logout}><LogOut size={18} /></button>
        </div>
      </header>
      {error && <div className="form-error" role="alert">{error}</div>}
      {activePage === 'projects' && <ProjectsPage projects={projects} onCreated={updateProject} setSelectedProjectId={setSelectedProjectId} setActivePage={setActivePage} />}
      {!currentProject && activePage !== 'projects' && <div className="empty-state">No projects yet. <button className="text-button" onClick={() => setActivePage('projects')}>Create a project</button></div>}
      {currentProject && activePage === 'dashboard' && <>
        <div className="stats-grid">
          <StatCard title="Total Budget" value={currentProject.revisedDesignerBudget} subtext={`Initial: ${currentProject.initialEstimate}`} icon={Wallet} />
          <StatCard title="Total Spent to Date" value={currentProject.totalSpentToDate} subtext="Recorded expenses" icon={CircleDollarSign} />
          <StatCard title="Remaining Balance" value={currentProject.remainingBudget} badge={currentProject.statusBadge} badgeColor={currentProject.statusBadge === 'Over Budget' ? '#DC2626' : '#16A34A'} badgeBg={currentProject.statusBadge === 'Over Budget' ? '#FEE2E2' : '#DCFCE7'} icon={TrendingDown} />
          <StatCard title="Active Contractors" value={currentProject.activeContractors} subtext="On-site teams" icon={Users} />
        </div>
        <div className="charts-grid">
          <BudgetVsActualChart data={currentProject.chartData} isLakhs={isLakhs} />
          <CostStatusChart data={currentProject.costStatus} totalBudget={currentProject.revisedDesignerBudget} isLakhs={isLakhs} />
        </div>
        <DashboardTables stageCosts={currentProject.stageCosts} upcomingPayments={currentProject.upcomingPayments} />
      </>}
      {currentProject && activePage === 'costs' && <CostsPage key={currentProject.id} currentProject={currentProject} onUpdated={updateProject} />}
      {currentProject && activePage === 'budget' && <BudgetVsActualPage key={currentProject.id} currentProject={currentProject} onUpdated={updateProject} />}
      {currentProject && activePage === 'stages' && <StagesPage currentProject={currentProject} />}
      {currentProject && activePage === 'contracts' && <ContractsPage currentProject={currentProject} />}
      {currentProject && activePage === 'reports' && <ReportsPage currentProject={currentProject} />}
      {currentProject && activePage === 'team' && <TeamPage currentProject={currentProject} />}
    </main>
  </div>;
}
