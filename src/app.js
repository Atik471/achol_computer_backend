import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import categoryRouter from './routes/categoryRoutes.js';
import authRouter from './routes/authRoutes.js';

// Connect to database
connectDB();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api/categories', categoryRouter);
app.use('/api/auth', authRouter);

export default app;