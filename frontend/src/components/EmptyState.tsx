import React from 'react';
import './ui.css';

export const EmptyState = ({ title, description, action }: { title: string, description: string, action?: React.ReactNode }) => {
  return (
    <div className="ui-empty-state">
      <div style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-strong)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em', color: 'var(--fg-secondary)', marginBottom: 'var(--space-6)' }}>
        MODULE PENDING
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
};
