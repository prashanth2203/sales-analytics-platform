"use client";
import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { EmptyState } from '../components/EmptyState';

export default function Overview() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5000/api/dashboard/metrics')
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ padding: 'var(--space-8)' }}>Loading dashboard metrics...</div>;
  }

  if (error) {
    return (
      <EmptyState 
        title="Failed to load dashboard" 
        description="There was an error connecting to the backend API." 
      />
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const columns = [
    { header: 'Order ID', accessor: 'id' },
    { header: 'Customer', accessor: 'customerName' },
    { header: 'Product', accessor: 'productName' },
    { header: 'Revenue', accessor: 'formattedRevenue' }
  ];

  const recentOrdersData = metrics.recentOrders.map((order: any) => ({
    ...order,
    customerName: order.customer?.name,
    productName: order.product?.name,
    formattedRevenue: formatCurrency(order.revenue)
  }));

  return (
    <div>
      <PageHeader 
        title="Overview" 
        description="Welcome back. Here is your high-level sales performance."
      />
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <Card>
          <div style={{ color: 'var(--fg-secondary)', fontSize: '0.875rem', marginBottom: '8px' }}>Total Revenue</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{formatCurrency(metrics.totalRevenue)}</div>
        </Card>
        <Card>
          <div style={{ color: 'var(--fg-secondary)', fontSize: '0.875rem', marginBottom: '8px' }}>Total Customers</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{metrics.totalCustomers.toLocaleString()}</div>
        </Card>
        <Card>
          <div style={{ color: 'var(--fg-secondary)', fontSize: '0.875rem', marginBottom: '8px' }}>Total Orders</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{metrics.totalOrders.toLocaleString()}</div>
        </Card>
      </div>

      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Recent Orders</h3>
      {recentOrdersData.length > 0 ? (
        <Table columns={columns} data={recentOrdersData} />
      ) : (
        <EmptyState 
          title="No recent activity" 
          description="Your dashboard will update automatically as new data flows through the pipeline."
        />
      )}
    </div>
  );
}
