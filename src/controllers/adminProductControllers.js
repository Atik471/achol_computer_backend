import mongoose from 'mongoose';
import Product from '../models/Product.js';
import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from '../middlewares/asyncHandler.js';

/**
 * @desc    Create new product
 * @route   POST /api/admin/products
 * @access  Private/Admin
 */
export const getProducts = asyncHandler(async (req, res) => {
  const { search, category, subcategory, brand, inStock, featured, sort } = req.query;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build query
  const query = {};

  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }
  if (category) {
    query.category = category;
  }
  if (subcategory) {
    query.subcategory = subcategory;
  }
  if (brand) {
    query.brand = brand;
  }
  if (inStock) {
    query['stock.inStock'] = { $gt: 0 };
  }
  if (featured) {
    query.featured = featured === 'true';
  }

  const products = await Product.find(query)
    .populate('category', 'name')
    .populate('subcategory', 'name')
    .populate('brand', 'name')
    .sort(sort || '-createdAt')
    .skip(skip)
    .limit(limit);

  const totalProducts = await Product.countDocuments(query);
  const totalPages = Math.ceil(totalProducts / limit);

  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
    pagination: {
      total: totalProducts,
      totalPages,
      currentPage: page,
      limit,
    },
  });
});


/**
 * @desc    Create new product
 * @route   POST /api/admin/products
 * @access  Private/Admin
 */
export const createProduct = asyncHandler(async (req, res) => {
  console.log('Received product creation request with body:');
  console.log(JSON.stringify(req.body, null, 2));

  const {
    name,
    description,
    detailedDescription,
    price,
    discountPrice,
    buyingPrice,
    category,
    subcategory,
    brand,
    stock,
    specifications,
    keyFeatures,
    colors,
    featured,
    isActive,
  } = req.body;

  // Validate category and subcategory relationship
  const subcat = await mongoose.model("Subcategory").findById(subcategory);
  if (!subcat || subcat.category.toString() !== category) {
    throw new ErrorResponse("Subcategory does not belong to this category", 400);
  }

  // Handle empty strings from form data and convert to numbers or undefined
  const priceValue = price === 'TBA' ? 'TBA' : (price ? Number(price) : undefined);
  const discountPriceValue = discountPrice ? Number(discountPrice) : undefined;
  const buyingPriceValue = buyingPrice ? Number(buyingPrice) : undefined;

  const product = await Product.create({
    name,
    description,
    detailedDescription: detailedDescription || "",
    price: priceValue,
    discountPrice: discountPriceValue,
    buyingPrice: buyingPriceValue,
    category,
    subcategory,
    brand: brand || null,
    specifications: specifications || [],
    keyFeatures: keyFeatures || [],
    colors: colors || [],
    stock: {
      available: stock?.available || 0,
      defective: stock?.defective || 0,
      servicing: stock?.servicing || 0,
      sold: stock?.sold || 0,
      incoming: stock?.incoming || 0,
    },
    images: req.body.images || req.files?.map(file => file.path) || [],
    featured: featured || false,
    isActive: isActive === undefined ? true : isActive,
  });

  res.status(201).json({
    success: true,
    data: product,
  });
});

/**
 * @desc    Update product
 * @route   PUT /api/admin/products/:id
 * @access  Private/Admin
 */
export const updateProduct = asyncHandler(async (req, res) => {
  console.log(`Received product update request for ID: ${req.params.id} with body:`);
  console.log(JSON.stringify(req.body, null, 2));

  const { id } = req.params;

  let product = await Product.findById(id);

  if (!product) {
    throw new ErrorResponse('Product not found', 404);
  }

  // Manually update the fields from the request body
  // This allows Mongoose `save` hooks and validators to run correctly
  Object.assign(product, req.body);

  // Handle potential empty strings for prices from the form
  if (req.body.price === '' || req.body.price === null) {
    product.price = undefined; // Let required validator catch it
  }
  if (req.body.discountPrice === '' || req.body.discountPrice === null) {
    product.discountPrice = undefined; // Allow it to be unset
  }

  // Save the updated document. This will trigger the schema validators correctly.
  const updatedProduct = await product.save();

  res.json({
    success: true,
    data: updatedProduct
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