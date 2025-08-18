import express from 'express';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  uploadProductImages,
  deleteProductImage,
  toggleProductStatus,
  setFeaturedProduct
} from '../controllers/adminProductControllers.js';
import { adminProtect } from '../middlewares/authMiddleware.js';
// import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// router.route('/')
//   .post(adminProtect, upload.array('images', 5), createProduct);

router.route('/')
  .post(adminProtect, createProduct);

router.route('/:id')
  .put(adminProtect, updateProduct)
  .delete(adminProtect, deleteProduct);

router.route('/:id/stock')
  .patch(adminProtect, updateProductStock);

// router.route('/:id/images')
//   .post(adminProtect, upload.array('images', 5), uploadProductImages);

router.route('/:id/images/:imageId')
  .delete(adminProtect, deleteProductImage);

router.route('/:id/status')
  .patch(adminProtect, toggleProductStatus);

router.route('/:id/featured')
  .patch(adminProtect, setFeaturedProduct);

export default router;