import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import router from './routes/categoryRoutes.js';

// Connect to database
connectDB();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api/categories', router);

export default app;