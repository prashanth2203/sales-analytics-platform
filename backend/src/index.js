const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// --- Customers ---
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { name, city } = req.body;
    const customer = await prisma.customer.create({
      data: { name, city }
    });
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// --- Products ---
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, category, price } = req.body;
    const product = await prisma.product.create({
      data: { name, category, price: parseFloat(price) }
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// --- Orders ---
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: { customer: true, product: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { customerId, productId, quantity } = req.body;
    
    // Fetch product to calculate revenue
    const product = await prisma.product.findUnique({ where: { id: parseInt(productId) } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const qty = parseInt(quantity);
    const revenue = product.price * qty;

    const order = await prisma.order.create({
      data: {
        customerId: parseInt(customerId),
        productId: parseInt(productId),
        quantity: qty,
        revenue
      },
      include: { customer: true, product: true }
    });
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// --- Dashboard ---
app.get('/api/dashboard/metrics', async (req, res) => {
  try {
    const metrics = await prisma.$queryRaw`
      SELECT 
        COUNT(DISTINCT customer_id) as "totalCustomers",
        COUNT(sale_id) as "totalOrders",
        COALESCE(SUM(revenue), 0) as "totalRevenue",
        COALESCE(AVG(revenue), 0) as "aov"
      FROM fact_sales
    `;
    
    const recentOrders = await prisma.$queryRaw`
      SELECT 
        f.original_order_id as id,
        c.name as "customerName",
        p.name as "productName",
        f.revenue,
        f.sale_date as "createdAt"
      FROM fact_sales f
      JOIN dim_customer c ON f.customer_id = c.customer_id
      JOIN dim_product p ON f.product_id = p.product_id
      ORDER BY f.sale_date DESC
      LIMIT 5
    `;
    
    // Convert BigInts from queryRaw to numbers
    res.json({
      totalCustomers: Number(metrics[0].totalCustomers),
      totalOrders: Number(metrics[0].totalOrders),
      totalRevenue: Number(metrics[0].totalRevenue),
      aov: Number(metrics[0].aov),
      recentOrders: recentOrders.map((o) => ({
        ...o,
        revenue: Number(o.revenue)
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

// --- Analytics ---
app.get('/api/analytics/revenue', async (req, res) => {
  try {
    const revenueByDate = await prisma.$queryRaw`
      SELECT 
        DATE(sale_date) as date,
        SUM(revenue) as revenue
      FROM fact_sales
      GROUP BY DATE(sale_date)
      ORDER BY DATE(sale_date) ASC
    `;
    
    res.json(revenueByDate.map((r) => ({
      date: r.date.toISOString().split('T')[0],
      revenue: Number(r.revenue)
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
});

app.get('/api/analytics/sales-by-product', async (req, res) => {
  try {
    const products = await prisma.$queryRaw`
      SELECT 
        p.name,
        SUM(f.revenue) as revenue
      FROM fact_sales f
      JOIN dim_product p ON f.product_id = p.product_id
      GROUP BY p.name
      ORDER BY revenue DESC
      LIMIT 5
    `;
    
    res.json(products.map((p) => ({
      name: p.name,
      revenue: Number(p.revenue)
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product analytics' });
  }
});

app.get('/api/analytics/sales-by-category', async (req, res) => {
  try {
    const categories = await prisma.$queryRaw`
      SELECT 
        p.category,
        SUM(f.revenue) as revenue
      FROM fact_sales f
      JOIN dim_product p ON f.product_id = p.product_id
      GROUP BY p.category
      ORDER BY revenue DESC
    `;
    
    res.json(categories.map((c) => ({
      name: c.category,
      revenue: Number(c.revenue)
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch category analytics' });
  }
});

app.get('/api/analytics/sales-by-city', async (req, res) => {
  try {
    const cities = await prisma.$queryRaw`
      SELECT 
        c.city,
        SUM(f.revenue) as revenue
      FROM fact_sales f
      JOIN dim_customer c ON f.customer_id = c.customer_id
      GROUP BY c.city
      ORDER BY revenue DESC
    `;
    
    res.json(cities.map((c) => ({
      name: c.city,
      revenue: Number(c.revenue)
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch city analytics' });
  }
});

// --- Pipeline Trigger & Status ---
app.post('/api/pipeline/run', async (req, res) => {
  try {
    const etlUrl = process.env.ETL_SERVICE_URL || 'http://localhost:8000';
    const response = await fetch(`${etlUrl}/api/pipeline/run`, {
      method: 'POST'
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to trigger ETL pipeline' });
  }
});

app.get('/api/pipeline/status', async (req, res) => {
  try {
    const etlUrl = process.env.ETL_SERVICE_URL || 'http://localhost:8000';
    const response = await fetch(`${etlUrl}/api/pipeline/status`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch pipeline status' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
