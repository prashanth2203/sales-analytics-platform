const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed process...");
  
  // Clear existing
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.customer.deleteMany({});

  // Generate 20 Customers
  const customers = [];
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
  
  for (let i = 1; i <= 20; i++) {
    const customer = await prisma.customer.create({
      data: {
        name: `Customer ${i}`,
        city: cities[Math.floor(Math.random() * cities.length)]
      }
    });
    customers.push(customer);
  }
  console.log(`Seeded ${customers.length} customers.`);

  // Generate 15 Products
  const products = [];
  const categories = ['Electronics', 'Furniture', 'Software', 'Hardware', 'Services'];
  
  for (let i = 1; i <= 15; i++) {
    const price = Math.floor(Math.random() * 500) + 10.99;
    const product = await prisma.product.create({
      data: {
        name: `Product ${i}`,
        category: categories[Math.floor(Math.random() * categories.length)],
        price: parseFloat(price.toFixed(2))
      }
    });
    products.push(product);
  }
  console.log(`Seeded ${products.length} products.`);

  // Generate ~1500 Orders spanning the last 30 days
  let orderCount = 0;
  const now = new Date();
  
  for (let i = 0; i < 1500; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    const quantity = Math.floor(Math.random() * 5) + 1;
    const revenue = product.price * quantity;
    
    // Random date in the last 30 days
    const pastDate = new Date(now.getTime() - (Math.random() * 30 * 24 * 60 * 60 * 1000));

    await prisma.order.create({
      data: {
        customerId: customer.id,
        productId: product.id,
        quantity,
        revenue,
        createdAt: pastDate
      }
    });
    orderCount++;
    if (orderCount % 100 === 0) console.log(`Seeded ${orderCount} orders...`);
  }
  console.log(`Successfully seeded ${orderCount} orders.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
