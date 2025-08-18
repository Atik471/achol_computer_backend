// routes/productRoutes.js
import express from 'express';
import {
  getProducts,
  getProduct,
  getFeaturedProducts,
  getNewArrivals,
  getRelatedProducts,
  getProductsByCategory,
  getProductsBySubcategory
} from '../controllers/productController.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProduct);
router.get('/featured', getFeaturedProducts);
router.get('/new', getNewArrivals);
router.get('/:id/related', getRelatedProducts);
router.get('/category/:categoryId', getProductsByCategory);
router.get('/subcategory/:subcategoryId', getProductsBySubcategory);


export default router;