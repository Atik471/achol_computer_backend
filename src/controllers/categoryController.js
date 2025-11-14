import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';

// @desc    Create new category
// @route   POST /api/categories
export const createCategory = asyncHandler(async (req, res, next) => {
  const { name, description, image, icon, metaTitle, metaDescription } = req.body;

    // Check if category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return next(new ErrorResponse(`Category '${name}' already exists`, 400));
    }
    
    const category = await Category.create({
      name,
      description,
      image,
      icon,
      metaTitle,
      metaDescription
    });

    res.status(201).json({
      success: true,
      data: category
    });
});

// @desc    Add subcategory to category (now creates a separate Subcategory doc)
// @route   POST /api/categories/:categoryId/subcategories
export const addSubcategory = asyncHandler(async (req, res, next) => {
    const { name, description, image } = req.body;
    const category = await Category.findById(req.params.categoryId);

    if (!category) {
      return next(new ErrorResponse('Category not found', 404));
    }

    
    // Generate preliminary slug
    const baseSlug = name.toLowerCase().replace(/\s+/g, '-');
    let slug = baseSlug;
    let counter = 1;

    // Check for existing slugs
    // while (await Subcategory.exists({ slug }).session(session)) {
    //   slug = `${baseSlug}-${counter}`;
    //   counter++;
    // }
    const subcategory = await Subcategory.create({
      name,
      description,
      image,
      category: category._id
    });

    // Add subcategory ref to category
    category.subcategories.push(subcategory._id);
    await category.save();

    res.status(201).json({
      success: true,
      data: subcategory
    });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
export const deleteCategory = asyncHandler(async (req, res, next) => {
  // Find the category
    const category = await Category.findById(req.params.id);
    if (!category) {
      return next(new ErrorResponse('Category not found', 404));
    }

    // Find and delete all subcategories for this category
    if (category.subcategories && category.subcategories.length > 0) {
      await Subcategory.deleteMany({ _id: { $in: category.subcategories } });
    }

    // Delete the category
    await Category.deleteOne({ _id: req.params.id });

    res.json({
      success: true,
      data: {}
    });
});

// @desc    Delete subcategory (removes Subcategory doc and ref from Category)
// @route   DELETE /api/categories/:categoryId/subcategories/:subcategoryId
export const deleteSubcategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.categoryId);
    if (!category) {
      return next(new ErrorResponse('Category not found', 404));
    }

    // Remove subcategory ref from category
    category.subcategories = category.subcategories.filter(
      subId => subId.toString() !== req.params.subcategoryId
    );
    await category.save();

    // Remove the subcategory document
    const subcategory = await Subcategory.findById(req.params.subcategoryId);
    if (!subcategory) {
      return next(new ErrorResponse('Subcategory not found', 404));
    }
    // Use findByIdAndDelete instead of remove()
    await Subcategory.findByIdAndDelete(req.params.subcategoryId);

    res.json({
      success: true,
      data: {}
    });
});

// @desc    Get all categories with subcategories (populated)
// @route   GET /api/categories
export const getCategories = asyncHandler(async (req, res, next) => {
  const categories = await Category.find({})
      .populate('subcategories')
      .select('-__v')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
});