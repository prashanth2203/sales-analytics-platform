import React from 'react';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';

export default function AnalyticsPage() {
  return (
    <div>
      <PageHeader 
        title="Analytics Dashboard" 
        description="Deep dive into sales trends and metrics."
      />
      <EmptyState 
        title="Not enough data" 
        description="Analytics require more historical data to generate insights."
      />
    </div>
  );
}
