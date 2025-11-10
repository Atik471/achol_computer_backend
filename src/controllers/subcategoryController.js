import Subcategory from '../models/Subcategory.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';

/**
 * @desc    Get all subcategories
 * @route   GET /api/subcategories
 * @access  Public
 */
export const getSubcategories = asyncHandler(async (req, res, next) => {
  const subcategories = await Subcategory.find({})
    .populate('category', 'name slug') // Populate the parent category's name and slug
    .sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: subcategories.length,
    data: subcategories,
  });
});