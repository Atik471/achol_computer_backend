// routes/productRoutes.js
import express from 'express';
import {
  getProducts,
  getProduct,
  // getFeaturedProducts,
  getNewArrivals,
  getRelatedProducts,
  getProductsByCategory,
  getProductsBySubcategory,
  getProductBySlug
} from '../controllers/productController.js';

const router = express.Router();

router.get('/', getProducts);
// router.get('/featured', getFeaturedProducts);
router.get('/new', getNewArrivals);
router.get('/category/:categoryId', getProductsByCategory);
router.get('/subcategory/:subcategoryId', getProductsBySubcategory);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id/related', getRelatedProducts);
router.get('/:id', getProduct);


export default router;