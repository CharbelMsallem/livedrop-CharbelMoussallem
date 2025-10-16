import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const client = new MongoClient(process.env.MONGO_URI);

async function seed() {
  try {
    await client.connect();
    console.log("Connected to MongoDB for seeding...");
    const db = client.db();

    // --- Clean existing collections ---
    console.log("Clearing existing data...");
    await db.collection('products').deleteMany({});
    await db.collection('customers').deleteMany({});
    await db.collection('orders').deleteMany({});

    // --- 1. Seed Products (30) --- // SAMPLE PRODUCTS, IF REAL, WE USE AWS S3 STORAGE FOR IMAGES
    console.log("Seeding products...");
    const products = [
      { _id: 'p001', name: '4K Ultra HD Smart TV', description: 'A 55-inch 4K UHD Smart TV with stunning picture quality.', price: 479.99, category: 'Electronics', tags: ['Electronics', 'Smart Home'], imageUrl: 'https://images.unsplash.com/photo-1593784944564-e4686a02b3a3?auto=format&fit=crop&w=400&q=80', stock: 50 },
      { _id: 'p002', name: 'Wireless Surround Sound System', description: 'A 5.1 channel wireless surround sound system for an immersive home theater experience.', price: 329.50, category: 'Electronics', tags: ['Electronics', 'Audio'], imageUrl: 'https://images.unsplash.com/photo-1590783609742-82564b33e5fd?auto=format&fit=crop&w=400&q=80', stock: 40 },
      { _id: 'p003', name: 'Curved Gaming Monitor', description: 'A 27-inch curved gaming monitor with a 144Hz refresh rate for smooth gameplay.', price: 279.95, category: 'Electronics', tags: ['Electronics', 'Gaming', 'Computer'], imageUrl: 'https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?auto=format&fit=crop&w=400&q=80', stock: 60 },
      { _id: 'p004', name: 'Noise-Cancelling Over-Ear Headphones', description: 'High-fidelity noise-cancelling headphones with a 30-hour battery life.', price: 349.00, category: 'Electronics', tags: ['Electronics', 'Audio', 'Accessories'], imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80', stock: 80 },
      { _id: 'p005', name: 'Smartwatch with Health Tracking', description: 'A sleek smartwatch with GPS, heart rate monitoring, and a vibrant display.', price: 249.99, category: 'Electronics', tags: ['Electronics', 'Health & Fitness', 'Smart Home'], imageUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=400&q=80', stock: 70 },
      { _id: 'p006', name: 'Digital SLR Camera Kit', description: 'A 24MP DSLR camera with an 18-55mm lens, perfect for aspiring photographers.', price: 499.99, category: 'Electronics', tags: ['Electronics', 'Camera'], imageUrl: 'https://images.unsplash.com/photo-1512756290469-ec264b7fbf87?auto=format&fit=crop&w=400&q=80', stock: 25 },
      { _id: 'p007', name: 'Next-Gen Gaming Console', description: 'The latest gaming console with next-gen graphics and an ultra-fast SSD.', price: 499.99, category: 'Electronics', tags: ['Electronics', 'Gaming'], imageUrl: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=400&q=80', stock: 35 },
      { _id: 'p008', name: 'Immersive Virtual Reality Headset', description: 'An immersive VR headset with high-resolution displays and intuitive controls.', price: 399.00, category: 'Electronics', tags: ['Electronics', 'Gaming'], imageUrl: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&w=400&q=80', stock: 45 },
      { _id: 'p009', name: '4K Action Camera Drone', description: 'A foldable 4K drone with a 3-axis gimbal for capturing stunning aerial footage.', price: 450.00, category: 'Electronics', tags: ['Electronics', 'Camera', 'Outdoors'], imageUrl: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=400&q=80', stock: 20 },
      { _id: 'p010', name: 'Portable Power Bank (20,000mAh)', description: 'A 20,000mAh portable power bank to keep your devices charged on the go.', price: 59.95, category: 'Accessories', tags: ['Accessories', 'Lifestyle'], imageUrl: 'https://images.unsplash.com/photo-1588855426515-5c58ea13b3c3?auto=format&fit=crop&w=400&q=80', stock: 150 },
      { _id: 'p011', name: 'Lightweight Travel Tripod', description: 'A lightweight and sturdy tripod for capturing stable shots and videos.', price: 79.99, category: 'Accessories', tags: ['Accessories', 'Camera'], imageUrl: 'https://images.unsplash.com/photo-1510127034890-ba2750817415?auto=format&fit=crop&w=400&q=80', stock: 100 },
      { _id: 'p012', name: 'Smart Home Hub (Gen 2)', description: 'Control all your smart home devices with this central smart home hub.', price: 99.00, category: 'Electronics', tags: ['Electronics', 'Smart Home'], imageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=400&q=80', stock: 90 },
      { _id: 'p013', name: 'Smart Electric Toothbrush', description: 'An electric toothbrush with AI-powered brushing guidance and multiple cleaning modes.', price: 119.50, category: 'Health', tags: ['Health & Fitness', 'Smart Home'], imageUrl: 'https://images.unsplash.com/photo-1600947000722-ce556e379b37?auto=format&fit=crop&w=400&q=80', stock: 95 },
      { _id: 'p014', name: 'Mechanical Bluetooth Keyboard', description: 'A compact mechanical keyboard with Bluetooth connectivity and customizable RGB lighting.', price: 149.99, category: 'Computer', tags: ['Computer', 'Accessories', 'Gaming'], imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=400&q=80', stock: 110 },
      { _id: 'p015', name: 'Ergonomic Vertical Mouse', description: 'Reduces wrist strain with a natural handshake grip.', price: 69.50, category: 'Computer', tags: ['Computer', 'Accessories'], imageUrl: 'https://images.unsplash.com/photo-1615596423230-c3d64b58835d?auto=format&fit=crop&w=400&q=80', stock: 130 },
      { _id: 'p016', name: 'High-Speed Blender', description: 'Powerful blender for smoothies, soups, and crushing ice.', price: 129.99, category: 'Appliances', tags: ['Appliances', 'Lifestyle'], imageUrl: 'https://images.unsplash.com/photo-1583337731362-11e26398d898?auto=format&fit=crop&w=400&q=80', stock: 75 },
      { _id: 'p017', name: 'Waterproof Hiking Boots', description: 'Durable and waterproof boots for all-terrain hiking.', price: 139.95, category: 'Fashion', tags: ['Outdoors', 'Lifestyle'], imageUrl: 'https://images.unsplash.com/photo-1534653299134-46a164025299?auto=format&fit=crop&w=400&q=80', stock: 80 },
      { _id: 'p018', name: 'Portable Bluetooth Speaker', description: 'Compact, waterproof speaker with 12-hour battery life.', price: 89.99, category: 'Electronics', tags: ['Electronics', 'Audio', 'Outdoors'], imageUrl: 'https://images.unsplash.com/photo-1589256952523-3a78b5434771?auto=format&fit=crop&w=400&q=80', stock: 110 },
      { _id: 'p019', name: 'Modern Desk Lamp', description: 'An adjustable LED desk lamp with multiple brightness levels.', price: 59.00, category: 'Home Decor', tags: ['Lifestyle', 'Accessories'], imageUrl: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=400&q=80', stock: 90 },
      { _id: 'p020', name: 'Fast Wireless Charging Pad', description: 'A fast wireless charging pad compatible with all Qi-enabled devices.', price: 39.99, category: 'Accessories', tags: ['Accessories', 'Electronics'], imageUrl: 'https://images.unsplash.com/photo-1549298236-8384b6095595?auto=format&fit=crop&w=400&q=80', stock: 200 },
      { _id: 'p021', name: 'Smart LED Light Bulbs (4-Pack)', description: 'A pack of 4 smart LED light bulbs with customizable colors and voice control.', price: 49.99, category: 'Smart Home', tags: ['Smart Home', 'Electronics'], imageUrl: 'https://images.unsplash.com/photo-1521464304473-4c3c3a44a2c3?auto=format&fit=crop&w=400&q=80', stock: 120 },
      { _id: 'p022', name: 'Yoga Mat (Eco-Friendly)', description: 'A non-slip, eco-friendly mat for yoga and exercise.', price: 45.50, category: 'Fitness', tags: ['Health & Fitness', 'Lifestyle'], imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&q=80', stock: 150 },
      { _id: 'p023', name: 'Insulated Water Bottle', description: 'Keeps drinks cold for 24 hours or hot for 12.', price: 29.95, category: 'Lifestyle', tags: ['Lifestyle', 'Outdoors', 'Health & Fitness'], imageUrl: 'https://images.unsplash.com/photo-1593392336329-573552d3a35b?auto=format&fit=crop&w=400&q=80', stock: 200 },
      { _id: 'p024', name: 'Hardcover Journal Notebook', description: 'A5 lined journal with 200 pages for notes and ideas.', price: 19.99, category: 'Office', tags: ['Lifestyle', 'Accessories'], imageUrl: 'https://images.unsplash.com/photo-1516414447565-b14be0adf13e?auto=format&fit=crop&w=400&q=80', stock: 300 },
      { _id: 'p025', name: 'Scented Soy Candle', description: 'A hand-poured soy wax candle with a lavender scent.', price: 24.50, category: 'Home Decor', tags: ['Lifestyle'], imageUrl: 'https://images.unsplash.com/photo-1594323861394-133b337c8636?auto=format&fit=crop&w=400&q=80', stock: 120 },
      { _id: 'p026', name: 'Gourmet Coffee Beans (12 oz)', description: 'Whole bean, medium roast coffee from Colombia.', price: 15.99, category: 'Groceries', tags: ['Lifestyle', 'Appliances'], imageUrl: 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?auto=format&fit=crop&w=400&q=80', stock: 180 },
      { _id: 'p027', name: 'Silk Sleep Mask', description: 'A 100% silk mask for a comfortable and deep sleep.', price: 22.00, category: 'Lifestyle', tags: ['Lifestyle', 'Health & Fitness'], imageUrl: 'https://images.unsplash.com/photo-1512144703531-e252f9c8a927?auto=format&fit=crop&w=400&q=80', stock: 140 },
      { _id: 'p028', name: 'Reusable Shopping Bags (3-pack)', description: 'Durable, foldable bags for groceries and shopping.', price: 12.50, category: 'Lifestyle', tags: ['Lifestyle'], imageUrl: 'https://images.unsplash.com/photo-1588964893623-7a6a4d830b8e?auto=format&fit=crop&w=400&q=80', stock: 400 },
      { _id: 'p029', name: 'Phone Screen Protector', description: 'Tempered glass protector for latest smartphone models.', price: 9.99, category: 'Accessories', tags: ['Accessories', 'Electronics'], imageUrl: 'https://images.unsplash.com/photo-1589793463342-36b437293120?auto=format&fit=crop&w=400&q=80', stock: 500 },
      { _id: 'p030', name: 'Stainless Steel Straws (4-Pack)', description: 'Set of 4 reusable straws with cleaning brush.', price: 7.99, category: 'Kitchen', tags: ['Lifestyle', 'Appliances'], imageUrl: 'https://images.unsplash.com/photo-1589711593319-5a8ab8703833?auto=format&fit=crop&w=400&q=80', stock: 600 }
    ];
    await db.collection('products').insertMany(products);
    console.log(`${products.length} products seeded.`);

    // --- 2. Seed Customers (15) ---
    console.log("Seeding customers...");
    const customers = [
        { name: 'Alice Johnson', email: 'alice.j@example.com', phone: '123-456-7890', address: '123 Maple St, Springfield, IL 62704', createdAt: new Date() },
        { name: 'Bob Smith', email: 'bob.smith@example.com', phone: '234-567-8901', address: '456 Oak Ave, Shelbyville, TN 37160', createdAt: new Date() },
        { name: 'Charlie Brown', email: 'charlie.b@example.com', phone: '345-678-9012', address: '789 Pine Ln, Capital City, CA 90210', createdAt: new Date() },
        { name: 'Demo User', email: 'demo@example.com', phone: '555-555-5555', address: '101 Demo Ct, Testville, TX 75001', createdAt: new Date() },
        { name: 'Diana Prince', email: 'diana.p@example.com', phone: '456-789-0123', address: '22 Themyscira Blvd, Paradise Island, DC 20001', createdAt: new Date() },
        { name: 'Ethan Hunt', email: 'ethan.h@example.com', phone: '567-890-1234', address: '789 Impossible Rd, Langley, VA 22101', createdAt: new Date() },
        { name: 'Fiona Glenanne', email: 'fiona.g@example.com', phone: '678-901-2345', address: '456 Burn Notice Way, Miami, FL 33101', createdAt: new Date() },
        { name: 'George Costanza', email: 'george.c@example.com', phone: '789-012-3456', address: '1344 Vandelay St, New York, NY 10001', createdAt: new Date() },
        { name: 'Hannah Montana', email: 'hannah.m@example.com', phone: '890-123-4567', address: '987 Popstar Dr, Malibu, CA 90265', createdAt: new Date() },
        { name: 'Indiana Jones', email: 'indy.j@example.com', phone: '901-234-5678', address: '321 Museum Arch, Barnett College, CT 06510', createdAt: new Date() },
        { name: 'Jack Sparrow', email: 'jack.s@example.com', phone: '111-222-3333', address: 'The Black Pearl, Port Royal, Caribbean', createdAt: new Date() },
        { name: 'Kara Thrace', email: 'kara.t@example.com', phone: '222-333-4444', address: 'Galactica CIC, Caprica City, CY 00001', createdAt: new Date() },
        { name: 'Leo Fitz', email: 'leo.f@example.com', phone: '333-444-5555', address: 'S.H.I.E.L.D. Playground, Secret Location', createdAt: new Date() },
        { name: 'Michael Scott', email: 'michael.s@example.com', phone: '444-555-6666', address: '1725 Slough Ave, Scranton, PA 18505', createdAt: new Date() },
        { name: 'Nancy Drew', email: 'nancy.d@example.com', phone: '555-666-7777', address: '345 River Heights, River Heights, IL 60007', createdAt: new Date() }
    ];
    await db.collection('customers').insertMany(customers.map(c => ({...c, _id: new ObjectId()})));
    console.log(`${customers.length} customers seeded.`);

    // --- 3. Seed Orders (20) ---
    const seededCustomers = await db.collection('customers').find().toArray();
    const seededProducts = await db.collection('products').find().toArray();
    
    const demoUser = seededCustomers.find(c => c.email === 'demo@example.com');

    console.log("Seeding orders...");
    const orders = [
      // 3 orders for Demo User
      { customerId: demoUser._id, items: [{ productId: 'p003', name: products[2].name, price: products[2].price, quantity: 1 }], total: 1199.99, status: 'PROCESSING', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      { customerId: demoUser._id, items: [{ productId: 'p006', name: products[5].name, price: products[5].price, quantity: 1 }, { productId: 'p007', name: products[9].name, price: products[9].price, quantity: 2 }], total: 409.93, status: 'SHIPPED', carrier: 'FedEx', estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
      { customerId: demoUser._id, items: [{ productId: 'p025', name: products[24].name, price: products[24].price, quantity: 1 }], total: 29.95, status: 'DELIVERED', createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },

      // 17 more diverse orders
      { customerId: seededCustomers[0]._id, items: [{ productId: 'p001', name: products[0].name, price: products[0].price, quantity: 1 }], total: 479.99, status: 'DELIVERED', createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
      { customerId: seededCustomers[1]._id, items: [{ productId: 'p013', name: products[12].name, price: products[12].price, quantity: 1 }], total: 499.99, status: 'PENDING', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      { customerId: seededCustomers[2]._id, items: [{ productId: 'p009', name: products[8].name, price: products[8].price, quantity: 1 }, { productId: 'p010', name: products[9].name, price: products[9].price, quantity: 1 }], total: 978.99, status: 'SHIPPED', carrier: 'DHL', estimatedDelivery: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { customerId: seededCustomers[4]._id, items: [{ productId: 'p017', name: products[16].name, price: products[16].price, quantity: 1 }], total: 489.99, status: 'DELIVERED', createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      { customerId: seededCustomers[5]._id, items: [{ productId: 'p004', name: products[3].name, price: products[3].price, quantity: 2 }], total: 559.90, status: 'PROCESSING', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { customerId: seededCustomers[6]._id, items: [{ productId: 'p019', name: products[18].name, price: products[18].price, quantity: 1 }], total: 149.99, status: 'PENDING', createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) },
      { customerId: seededCustomers[7]._id, items: [{ productId: 'p014', name: products[13].name, price: products[13].price, quantity: 1 }], total: 399.00, status: 'SHIPPED', carrier: 'UPS', estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { customerId: seededCustomers[8]._id, items: [{ productId: 'p002', name: products[1].name, price: products[1].price, quantity: 1 }], total: 329.50, status: 'PROCESSING', createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) },
      { customerId: seededCustomers[9]._id, items: [{ productId: 'p011', name: products[10].name, price: products[10].price, quantity: 1 }, { productId: 'p012', name: products[11].name, price: products[11].price, quantity: 3 }], total: 278.97, status: 'DELIVERED', createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) },
      { customerId: seededCustomers[10]._id, items: [{ productId: 'p004', name: products[3].name, price: products[3].price, quantity: 1 }], total: 279.95, status: 'SHIPPED', carrier: 'FedEx', estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      { customerId: seededCustomers[11]._id, items: [{ productId: 'p015', name: products[14].name, price: products[14].price, quantity: 1 }], total: 450.00, status: 'PENDING', createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) },
      { customerId: seededCustomers[0]._id, items: [{ productId: 'p018', name: products[17].name, price: products[17].price, quantity: 1 }], total: 199.00, status: 'PROCESSING', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { customerId: seededCustomers[3]._id, items: [{ productId: 'p021', name: products[20].name, price: products[20].price, quantity: 1 }], total: 499.95, status: 'DELIVERED', createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
      { customerId: seededCustomers[12]._id, items: [{ productId: 'p028', name: products[27].name, price: products[27].price, quantity: 1 }], total: 139.95, status: 'PENDING', createdAt: new Date(Date.now() - 30 * 60 * 1000) },
      { customerId: seededCustomers[13]._id, items: [{ productId: 'p026', name: products[25].name, price: products[25].price, quantity: 5 }], total: 99.95, status: 'PROCESSING', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { customerId: seededCustomers[14]._id, items: [{ productId: 'p023', name: products[22].name, price: products[22].price, quantity: 1 }], total: 189.00, status: 'SHIPPED', carrier: 'UPS', estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { customerId: seededCustomers[3]._id, items: [{ productId: 'p030', name: products[29].name, price: products[29].price, quantity: 3 }], total: 23.97, status: 'DELIVERED', createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
    ];
    await db.collection('orders').insertMany(orders.map(o => ({...o, updatedAt: new Date() })));
    console.log(`${orders.length} orders seeded.`);

  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await client.close();
    console.log("MongoDB connection closed.");
  }
}

seed();