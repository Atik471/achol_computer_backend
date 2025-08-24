import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import categoryRouter from './routes/categoryRoutes.js';
import authRouter from './routes/authRoutes.js';
import adminProductRouter from './routes/adminProductRoutes.js';
import productRouter from './routes/productRoutes.js';
import helmet from 'helmet';
import morgan from 'morgan';

// Connect to database
connectDB();

const app = express();

app.use(helmet()); 
const allowedOrigins = [
  'http://localhost:5173',
  'https://achol-computer-frontend.onrender.com/'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  exposedHeaders: ['Authorization', 'X-Access-Token', 'X-Refresh-Token'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(morgan('dev'));  

app.use('/api/categories', categoryRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin/products', adminProductRouter);
app.use('/api/products', productRouter);

export default app;