"use client";
import React from 'react';
import Link from 'next/link';

export const Sidebar = () => {
  const navGroups = [
    {
      group: 'WORKSPACE',
      items: [
        { name: 'Overview', path: '/' },
      ]
    },
    {
      group: 'OPERATIONS',
      items: [
        { name: 'Customers', path: '/customers' },
        { name: 'Products', path: '/products' },
        { name: 'Orders', path: '/orders' },
      ]
    },
    {
      group: 'INTELLIGENCE',
      items: [
        { name: 'Analytics', path: '/analytics' },
      ]
    },
    {
      group: 'SYSTEM',
      items: [
        { name: 'Data Pipeline', path: '/pipeline' },
      ]
    }
  ];

  return (
    <aside className="sidebar">
      <div style={{ padding: 'var(--space-6) var(--space-8)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.05em' }}>
          <div style={{ width: 12, height: 12, background: 'var(--accent)' }}></div>
          <span style={{ fontWeight: 800, fontSize: '0.875rem' }}>SALES<span style={{ color: 'var(--fg-tertiary)', margin: '0 2px' }}>//</span>DATA</span>
        </div>
      </div>
      <nav style={{ padding: 'var(--space-6) var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {navGroups.map((navGroup) => (
          <div key={navGroup.group}>
            <div style={{ padding: '0 var(--space-4)', marginBottom: 'var(--space-2)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-tertiary)', letterSpacing: '0.1em' }}>
              {navGroup.group}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {navGroup.items.map((item) => (
                <Link 
                  key={item.path} 
                  href={item.path}
                  style={{
                    padding: 'var(--space-2) var(--space-4)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--fg-secondary)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    e.currentTarget.style.color = 'var(--fg-primary)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--fg-secondary)';
                  }}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
};
