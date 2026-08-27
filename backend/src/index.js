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
    const customerCount = await prisma.customer.count();
    const orderCount = await prisma.order.count();
    
    const revenueAgg = await prisma.order.aggregate({
      _sum: { revenue: true }
    });
    
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { customer: true, product: true }
    });
    
    res.json({
      totalCustomers: customerCount,
      totalOrders: orderCount,
      totalRevenue: revenueAgg._sum.revenue || 0,
      recentOrders
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

// --- Analytics ---
app.get('/api/analytics/revenue', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'asc' }
    });
    
    const revenueByDate = orders.reduce((acc, order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!acc[date]) acc[date] = 0;
      acc[date] += order.revenue;
      return acc;
    }, {});
    
    const data = Object.keys(revenueByDate).map(date => ({
      date,
      revenue: revenueByDate[date]
    }));
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
});

app.get('/api/analytics/products', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: { product: true }
    });
    
    const revenueByProduct = orders.reduce((acc, order) => {
      const name = order.product?.name || 'Unknown';
      if (!acc[name]) acc[name] = 0;
      acc[name] += order.revenue;
      return acc;
    }, {});
    
    const data = Object.keys(revenueByProduct).map(name => ({
      name,
      revenue: revenueByProduct[name]
    })).sort((a, b) => b.revenue - a.revenue);
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product analytics' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
