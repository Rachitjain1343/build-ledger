import React from 'react';

export default function StatCard({ title, value, badge, subtext, icon: Icon, iconBg, badgeColor, badgeBg }) {
  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #E2E8F0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <div>
        <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>{title}</span>
        <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#0F172A', marginTop: '6px' }}>
          {value}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
          {badge && (
            <span style={{
              fontSize: '11px',
              fontWeight: '600',
              color: badgeColor || '#16A34A',
              backgroundColor: badgeBg || '#DCFCE7',
              padding: '2px 8px',
              borderRadius: '12px'
            }}>
              {badge}
            </span>
          )}
          {subtext && <span style={{ fontSize: '12px', color: '#64748B' }}>{subtext}</span>}
        </div>
      </div>

      {Icon && (
        <div style={{
          backgroundColor: iconBg || '#EFF6FF',
          padding: '10px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={20} color="#3B82F6" />
        </div>
      )}
    </div>
  );
}