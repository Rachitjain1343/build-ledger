import React, { useState } from 'react';
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
import { projectsData } from './data/renovationData';
import { Wallet, CircleDollarSign, TrendingDown, Users, Bell, User } from 'lucide-react';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState('room-renovation');

  const currentProject = projectsData[selectedProjectId] || projectsData['room-renovation'];
  const isLakhs = selectedProjectId === 'room-renovation';

  return (
    <div style={{ display: 'flex', backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      <main style={{ marginLeft: '240px', padding: '32px', flex: 1, overflowX: 'hidden' }}>
        {/* Top Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0F172A', margin: 0 }}>
              {currentProject.name}
            </h1>
            <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px', margin: 0 }}>
              Tracking actual construction expenses & contractor payouts live.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <select 
              value={selectedProjectId} 
              onChange={(e) => setSelectedProjectId(e.target.value)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                fontSize: '14px',
                fontWeight: '600',
                color: '#2563EB',
                cursor: 'pointer'
              }}
            >
              <option value="room-renovation">🏠 Master Room Renovation</option>
              <option value="skyline-residency">🏢 Skyline Residency</option>
              <option value="green-heights">🌿 Green Heights</option>
            </select>

            <button style={{ backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
              <Bell size={18} color="#64748B" />
            </button>

            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={20} color="#475569" />
            </div>
          </div>
        </div>

        {/* Explicit Page Routing */}
        {activePage === 'dashboard' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' }}>
              <StatCard title="Total Budget" value={currentProject.revisedDesignerBudget} subtext={`Initial: ${currentProject.initialEstimate}`} icon={Wallet} />
              <StatCard title="Total Spent to Date" value={currentProject.totalSpentToDate} subtext="Paid Out" icon={CircleDollarSign} />
              <StatCard title="Remaining Balance" value={currentProject.remainingBudget} badge={currentProject.statusBadge} badgeColor="#16A34A" badgeBg="#DCFCE7" icon={TrendingDown} />
              <StatCard title="Active Contractors" value={currentProject.activeContractors} subtext="On-Site Teams" icon={Users} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '28px' }}>
              <BudgetVsActualChart data={currentProject.chartData || []} isLakhs={isLakhs} />
              <CostStatusChart data={currentProject.costStatus || []} totalBudget={currentProject.revisedDesignerBudget} isLakhs={isLakhs} />
            </div>

            <DashboardTables stageCosts={currentProject.stageCosts || []} upcomingPayments={currentProject.upcomingPayments || []} />
          </>
        )}

        {activePage === 'projects' && <ProjectsPage setSelectedProjectId={setSelectedProjectId} setActivePage={setActivePage} />}
        {activePage === 'costs' && <CostsPage currentProject={currentProject} />}
        {activePage === 'budget' && <BudgetVsActualPage currentProject={currentProject} />}
        {activePage === 'stages' && <StagesPage currentProject={currentProject} />}
        {activePage === 'contracts' && <ContractsPage currentProject={currentProject} />}
        {activePage === 'reports' && <ReportsPage currentProject={currentProject} />}

        {/* Fallback for remaining menu items */}
        {activePage !== 'dashboard' && 
         activePage !== 'projects' && 
         activePage !== 'costs' && 
         activePage !== 'budget' && 
         activePage !== 'stages' && 
         activePage !== 'contracts' && 
         activePage !== 'reports' && (
          <CostsPage currentProject={currentProject} />
        )}
      </main>
    </div>
  );
}