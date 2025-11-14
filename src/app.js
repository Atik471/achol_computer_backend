import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import categoryRouter from './routes/categoryRoutes.js';
import subcategoryRouter from './routes/subcategoryRoutes.js';
import authRouter from './routes/authRoutes.js';
import adminProductRouter from './routes/adminProductRoutes.js';
import productRouter from './routes/productRoutes.js';
import helmet from 'helmet';
import morgan from 'morgan';

// Connect to database
connectDB();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "/\.onrender\.com$/",
  "https://acholcomputer.com",
  "https://www.acholcomputer.com",
];

const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some(allowedOrigin => {
      // If the allowedOrigin is a regex pattern string
      if (allowedOrigin.startsWith('/') && allowedOrigin.endsWith('/')) {
        const regex = new RegExp(allowedOrigin.slice(1, -1));
        return regex.test(origin);
      }
      // Otherwise, it's a regular string
      return allowedOrigin === origin;
    });

    if (isAllowed) {
      callback(null, true)
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Authorization", "X-Access-Token", "X-Refresh-Token"],
};

// Apply CORS globally
app.use(cors(corsOptions));

// Apply Helmet for security headers
app.use(helmet());

// Preflight (OPTIONS) for all routes
// app.options("*", cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(morgan('dev'));  

app.use('/api/categories', categoryRouter);
app.use('/api/subcategories', subcategoryRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin/products', adminProductRouter);
app.use('/api/products', productRouter);

export default app;