import React from 'react';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';

export default function CustomersPage() {
  return (
    <div>
      <PageHeader 
        title="Customers" 
        description="Manage your customer database."
      />

      <EmptyState 
        title="No customers yet" 
        description="Import functionality is scheduled for Phase 2."
      />
    </div>
  );
}
