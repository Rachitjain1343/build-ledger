import React, { useState } from 'react';
import { Receipt, Plus, Search, Filter } from 'lucide-react';

export default function CostsPage({ currentProject }) {
  const [searchTerm, setSearchTerm] = useState('');
  const stageCosts = currentProject?.stageCosts || [];

  const filteredCosts = stageCosts.filter(item => 
    item.stage.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0F172A', margin: 0 }}>Itemized Expense Ledger</h2>
          <span style={{ fontSize: '13px', color: '#64748B' }}>Detailed material and labor transactions for {currentProject.name}</span>
        </div>
        <button style={{
          backgroundColor: '#2563EB',
          color: '#FFFFFF',
          border: 'none',
          padding: '10px 16px',
          borderRadius: '8px',
          fontWeight: '600',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer'
        }}>
          <Plus size={16} /> Add Expense
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F8FAFC', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', flex: 1 }}>
          <Search size={16} color="#94A3B8" />
          <input 
            type="text" 
            placeholder="Search by stage or material type..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', width: '100%', color: '#1E293B' }}
          />
        </div>
        <button style={{ border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', padding: '8px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
          <Filter size={16} /> Category
        </button>
      </div>

      {/* Ledger Table */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #F1F5F9', color: '#64748B', textAlign: 'left' }}>
              <th style={{ paddingBottom: '12px' }}>Stage Item</th>
              <th style={{ paddingBottom: '12px' }}>Category</th>
              <th style={{ paddingBottom: '12px', textAlign: 'right' }}>Material Cost</th>
              <th style={{ paddingBottom: '12px', textAlign: 'right' }}>Labor Cost</th>
              <th style={{ paddingBottom: '12px', textAlign: 'right' }}>Total Expense</th>
              <th style={{ paddingBottom: '12px', textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredCosts.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #F8FAFC' }}>
                <td style={{ padding: '14px 0', fontWeight: '600', color: '#0F172A' }}>{row.stage}</td>
                <td style={{ padding: '14px 0', color: '#64748B' }}>
                  <span style={{ backgroundColor: '#F1F5F9', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', color: '#475569', fontWeight: '500' }}>
                    {row.category}
                  </span>
                </td>
                <td style={{ padding: '14px 0', textAlign: 'right', color: '#475569' }}>₹{row.materialCost?.toLocaleString('en-IN')}</td>
                <td style={{ padding: '14px 0', textAlign: 'right', color: '#475569' }}>₹{row.laborCost?.toLocaleString('en-IN')}</td>
                <td style={{ padding: '14px 0', textAlign: 'right', fontWeight: '700', color: '#0F172A' }}>₹{row.totalCost?.toLocaleString('en-IN')}</td>
                <td style={{ padding: '14px 0', textAlign: 'center' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    backgroundColor: row.status === 'Completed' ? '#DCFCE7' : row.status === 'Over Budget' ? '#FEE2E2' : '#FEF3C7',
                    color: row.status === 'Completed' ? '#16A34A' : row.status === 'Over Budget' ? '#DC2626' : '#D97706'
                  }}>
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