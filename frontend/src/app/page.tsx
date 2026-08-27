import React from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';

export default function Overview() {
  return (
    <div>
      <PageHeader 
        title="Overview" 
        description="Welcome back. Here is your high-level sales performance."
      />
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <Card>
          <div style={{ color: 'var(--fg-secondary)', fontSize: '0.875rem', marginBottom: '8px' }}>Total Revenue</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>$124,563.00</div>
        </Card>
        <Card>
          <div style={{ color: 'var(--fg-secondary)', fontSize: '0.875rem', marginBottom: '8px' }}>Active Customers</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>1,234</div>
        </Card>
        <Card>
          <div style={{ color: 'var(--fg-secondary)', fontSize: '0.875rem', marginBottom: '8px' }}>New Orders</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>56</div>
        </Card>
      </div>

      <EmptyState 
        title="No recent activity" 
        description="Your dashboard will update automatically as new data flows through the pipeline."
      />
    </div>
  );
}
