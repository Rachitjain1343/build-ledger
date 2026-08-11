import React from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  FileSpreadsheet, 
  Receipt, 
  Scale, 
  Layers, 
  FileText, 
  Bell, 
  File, 
  Users, 
  Settings,
  Building2
} from 'lucide-react';

export default function Sidebar({ activePage, setActivePage }) {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'projects', icon: FolderKanban, label: 'Projects' },
    { id: 'estimates', icon: FileSpreadsheet, label: 'Estimates' },
    { id: 'costs', icon: Receipt, label: 'Costs & Expenses' },
    { id: 'budget', icon: Scale, label: 'Budget vs Actual' },
    { id: 'stages', icon: Layers, label: 'Stages' },
    { id: 'contracts', icon: FileText, label: 'Contracts' },
    { id: 'reports', icon: FileText, label: 'Reports' },
    { id: 'alerts', icon: Bell, label: 'Alerts' },
    { id: 'documents', icon: File, label: 'Documents' },
    { id: 'team', icon: Users, label: 'Team' },
  ];

  return (
    <aside style={{
      width: '240px',
      height: '100vh',
      backgroundColor: '#0F172A',
      color: '#94A3B8',
      display: 'flex',
      flexDirection: 'column',
      justify: 'space-between',
      padding: '20px 16px',
      position: 'fixed',
      left: 0,
      top: 0,
      boxSizing: 'border-box',
      fontFamily: 'sans-serif'
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px', color: '#FFFFFF' }}>
          <Building2 size={28} color="#3B82F6" />
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#FFFFFF' }}>BuildLedger</h2>
            <span style={{ fontSize: '10px', color: '#64748B' }}>Cost Monitoring for Modern Construction</span>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isActive ? '#1E293B' : 'transparent',
                  color: isActive ? '#3B82F6' : '#94A3B8',
                  fontSize: '14px',
                  fontWeight: isActive ? '600' : '400',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%'
                }}
              >
                <Icon size={18} color={isActive ? '#3B82F6' : '#94A3B8'} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div style={{ borderTop: '1px solid #1E293B', paddingTop: '16px' }}>
        <button style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 12px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: 'transparent',
          color: '#94A3B8',
          fontSize: '14px',
          cursor: 'pointer',
          width: '100%'
        }}>
          <Settings size={18} />
          Settings
        </button>
      </div>
    </aside>
  );
}