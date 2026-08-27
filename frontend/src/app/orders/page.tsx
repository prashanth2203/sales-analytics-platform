import React from 'react';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';

export default function OrdersPage() {
  return (
    <div>
      <PageHeader 
        title="Orders" 
        description="Track and manage sales orders."
      />
      <EmptyState 
        title="No orders found" 
        description="Orders will appear here once transactions are processed."
      />
    </div>
  );
}
