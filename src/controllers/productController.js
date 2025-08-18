import Product from '../models/Product.js';
import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from '../middlewares/asyncHandler.js';

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = asyncHandler(async (req, res) => {
    // 1. Filtering
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    // 2. Advanced filtering (gte, lte, etc)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    let query = Product.find(JSON.parse(queryStr)).populate('category subcategory');

    // 3. Search
    if (req.query.search) {
        query = query.find({
            $text: { $search: req.query.search }
        });
    }

    // 4. Sorting
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt');
    }

    // 5. Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    // Execute query
    const products = await query;

    res.json({
        success: true,
        count: products.length,
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