import express from 'express';
const router = express.Router();

import {
  createCategory,
  addSubcategory,
  deleteCategory,
  deleteSubcategory,
  getCategories
} from '../controllers/categoryController.js';

// GET /api/categories - Get all categories with subcategories
router.get('/', getCategories);

// POST /api/categories - Create new category
router.post('/', createCategory);

// POST /api/categories/:categoryId/subcategories - Add subcategory
router.post('/:categoryId/subcategories', addSubcategory);

// DELETE /api/categories/:id - Delete category
router.delete('/:id', deleteCategory);

// DELETE /api/categories/:categoryId/subcategories/:subcategoryId - Delete subcategory
router.delete('/:categoryId/subcategories/:subcategoryId', deleteSubcategory);

export default router;