import React from 'react';
import './ui.css';

export const PageHeader = ({ title, description, children }: { title: string, description?: string, children?: React.ReactNode }) => {
  return (
    <div className="ui-page-header">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div>{children}</div>}
    </div>
  );
};
