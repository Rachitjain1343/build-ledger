import React from 'react';
import { Scale, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function BudgetVsActualPage({ currentProject }) {
  const stageCosts = currentProject?.stageCosts || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0F172A', margin: 0 }}>Budget vs Actual Variance Analysis</h2>
        <span style={{ fontSize: '13px', color: '#64748B' }}>Detailed cost deviation tracking for {currentProject.name}</span>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #F1F5F9', color: '#64748B', textAlign: 'left' }}>
              <th style={{ paddingBottom: '12px' }}>Stage Name</th>
              <th style={{ paddingBottom: '12px' }}>Category</th>
              <th style={{ paddingBottom: '12px', textAlign: 'right' }}>Material Cost</th>
              <th style={{ paddingBottom: '12px', textAlign: 'right' }}>Labor Cost</th>
              <th style={{ paddingBottom: '12px', textAlign: 'right' }}>Total Actual</th>
              <th style={{ paddingBottom: '12px', textAlign: 'center' }}>Variance Status</th>
            </tr>
          </thead>
          <tbody>
            {stageCosts.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #F8FAFC' }}>
                <td style={{ padding: '14px 0', fontWeight: '600', color: '#0F172A' }}>{row.stage}</td>
                <td style={{ padding: '14px 0', color: '#64748B' }}>{row.category}</td>
                <td style={{ padding: '14px 0', textAlign: 'right', color: '#475569' }}>₹{row.materialCost?.toLocaleString('en-IN')}</td>
                <td style={{ padding: '14px 0', textAlign: 'right', color: '#475569' }}>₹{row.laborCost?.toLocaleString('en-IN')}</td>
                <td style={{ padding: '14px 0', textAlign: 'right', fontWeight: '700', color: '#0F172A' }}>₹{row.totalCost?.toLocaleString('en-IN')}</td>
                <td style={{ padding: '14px 0', textAlign: 'center' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    backgroundColor: row.status === 'Over Budget' ? '#FEE2E2' : '#DCFCE7',
                    color: row.status === 'Over Budget' ? '#DC2626' : '#16A34A',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {row.status === 'Over Budget' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}