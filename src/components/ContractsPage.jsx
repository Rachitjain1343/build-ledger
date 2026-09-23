import { FileText, Calendar } from 'lucide-react';

export default function ContractsPage({ currentProject }) {
  const upcomingPayments = currentProject?.upcomingPayments || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0F172A', margin: 0 }}>Vendor Contracts & Agreements</h2>
        <span style={{ fontSize: '13px', color: '#64748B' }}>Active vendor billing and payout schedules for {currentProject.name}</span>
      </div>

      <div className="two-column-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        {upcomingPayments.map((contract, idx) => (
          <div key={idx} style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ backgroundColor: '#EFF6FF', padding: '10px', borderRadius: '10px' }}>
                  <FileText size={20} color="#2563EB" />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#0F172A', margin: 0 }}>{contract.item}</h4>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>Vendor: {contract.vendor}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', fontSize: '12px' }}>
              <div>
                <span style={{ color: '#64748B', display: 'block' }}>Advance Paid</span>
                <strong style={{ color: '#16A34A' }}>{contract.advancePaid}</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#64748B', display: 'block' }}>Balance Due</span>
                <strong style={{ color: '#DC2626' }}>{contract.balanceDue}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748B' }}>
              <Calendar size={14} /> Schedule: {contract.dueDate}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
