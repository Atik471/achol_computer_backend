import express from 'express';
import {
  getCategories,
  createCategory,
  addSubcategory
} from '../controllers/categoryController.js';
import { adminProtect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/').get(getCategories).post(adminProtect, createCategory);

router.route('/:categoryId/subcategories').post(adminProtect, addSubcategory);

export default router;