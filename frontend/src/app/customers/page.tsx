"use client";
import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { Table } from '../../components/Table';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');

  const fetchCustomers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/customers');
      const data = await res.json();
      setCustomers(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('http://localhost:5000/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, city }),
      });
      setName('');
      setCity('');
      fetchCustomers();
    } catch (e) {
      console.error(e);
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Name', accessor: 'name' },
    { header: 'City', accessor: 'city' }
  ];

  return (
    <div>
      <PageHeader 
        title="Customers" 
        description="Manage your customer database."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 'var(--space-8)' }}>
        <div className="ui-card" style={{ alignSelf: 'start' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Add Customer</h3>
          <form onSubmit={handleSubmit}>
            <div className="ui-form-group">
              <label className="ui-label">Name</label>
              <input 
                className="ui-input" 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">City</label>
              <input 
                className="ui-input" 
                type="text" 
                value={city} 
                onChange={(e) => setCity(e.target.value)} 
                required 
              />
            </div>
            <Button type="submit" style={{ width: '100%' }}>Create Customer</Button>
          </form>
        </div>

        <div>
          {customers.length > 0 ? (
            <Table columns={columns} data={customers} />
          ) : (
            <EmptyState 
              title="No customers found" 
              description="Add a customer using the form to get started." 
            />
          )}
        </div>
      </div>
    </div>
  );
}
