import React from 'react';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';

export default function PipelinePage() {
  return (
    <div>
      <PageHeader 
        title="Data Pipeline" 
        description="Configure ETL processes and data integrations."
      />
      <EmptyState 
        title="No pipelines configured" 
        description="Integration capabilities are scheduled for a future phase."
      />
    </div>
  );
}
