"use client";

import React, { useState, useRef } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertTriangle } from 'lucide-react';
import * as xlsx from 'xlsx';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [clearSuccess, setClearSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await processFile(selectedFile);
    }
  };

  const processFile = async (selectedFile: File) => {
    setError(null);
    setSuccessData(null);
    setPreview(null);
    setFile(null);

    if (!selectedFile.name.endsWith('.xlsx')) {
      setError("Please upload a valid .xlsx file.");
      return;
    }

    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      
      const requiredSheets = ['Customers', 'Products', 'Orders'];
      for (const sheet of requiredSheets) {
        if (!workbook.SheetNames.includes(sheet)) {
          setError(`Missing required sheet: ${sheet}`);
          return;
        }
      }

      const customers = xlsx.utils.sheet_to_json(workbook.Sheets['Customers']);
      const products = xlsx.utils.sheet_to_json(workbook.Sheets['Products']);
      const orders = xlsx.utils.sheet_to_json(workbook.Sheets['Orders']);

      setFile(selectedFile);
      setPreview({
        customersCount: customers.length,
        productsCount: products.length,
        ordersCount: orders.length,
        sampleCustomers: customers.slice(0, 3),
        sampleProducts: products.slice(0, 3),
        sampleOrders: orders.slice(0, 3)
      });
    } catch (err: any) {
      setError("Failed to parse Excel file. Ensure it is not corrupted.");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      await processFile(droppedFile);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setIsImporting(true);
    setError(null);
    setClearSuccess(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:5000/api/import/excel', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to import data');
      }

      setSuccessData(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during import.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm('Are you sure you want to clear all operational data and data warehouse data? This action cannot be undone.')) return;
    
    setIsClearing(true);
    setError(null);
    setClearSuccess(null);

    try {
      const res = await fetch('http://localhost:5000/api/import/clear', {
        method: 'POST',
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to clear data');
      }

      setClearSuccess(data.message);
      setSuccessData(null);
      setFile(null);
      setPreview(null);
    } catch (err: any) {
      setError(err.message || 'An error occurred while clearing data.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <PageHeader 
        title="BULK DATA IMPORT" 
        description="Upload a structured Excel file to import Customers, Products, and Orders into the operational database."
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-6)' }}>
        <button 
          className="ui-btn ui-btn-danger" 
          style={{ backgroundColor: '#ff4444', color: 'white' }}
          onClick={handleClearData}
          disabled={isClearing}
        >
          {isClearing ? 'Clearing...' : 'Clear All Data'}
        </button>
      </div>

      {clearSuccess && (
        <div style={{ padding: 'var(--space-4)', backgroundColor: 'rgba(0, 200, 81, 0.1)', borderLeft: '4px solid #00C851', color: '#007E33', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <CheckCircle size={16} />
              <span style={{ fontWeight: 500 }}>{clearSuccess}</span>
            </div>
        </div>
      )}

      {!successData ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{
              border: '2px dashed var(--border-strong)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-12) var(--space-6)',
              textAlign: 'center',
              backgroundColor: 'var(--bg-secondary)',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".xlsx" 
              onChange={handleFileChange}
            />
            
            {!file ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
                <div style={{ padding: 'var(--space-4)', background: 'var(--bg-primary)', borderRadius: '50%', border: '1px solid var(--border-subtle)' }}>
                  <UploadCloud size={32} color="var(--fg-secondary)" />
                </div>
                <div>
                  <p style={{ fontWeight: 500, fontSize: '1rem', color: 'var(--fg-primary)' }}>Click or drag file to this area to upload</p>
                  <p style={{ color: 'var(--fg-secondary)', fontSize: '0.875rem', marginTop: 'var(--space-1)' }}>Support for a single or bulk upload. Strictly accept .xlsx files.</p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
                <FileSpreadsheet size={32} color="var(--accent)" />
                <p style={{ fontWeight: 500, color: 'var(--fg-primary)' }}>{file.name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--fg-secondary)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <button 
                  className="ui-btn ui-btn-secondary" 
                  style={{ marginTop: 'var(--space-4)', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setPreview(null);
                  }}
                >
                  Remove File
                </button>
              </div>
            )}
          </div>

          {error && (
            <div style={{ padding: 'var(--space-4)', backgroundColor: 'rgba(255, 68, 68, 0.1)', borderLeft: '4px solid #ff4444', color: '#ff4444', borderRadius: 'var(--radius-sm)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <AlertTriangle size={16} />
                  <span style={{ fontWeight: 500 }}>{error}</span>
               </div>
            </div>
          )}

          {preview && (
            <Card>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--space-4)' }}>File Preview</h3>
              <div style={{ display: 'flex', gap: 'var(--space-8)', marginBottom: 'var(--space-6)' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--fg-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customers</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{preview.customersCount}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--fg-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Products</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{preview.productsCount}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--fg-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Orders</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{preview.ordersCount}</p>
                </div>
              </div>

              <div style={{ marginBottom: 'var(--space-4)' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: 'var(--space-2)' }}>Sample Data (Orders)</p>
                <div className="ui-table-container">
                  <table className="ui-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer ID</th>
                        <th>Product ID</th>
                        <th>Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.sampleOrders.map((o: any, i: number) => (
                        <tr key={i}>
                          <td>{o['Order ID']}</td>
                          <td>{o['Customer ID']}</td>
                          <td>{o['Product ID']}</td>
                          <td>{o['Quantity']}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
                 <button 
                   className="ui-btn ui-btn-primary" 
                   onClick={handleImport}
                   disabled={isImporting}
                 >
                   {isImporting ? 'Importing...' : 'IMPORT DATA'}
                 </button>
              </div>
            </Card>
          )}
        </div>
      ) : (
        <Card>
           <div style={{ textAlign: 'center', padding: 'var(--space-8) 0' }}>
              <CheckCircle size={48} color="var(--accent)" style={{ margin: '0 auto', marginBottom: 'var(--space-4)' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Import Completed</h2>
              <p style={{ color: 'var(--fg-secondary)', marginBottom: 'var(--space-8)' }}>{successData.message}</p>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-8)', marginBottom: 'var(--space-8)' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--fg-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customers Imported</p>
                  <p style={{ fontSize: '2rem', fontWeight: 700 }}>{successData.customersImported}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--fg-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Products Imported</p>
                  <p style={{ fontSize: '2rem', fontWeight: 700 }}>{successData.productsImported}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--fg-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Orders Imported</p>
                  <p style={{ fontSize: '2rem', fontWeight: 700 }}>{successData.ordersImported}</p>
                </div>
              </div>

              <button 
                className="ui-btn ui-btn-secondary" 
                onClick={() => {
                  setSuccessData(null);
                  setFile(null);
                  setPreview(null);
                }}
              >
                Import Another File
              </button>
           </div>
        </Card>
      )}
    </div>
  );
}
