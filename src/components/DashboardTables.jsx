import { FileText } from 'lucide-react';

export default function DashboardTables({ stageCosts, upcomingPayments }) {
  return (
    <div className="dashboard-tables" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
      
      {/* Stage Breakdown Table */}
      <div className="table-scroll" style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#0F172A', margin: '0 0 16px 0' }}>
          Stage Wise Expense Breakdown
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
              <th style={{ paddingBottom: '10px' }}>Stage</th>
              <th style={{ paddingBottom: '10px' }}>Category</th>
              <th style={{ paddingBottom: '10px', textAlign: 'right' }}>Material</th>
              <th style={{ paddingBottom: '10px', textAlign: 'right' }}>Labor</th>
              <th style={{ paddingBottom: '10px', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {stageCosts.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: idx !== stageCosts.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                <td style={{ padding: '10px 0', fontWeight: '500', color: '#1E293B' }}>{row.stage}</td>
                <td style={{ padding: '10px 0', color: '#64748B' }}>{row.category}</td>
                <td style={{ padding: '10px 0', textAlign: 'right', color: '#475569' }}>₹{row.materialCost.toLocaleString('en-IN')}</td>
                <td style={{ padding: '10px 0', textAlign: 'right', color: '#475569' }}>₹{row.laborCost.toLocaleString('en-IN')}</td>
                <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '600', color: '#0F172A' }}>₹{row.totalCost.toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pending Vendor Payments */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#0F172A', margin: 0 }}>Pending Payments</h3>
          <span style={{ fontSize: '12px', color: '#2563EB', fontWeight: '500' }}>Active Dues</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {upcomingPayments.map((pay, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ backgroundColor: '#EFF6FF', padding: '8px', borderRadius: '8px' }}>
                  <FileText size={16} color="#2563EB" />
                </div>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#1E293B', margin: 0 }}>{pay.item}</p>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>{pay.vendor}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#EF4444', display: 'block' }}>Due: {pay.balanceDue}</span>
                <span style={{ fontSize: '10px', color: '#94A3B8' }}>{pay.dueDate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
