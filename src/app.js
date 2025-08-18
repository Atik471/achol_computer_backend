import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import categoryRouter from './routes/categoryRoutes.js';
import authRouter from './routes/authRoutes.js';
import adminProductRouter from './routes/adminProductRoutes.js';

// Connect to database
connectDB();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

app.use('/api/categories', categoryRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin/products', adminProductRouter);

export default app;