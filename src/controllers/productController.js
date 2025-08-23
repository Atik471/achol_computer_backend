import Product from '../models/Product.js';
import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = asyncHandler(async (req, res) => {
  const { search, category: catSlug, subcategory: subSlug, minPrice, maxPrice, page = 1, limit = 10, sort } = req.query;

  // --- Build base filters ---
  const filters = {};

  // Category slug → ObjectId
  if (catSlug) {
    const category = await Category.findOne({ slug: catSlug });
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });
    filters.category = category._id;
  }

  // Subcategory slug → ObjectId
  if (subSlug) {
    const subcategory = await Subcategory.findOne({ slug: subSlug });
    if (!subcategory) return res.status(404).json({ success: false, message: "Subcategory not found" });
    filters.subcategory = subcategory._id;
  }

  // Price range filter
  if (minPrice || maxPrice) {
    filters.discountPrice = {};
    if (minPrice !== undefined && !isNaN(minPrice)) filters.discountPrice.$gte = Number(minPrice);
    if (maxPrice !== undefined && !isNaN(maxPrice)) filters.discountPrice.$lte = Number(maxPrice);

    if (Object.keys(filters.discountPrice).length === 0) delete filters.discountPrice;
  }

  // --- Search ---
  let searchQuery = {};
  if (search) {
    const regex = new RegExp(search.trim(), "i");

    // Find matching category/subcategory IDs for search
    const matchingCategories = await Category.find({ name: regex });
    const matchingCategoryIds = matchingCategories.map(c => c._id);

    const matchingSubcategories = await Subcategory.find({ name: regex });
    const matchingSubcategoryIds = matchingSubcategories.map(s => s._id);

    searchQuery = {
      $or: [
        { name: regex },
        { description: regex },
        { category: { $in: matchingCategoryIds } },
        { subcategory: { $in: matchingSubcategoryIds } },
      ]
    };
  }

  // --- Combine filters and search ---
  const finalQuery = { ...filters, ...searchQuery };

  // --- Count total and compute min/max price ignoring pagination ---
  const statsPipeline = [
    { $match: finalQuery },
    {
      $group: {
        _id: null,
        minPrice: { $min: "$discountPrice" },
        maxPrice: { $max: "$discountPrice" },
        totalCount: { $sum: 1 }
      }
    }
  ];

  const stats = await Product.aggregate(statsPipeline);
  const { minPrice: aggMin = 0, maxPrice: aggMax = 0, totalCount = 0 } = stats[0] || {};

  // --- Base product query ---
  let productQuery = Product.find(finalQuery)
    .populate("category subcategory");

  // Sorting
  if (sort) {
    const sortBy = sort.split(",").join(" ");
    productQuery = productQuery.sort(sortBy);
  } else {
    productQuery = productQuery.sort("-createdAt");
  }

  // Pagination
  const skip = (Number(page) - 1) * Number(limit);
  productQuery = productQuery.skip(skip).limit(Number(limit));

  // Execute
  const products = await productQuery;

  res.json({
    success: true,
    count: products.length,   // paginated count
    totalCount,              // total under current filter
    minPrice: aggMin,
    maxPrice: aggMax,
    data: products
  });
});




// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProduct = asyncHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.id)
        .populate('category subcategory');

    if (!product) {
        return next(new ErrorResponse(`Product not found with id ${req.params.id}`, 404));
    }

    res.json({
        success: true,
        data: product
    });
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
export const getFeaturedProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({ featured: true })
        .limit(5)
        .populate('category subcategory');

    res.json({
        success: true,
        count: products.length,
        data: products
    });
});

// @desc    Get new arrivals
// @route   GET /api/products/new
// @access  Public
export const getNewArrivals = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 5;

    const products = await Product.find()
        .sort('-createdAt')
        .limit(limit)
        .populate('category subcategory');

    res.json({
        success: true,
        count: products.length,
        data: products
    });
});

// @desc    Get related products
// @route   GET /api/products/:id/related
// @access  Public
export const getRelatedProducts = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorResponse('Product not found', 404));
    }

    const related = await Product.find({
        $or: [
            { category: product.category },
            { subcategory: product.subcategory }
        ],
        _id: { $ne: product._id } // Exclude current product
    })
        .limit(5)
        .populate('category subcategory');

    res.json({
        success: true,
        count: related.length,
        data: related
    });
});

// @desc    Get products by category
// @route   GET /api/categories/:categoryId/products
// @access  Public
export const getProductsByCategory = asyncHandler(async (req, res) => {
    const products = await Product.find({ category: req.params.categoryId })
        .populate('category subcategory');

    res.json({
        success: true,
        count: products.length,
        data: products
    });
});

// @desc    Get products by subcategory
// @route   GET /api/subcategories/:subcategoryId/products
// @access  Public
export const getProductsBySubcategory = asyncHandler(async (req, res) => {
    const products = await Product.find({ subcategory: req.params.subcategoryId })
        .populate('category subcategory');

    res.json({
        success: true,
        count: products.length,
        data: products
    });
});