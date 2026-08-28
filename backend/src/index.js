const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const xlsx = require('xlsx');
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

// --- Import Data ---
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/import/excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    
    // Validate sheets
    const requiredSheets = ['Customers', 'Products', 'Orders'];
    for (const sheetName of requiredSheets) {
      if (!workbook.SheetNames.includes(sheetName)) {
        return res.status(400).json({ error: `Missing required sheet: ${sheetName}` });
      }
    }

    const customersData = xlsx.utils.sheet_to_json(workbook.Sheets['Customers']);
    const productsData = xlsx.utils.sheet_to_json(workbook.Sheets['Products']);
    const ordersData = xlsx.utils.sheet_to_json(workbook.Sheets['Orders']);

    let customersImported = 0;
    let productsImported = 0;
    let ordersImported = 0;

    // We will store mapping of original Excel IDs to new Database IDs
    const customerIdMap = new Map(); 
    const productIdMap = new Map();

    // 1. Import Customers
    for (const row of customersData) {
      const excelId = row['Customer ID'];
      const name = row['Name'];
      const city = row['City'];

      if (!name || !city) continue;

      let customer = await prisma.customer.findFirst({
        where: { name, city }
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: { name, city }
        });
        customersImported++;
      }
      
      if (excelId) {
        customerIdMap.set(excelId.toString(), customer.id);
      }
    }

    // 2. Import Products
    for (const row of productsData) {
      const excelId = row['Product ID'];
      const name = row['Name'];
      const category = row['Category'];
      const price = parseFloat(row['Price']);

      if (!name || !category || isNaN(price)) continue;

      let product = await prisma.product.findFirst({
        where: { name, category }
      });

      if (!product) {
        product = await prisma.product.create({
          data: { name, category, price }
        });
        productsImported++;
      } else if (product.price !== price) {
        // Update price if it changed
        product = await prisma.product.update({
          where: { id: product.id },
          data: { price }
        });
      }
      
      if (excelId) {
        productIdMap.set(excelId.toString(), product.id);
      }
    }

    // 3. Import Orders
    for (const row of ordersData) {
      const excelCustId = row['Customer ID']?.toString();
      const excelProdId = row['Product ID']?.toString();
      const quantity = parseInt(row['Quantity']);
      const orderDateExcel = row['Order Date']; // Might be a number or string

      if (!excelCustId || !excelProdId || isNaN(quantity)) continue;

      const customerId = customerIdMap.get(excelCustId);
      const productId = productIdMap.get(excelProdId);

      if (!customerId || !productId) continue; // Skip if we couldn't resolve the DB ID

      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) continue;

      const revenue = product.price * quantity;
      
      // Parse Order Date if present (Excel stores dates as numbers sometimes)
      let createdAt = new Date();
      if (orderDateExcel) {
        if (typeof orderDateExcel === 'number') {
           // Excel epoch starts at Jan 1 1900
           createdAt = new Date((orderDateExcel - 25569) * 86400 * 1000);
        } else {
           const parsed = new Date(orderDateExcel);
           if (!isNaN(parsed.getTime())) createdAt = parsed;
        }
      }

      await prisma.order.create({
        data: {
          customerId,
          productId,
          quantity,
          revenue,
          createdAt
        }
      });
      ordersImported++;
    }

    res.json({
      success: true,
      customersImported,
      productsImported,
      ordersImported,
      message: "Import completed successfully"
    });

  } catch (error) {
    console.error("Excel import error:", error);
    res.status(500).json({ error: 'Failed to process Excel file', details: error.message });
  }
});

app.post('/api/import/clear', async (req, res) => {
  try {
    // Delete in correct order to respect foreign key constraints
    await prisma.order.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.customer.deleteMany({});
    
    // Also clear DW tables
    await prisma.$executeRaw`TRUNCATE TABLE fact_sales CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE dim_product CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE dim_customer CASCADE`;

    res.json({ success: true, message: 'All data cleared successfully. Ready for a fresh start!' });
  } catch (error) {
    console.error("Clear data error:", error);
    res.status(500).json({ error: 'Failed to clear data', details: error.message });
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
