"use client";
import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

export default function PipelinePage() {
  const [status, setStatus] = useState<any>({ status: 'idle', logs: [], records: { customers: 0, products: 0, orders: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStatus = () => {
    fetch('http://localhost:5000/api/pipeline/status')
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      fetchStatus();
    }, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const triggerPipeline = () => {
    fetch('http://localhost:5000/api/pipeline/run', { method: 'POST' })
      .then(res => res.json())
      .then(() => fetchStatus())
      .catch(err => console.error(err));
  };

  const getStatusColor = (currentStatus: string) => {
    switch (currentStatus) {
      case 'running': return 'var(--brand-primary)';
      case 'completed': return '#10b981'; // Green
      case 'failed': return '#ef4444'; // Red
      default: return 'var(--fg-secondary)';
    }
  };

  if (loading && !status.jobId) {
    return <div style={{ padding: 'var(--space-8)' }}>Loading pipeline status...</div>;
  }

  return (
    <div>
      <PageHeader 
        title="Data Pipeline" 
        description="Monitor and trigger the ETL process manually."
      />
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Pipeline Status</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '0.875rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: getStatusColor(status.status) }}></div>
                <span style={{ textTransform: 'capitalize', fontWeight: 600, color: getStatusColor(status.status) }}>
                  {status.status}
                </span>
                {status.lastSuccessfulRun && (
                  <span style={{ color: 'var(--fg-secondary)', marginLeft: 'var(--space-4)' }}>
                    Last successful run: {new Date(status.lastSuccessfulRun).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            <Button 
              variant="primary" 
              onClick={triggerPipeline} 
              disabled={status.status === 'running'}
            >
              {status.status === 'running' ? 'Running...' : 'Run ETL Pipeline'}
            </Button>
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-6)' }}>
          <Card>
            <div style={{ color: 'var(--fg-secondary)', fontSize: '0.875rem', marginBottom: '8px' }}>Customers Processed</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{status.records?.customers || 0}</div>
          </Card>
          <Card>
            <div style={{ color: 'var(--fg-secondary)', fontSize: '0.875rem', marginBottom: '8px' }}>Products Processed</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{status.records?.products || 0}</div>
          </Card>
          <Card>
            <div style={{ color: 'var(--fg-secondary)', fontSize: '0.875rem', marginBottom: '8px' }}>Orders Processed</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{status.records?.orders || 0}</div>
          </Card>
        </div>

        <Card>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Execution Logs</h3>
          <div style={{ 
            backgroundColor: 'var(--bg-secondary)', 
            color: 'var(--fg-primary)', 
            padding: 'var(--space-4)', 
            borderRadius: 'var(--radius-md)', 
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            minHeight: '300px',
            maxHeight: '500px',
            overflowY: 'auto',
            border: '1px solid var(--border-subtle)'
          }}>
            {status.logs && status.logs.length > 0 ? (
              status.logs.map((log: string, idx: number) => (
                <div key={idx} style={{ marginBottom: '4px' }}>{log}</div>
              ))
            ) : (
              <div style={{ color: 'var(--fg-secondary)' }}>No logs available. The pipeline is currently idle.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
