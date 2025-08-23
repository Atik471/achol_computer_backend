import express from 'express';
const router = express.Router();

import {
  createCategory,
  addSubcategory,
  deleteCategory,
  deleteSubcategory,
  getCategories
} from '../controllers/categoryController.js';
import { adminProtect } from '../middlewares/authMiddleware.js';

// GET /api/categories - Get all categories with subcategories
router.get('/', getCategories);

// POST /api/categories - Create new category
router.post('/', adminProtect, createCategory);

// POST /api/categories/:categoryId/subcategories - Add subcategory
router.post('/:categoryId/subcategories', adminProtect, addSubcategory);

// DELETE /api/categories/:id - Delete category
router.delete('/:id', adminProtect, deleteCategory);

// DELETE /api/categories/:categoryId/subcategories/:subcategoryId - Delete subcategory
router.delete('/:categoryId/subcategories/:subcategoryId', adminProtect, deleteSubcategory);

export default router;