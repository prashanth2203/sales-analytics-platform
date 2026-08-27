import React from 'react';
import './ui.css';

export const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => {
  return (
    <div className={`ui-card ${className}`}>
      {children}
    </div>
  );
};
