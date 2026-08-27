"use client";
import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

export default function AnalyticsPage() {
  const [revenueData, setRevenueData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [cityData, setCityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:5000/api/analytics/revenue'),
      fetch('http://localhost:5000/api/analytics/sales-by-product'),
      fetch('http://localhost:5000/api/analytics/sales-by-category'),
      fetch('http://localhost:5000/api/analytics/sales-by-city')
    ])
      .then(async ([resRev, resProd, resCat, resCity]) => {
        if (!resRev.ok || !resProd.ok || !resCat.ok || !resCity.ok) throw new Error();
        setRevenueData(await resRev.json());
        setProductData(await resProd.json());
        setCategoryData(await resCat.json());
        setCityData(await resCity.json());
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ padding: 'var(--space-8)' }}>Loading analytics data...</div>;
  }

  if (error) {
    return (
      <EmptyState 
        title="Failed to load analytics" 
        description="There was an error connecting to the backend API." 
      />
    );
  }


  return (
    <div>
      <PageHeader 
        title="Analytics Dashboard" 
        description="Deep dive into sales trends and metrics."
      />
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        
        {/* Full width revenue chart */}
        <Card>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--space-6)' }}>Daily Revenue Trend</h3>
          {revenueData.length > 0 ? (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--fg-secondary)', fontSize: 12 }} axisLine={{ stroke: 'var(--border-subtle)' }} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--fg-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => formatCurrency(val)} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)' }}
                    itemStyle={{ color: 'var(--fg-primary)', fontWeight: 600 }}
                    formatter={(val: any) => [formatCurrency(val), 'Revenue']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="var(--fg-primary)" strokeWidth={2} dot={{ fill: 'var(--bg-primary)', stroke: 'var(--fg-primary)', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="Not enough data" description="Analytics require more historical data to generate insights." />
          )}
        </Card>

        {/* 3 column grid for other charts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-6)' }}>
          <Card>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--space-6)' }}>Top 5 Products</h3>
            {productData.length > 0 ? (
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={productData} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-subtle)" />
                    <XAxis type="number" tick={{ fill: 'var(--fg-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => formatCurrency(val)} />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'var(--fg-secondary)', fontSize: 12 }} axisLine={{ stroke: 'var(--border-subtle)' }} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)' }} itemStyle={{ color: 'var(--fg-primary)', fontWeight: 600 }} formatter={(val: any) => [formatCurrency(val), 'Revenue']} />
                    <Bar dataKey="revenue" fill="var(--fg-primary)" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
               <EmptyState title="Not enough data" description="Analytics require more historical data." />
            )}
          </Card>

          <Card>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--space-6)' }}>Sales by Category</h3>
            {categoryData.length > 0 ? (
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={categoryData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                    <XAxis dataKey="name" tick={{ fill: 'var(--fg-secondary)', fontSize: 12 }} axisLine={{ stroke: 'var(--border-subtle)' }} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--fg-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => formatCurrency(val)} />
                    <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)' }} itemStyle={{ color: 'var(--fg-primary)', fontWeight: 600 }} formatter={(val: any) => [formatCurrency(val), 'Revenue']} />
                    <Bar dataKey="revenue" fill="var(--fg-primary)" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
               <EmptyState title="Not enough data" description="Analytics require more historical data." />
            )}
          </Card>

          <Card>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--space-6)' }}>Sales by City</h3>
            {cityData.length > 0 ? (
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={cityData} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-subtle)" />
                    <XAxis type="number" tick={{ fill: 'var(--fg-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => formatCurrency(val)} />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'var(--fg-secondary)', fontSize: 12 }} axisLine={{ stroke: 'var(--border-subtle)' }} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)' }} itemStyle={{ color: 'var(--fg-primary)', fontWeight: 600 }} formatter={(val: any) => [formatCurrency(val), 'Revenue']} />
                    <Bar dataKey="revenue" fill="var(--fg-primary)" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
               <EmptyState title="Not enough data" description="Analytics require more historical data." />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
