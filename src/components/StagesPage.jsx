import React from 'react';
import { Layers, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function StagesPage({ currentProject }) {
  const stageCosts = currentProject?.stageCosts || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0F172A', margin: 0 }}>Construction Stages</h2>
        <span style={{ fontSize: '13px', color: '#64748B' }}>Lifecycle phase monitoring for {currentProject.name}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        {stageCosts.map((stage, idx) => (
          <div key={idx} style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                backgroundColor: stage.status === 'Completed' ? '#DCFCE7' : stage.status === 'In Progress' ? '#FEF3C7' : '#FEE2E2',
                padding: '10px',
                borderRadius: '10px'
              }}>
                {stage.status === 'Completed' ? <CheckCircle2 size={20} color="#16A34A" /> : <Clock size={20} color="#D97706" />}
              </div>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A', margin: 0 }}>{stage.stage}</h4>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Category: {stage.category}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <strong style={{ fontSize: '14px', color: '#0F172A', display: 'block' }}>₹{stage.totalCost?.toLocaleString('en-IN')}</strong>
              <span style={{ fontSize: '11px', fontWeight: '600', color: stage.status === 'Completed' ? '#16A34A' : '#D97706' }}>{stage.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}