import { Download, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function ReportsPage({ currentProject }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0F172A', margin: 0 }}>Executive Cost Summary</h2>
          <span style={{ fontSize: '13px', color: '#64748B' }}>Generated report for {currentProject.name}</span>
        </div>
        <button onClick={() => window.print()} style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #CBD5E1',
          padding: '10px 16px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '600',
          color: '#334155',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer'
        }}>
          <Download size={16} /> Export PDF Report
        </button>
      </div>

      {/* Overview Cards */}
      <div className="report-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: '12px', color: '#64748B' }}>Initial Approved Estimate</span>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0F172A', marginTop: '4px' }}>{currentProject.initialEstimate}</h3>
        </div>
        <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: '12px', color: '#64748B' }}>Revised Designer Budget</span>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#2563EB', marginTop: '4px' }}>{currentProject.revisedDesignerBudget}</h3>
        </div>
        <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: '12px', color: '#64748B' }}>Total Disbursed to Date</span>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0F172A', marginTop: '4px' }}>{currentProject.totalSpentToDate}</h3>
        </div>
      </div>

      {/* Stage Variance Analysis */}
      <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#0F172A', marginBottom: '16px' }}>Stage Audit Summary</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {currentProject.stageCosts?.map((stage, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {stage.status === 'Over Budget' ? <AlertTriangle size={18} color="#EF4444" /> : <CheckCircle2 size={18} color="#16A34A" />}
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B', margin: 0 }}>{stage.stage}</h4>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>Category: {stage.category}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>₹{stage.totalCost.toLocaleString('en-IN')}</span>
                <span style={{ fontSize: '11px', display: 'block', color: stage.status === 'Over Budget' ? '#EF4444' : '#16A34A' }}>{stage.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
