"use client";
import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { Table } from '../../components/Table';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, price }),
      });
      setName('');
      setCategory('');
      setPrice('');
      fetchProducts();
    } catch (e) {
      console.error(e);
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Name', accessor: 'name' },
    { header: 'Category', accessor: 'category' },
    { header: 'Price ($)', accessor: 'price' }
  ];

  return (
    <div>
      <PageHeader 
        title="Products" 
        description="Product catalog and performance metrics."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 'var(--space-8)' }}>
        <div className="ui-card" style={{ alignSelf: 'start' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Add Product</h3>
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
              <label className="ui-label">Category</label>
              <input 
                className="ui-input" 
                type="text" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
                required 
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Price</label>
              <input 
                className="ui-input" 
                type="number" 
                step="0.01"
                value={price} 
                onChange={(e) => setPrice(e.target.value)} 
                required 
              />
            </div>
            <Button type="submit" style={{ width: '100%' }}>Create Product</Button>
          </form>
        </div>

        <div>
          {products.length > 0 ? (
            <Table columns={columns} data={products} />
          ) : (
             <EmptyState 
              title="Product catalog empty" 
              description="Add your first product to start tracking inventory."
            />
          )}
        </div>
      </div>
    </div>
  );
}
