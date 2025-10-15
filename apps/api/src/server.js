import express from 'express';
import cors from 'cors';
import { connectToDb } from './db.js';
import productRoutes from './routes/products.js';
import customerRoutes from './routes/customers.js';
import orderRoutes from './routes/orders.js';    
import analyticsRoutes from './routes/analytics.js'; 
import sseRoutes from './sse/order-status.js';  

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).send('Server is healthy');
});

// ROUTERS
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes); 
app.use('/api/orders', orderRoutes);    
app.use('/api/analytics', analyticsRoutes);  
app.use('/api/orders', sseRoutes); 

async function startServer() {
  await connectToDb();
  app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
  });
}

startServer();