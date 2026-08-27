import React from 'react';
import { Button } from './Button';

export const Topbar = () => {
  return (
    <header className="topbar" style={{ justifyContent: 'space-between' }}>
      <div style={{ fontSize: '0.875rem', color: 'var(--fg-secondary)' }}>
        Workspace: Production
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
        <Button variant="secondary" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>Help</Button>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--border-strong)' }}></div>
      </div>
    </header>
  );
};
