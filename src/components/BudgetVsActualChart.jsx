import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function BudgetVsActualChart({ data, isLakhs }) {
  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #E2E8F0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#0F172A' }}>Cumulative Spend Tracking</h3>
          <span style={{ fontSize: '12px', color: '#64748B' }}>
            Budget vs Actual Outflow ({isLakhs ? 'in Lakhs' : 'in Crores'})
          </span>
        </div>
      </div>

      <div style={{ width: '100%', height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="stage" stroke="#94A3B8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} unit={isLakhs ? "L" : "Cr"} />
            <Tooltip formatter={(value) => [`₹${value} ${isLakhs ? 'Lakhs' : 'Cr'}`]} />
            <Line type="monotone" dataKey="DesignerBudget" name="Budget" stroke="#2563EB" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            <Line type="monotone" dataKey="ActualSpent" name="Actual Spent" stroke="#16A34A" strokeWidth={2.5} dot={{ r: 5, fill: '#16A34A' }} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}