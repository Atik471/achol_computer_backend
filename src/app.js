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

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Apply Helmet for security headers (but allow cross-origin credentials)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
}));

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/categories', categoryRouter);
app.use('/api/subcategories', subcategoryRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin/products', adminProductRouter);
app.use('/api/products', productRouter);

// Global error handler - ensures CORS headers are sent with error responses
app.use((err, req, res, next) => {
  console.error('Error:', err.message);

  // Ensure CORS headers are sent with error responses
  const origin = req.headers.origin;
  if (origin) {
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.startsWith('/') && allowedOrigin.endsWith('/')) {
        const regex = new RegExp(allowedOrigin.slice(1, -1));
        return regex.test(origin);
      }
      return allowedOrigin === origin;
    });

    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  }

  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Server Error'
  });
});

export default app;