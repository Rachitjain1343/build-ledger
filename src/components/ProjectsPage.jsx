import React from 'react';
import { projectsData } from '../data/renovationData';
import { Building2, ArrowRight } from 'lucide-react';

export default function ProjectsPage({ setSelectedProjectId, setActivePage }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0F172A', margin: 0 }}>All Active Projects</h2>
        <span style={{ fontSize: '13px', color: '#64748B' }}>Select a project to view its real-time cost ledger and stage progress</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {Object.entries(projectsData).map(([key, project]) => (
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