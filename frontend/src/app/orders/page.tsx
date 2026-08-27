"use client";
import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { Table } from '../../components/Table';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState<{id: number, name: string}[]>([]);
  const [products, setProducts] = useState<{id: number, name: string}[]>([]);
  
  const [customerId, setCustomerId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/orders');
      const data = await res.json();
      
      const formatted = data.map((order: any) => ({
        ...order,
        customerName: order.customer?.name,
        productName: order.product?.name
      }));
      setOrders(formatted);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        fetch('http://localhost:5000/api/customers'),
        fetch('http://localhost:5000/api/products')
      ]);
      setCustomers(await custRes.json());
      setProducts(await prodRes.json());
      fetchOrders();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !productId || !quantity) return;
    
    try {
      await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, productId, quantity }),
      });
      setCustomerId('');
      setProductId('');
      setQuantity('');
      fetchOrders();
    } catch (e) {
      console.error(e);
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Customer', accessor: 'customerName' },
    { header: 'Product', accessor: 'productName' },
    { header: 'Qty', accessor: 'quantity' },
    { header: 'Revenue ($)', accessor: 'revenue' }
  ];

  return (
    <div>
      <PageHeader 
        title="Orders" 
        description="Track and manage sales orders."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 'var(--space-8)' }}>
        <div className="ui-card" style={{ alignSelf: 'start' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Create Order</h3>
          <form onSubmit={handleSubmit}>
            <div className="ui-form-group">
              <label className="ui-label">Customer</label>
              <select className="ui-select" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
                <option value="">Select customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Product</label>
              <select className="ui-select" value={productId} onChange={(e) => setProductId(e.target.value)} required>
                <option value="">Select product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Quantity</label>
              <input 
                className="ui-input" 
                type="number" 
                min="1"
                value={quantity} 
                onChange={(e) => setQuantity(e.target.value)} 
                required 
              />
            </div>
            <Button type="submit" style={{ width: '100%' }}>Create Order</Button>
          </form>
        </div>

        <div>
          {orders.length > 0 ? (
            <Table columns={columns} data={orders} />
          ) : (
            <EmptyState 
              title="No orders found" 
              description="Create an order using the form to see it here."
            />
          )}
        </div>
      </div>
    </div>
  );
}
