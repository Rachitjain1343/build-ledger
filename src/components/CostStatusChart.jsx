import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function CostStatusChart({ data, totalBudget, isLakhs }) {
  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #E2E8F0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px 0', color: '#0F172A' }}>Budget Breakdown</h3>
      
      <div style={{ width: '100%', height: 180, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`₹${value} ${isLakhs ? 'Lakhs' : 'Cr'}`]} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '10px', color: '#64748B', display: 'block' }}>Total Budget</span>
          <strong style={{ fontSize: '13px', color: '#0F172A' }}>{totalBudget}</strong>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
        {data.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }} />
              <span style={{ color: '#475569' }}>{item.name}</span>
            </div>
            <span style={{ fontWeight: '600', color: '#0F172A' }}>₹{item.value}{isLakhs ? 'L' : 'Cr'} ({item.percentage})</span>
          </div>
        ))}
      </div>
    </div>
  );
}