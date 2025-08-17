import Category from '../models/Category';
import ErrorResponse from '../utils/errorResponse';

// @desc    Create new category
// @route   POST /api/categories
export const createCategory = async (req, res, next) => {
  try {
    const { name, description, image, icon, metaTitle, metaDescription } = req.body;
    
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
  } catch (err) {
    next(err);
  }
};

// @desc    Add subcategory to category
// @route   POST /api/categories/:categoryId/subcategories
export const addSubcategory = async (req, res, next) => {
  try {
    const { name, description, image } = req.body;
    const category = await Category.findById(req.params.categoryId);

    if (!category) {
      return next(new ErrorResponse('Category not found', 404));
    }

    category.subcategories.push({
      name,
      description,
      image
    });

    await category.save();

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return next(new ErrorResponse('Category not found', 404));
    }

    await category.remove();
    
    res.json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete subcategory
// @route   DELETE /api/categories/:categoryId/subcategories/:subcategoryId
export const deleteSubcategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.categoryId);

    if (!category) {
      return next(new ErrorResponse('Category not found', 404));
    }

    const subcategory = category.subcategories.id(req.params.subcategoryId);
    
    if (!subcategory) {
      return next(new ErrorResponse('Subcategory not found', 404));
    }

    await subcategory.remove();
    await category.save();

    res.json({
      success: true,
      data: category
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all categories with subcategories
// @route   GET /api/categories
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({})
      .select('-__v') // Exclude version key
      .sort({ name: 1 }); // Sort alphabetically by name

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (err) {
    next(err);
  }
};