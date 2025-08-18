import mongoose from 'mongoose';
import Product from '../models/Product.js';
import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from '../middlewares/asyncHandler.js';

/**
 * @desc    Create new product
 * @route   POST /api/admin/products
 * @access  Private/Admin
 */
export const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
    category,
    subcategory,
    stock,
    specifications,
    discountPrice
  } = req.body;

  // Validate category and subcategory relationship
  const subcat = await mongoose.model('Subcategory').findById(subcategory);
  if (!subcat || subcat.category.toString() !== category) {
    throw new ErrorResponse('Subcategory does not belong to this category', 400);
  }

  const product = await Product.create({
    name,
    description,
    price,
    category,
    subcategory,
    stock: stock || 0,
    specifications: specifications || {},
    discountPrice,
    images: req.files?.map(file => file.path) || []
  });

  res.status(201).json({
    success: true,
    data: product
  });
});

/**
 * @desc    Update product
 * @route   PUT /api/admin/products/:id
 * @access  Private/Admin
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Prevent changing category/subcategory relationship
  if (req.body.subcategory && req.body.category) {
    const subcat = await mongoose.model('Subcategory').findById(req.body.subcategory);
    if (!subcat || subcat.category.toString() !== req.body.category) {
      throw new ErrorResponse('Subcategory does not belong to this category', 400);
    }
  }

  const product = await Product.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true
  });

  if (!product) {
    throw new ErrorResponse('Product not found', 404);
  }

  res.json({
    success: true,
    data: product
  });
});

/**
 * @desc    Delete product
 * @route   DELETE /api/admin/products/:id
 * @access  Private/Admin
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new ErrorResponse('Product not found', 404);
  }

  // TODO: Add logic to delete associated images from storage

  await product.remove();

  res.json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Update product stock
 * @route   PATCH /api/admin/products/:id/stock
 * @access  Private/Admin
 */
export const updateProductStock = asyncHandler(async (req, res) => {
  const { stock } = req.body;

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { stock },
    { new: true, runValidators: true }
  );

  if (!product) {
    throw new ErrorResponse('Product not found', 404);
  }

  res.json({
    success: true,
    data: product
  });
});

/**
 * @desc    Upload product images
 * @route   POST /api/admin/products/:id/images
 * @access  Private/Admin
 */
export const uploadProductImages = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new ErrorResponse('Product not found', 404);
  }

  if (!req.files || req.files.length === 0) {
    throw new ErrorResponse('Please upload at least one image', 400);
  }

  const images = req.files.map(file => file.path);
  product.images = [...product.images, ...images];
  await product.save();

  res.json({
    success: true,
    data: product.images
  });
});

/**
 * @desc    Delete product image
 * @route   DELETE /api/admin/products/:id/images/:imageId
 * @access  Private/Admin
 */
export const deleteProductImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new ErrorResponse('Product not found', 404);
  }

  // Find image index
  const imageIndex = product.images.findIndex(
    img => img === req.params.imageId
  );

  if (imageIndex === -1) {
    throw new ErrorResponse('Image not found', 404);
  }

  // Remove image from array
  product.images.splice(imageIndex, 1);
  await product.save();

  // TODO: Add logic to delete image from storage

  res.json({
    success: true,
    data: product.images
  });
});

/**
 * @desc    Toggle product status
 * @route   PATCH /api/admin/products/:id/status
 * @access  Private/Admin
 */
export const toggleProductStatus = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new ErrorResponse('Product not found', 404);
  }

  product.isActive = !product.isActive;
  await product.save();

  res.json({
    success: true,
    data: product
  });
});

/**
 * @desc    Set featured product
 * @route   PATCH /api/admin/products/:id/featured
 * @access  Private/Admin
 */
export const setFeaturedProduct = asyncHandler(async (req, res) => {
  const { featured } = req.body;

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { featured },
    { new: true }
  );

  if (!product) {
    throw new ErrorResponse('Product not found', 404);
  }

  res.json({
    success: true,
    data: product
  });
});