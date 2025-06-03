import express from 'express';
// import itemRoutes from './routes/itemRoutes';
// import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(express.json());

// Routes
// app.use('/api/items', itemRoutes);

// Global error handler (should be after routes)
// app.use(errorHandler);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});
// / route 
app.get('/', (req, res) => {
  res.status(200).send('Welcome to the API');
});


export default app;