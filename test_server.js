import express from 'express';
import authRouter from './src/routes/authRoutes.js';
import categoryRouter from './src/routes/categoryRoutes.js';
import subcategoryRouter from './src/routes/subcategoryRoutes.js';
import adminProductRouter from './src/routes/adminProductRoutes.js';
import productRouter from './src/routes/productRoutes.js';

const app = express();
console.log("Express initialized");

app.use('/api/auth', authRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/subcategories', subcategoryRouter);
app.use('/api/admin/products', adminProductRouter);
app.use('/api/products', productRouter);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

console.log("Routes setup complete");

app.options(/.*/, (req, res) => res.sendStatus(200));

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Test Server is running on port ${PORT}`);
});
