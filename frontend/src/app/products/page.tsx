import React from 'react';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';

export default function ProductsPage() {
  return (
    <div>
      <PageHeader 
        title="Products" 
        description="Product catalog and performance metrics."
      />
      <EmptyState 
        title="Product catalog empty" 
        description="Connect your inventory system to sync products."
      />
    </div>
  );
}
