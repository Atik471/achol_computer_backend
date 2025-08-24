import Product from '../models/Product.js';
import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = asyncHandler(async (req, res) => {
  const { search, category: catSlug, subcategory: subSlug, minPrice, maxPrice, page = 1, limit = 12, sort } = req.query;

  // --- Build base filters ---
  const filters = {};

// Category slug → ObjectId
if (catSlug) {
  const category = await Category.findOne({ slug: catSlug });
  if (category) {
    filters.category = category._id;
  } else {
    // Category not found → return empty list
    return res.json({
      success: true,
      count: 0,
      totalCount: 0,
      minPrice: 0,
      maxPrice: 0,
      data: [],
    });
  }
}

// Subcategory slug → ObjectId
if (subSlug) {
  const subcategory = await Subcategory.findOne({ slug: subSlug });
  if (subcategory) {
    filters.subcategory = subcategory._id;
  } else {
    // Subcategory not found → return empty list
    return res.json({
      success: true,
      count: 0,
      totalCount: 0,
      minPrice: 0,
      maxPrice: 0,
      data: [],
    });
  }
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

// @desc    Get single product by slug
// @route   GET /api/products/slug/:slug
// @access  Public
export const getProductBySlug = asyncHandler(async (req, res, next) => {
  const product = await Product.findOne({ slug: req.params.slug })
    .populate('category subcategory');

  if (!product) {
    return next(new ErrorResponse(`Product not found with slug ${req.params.slug}`, 404));
  }

  res.json({
    success: true,
    data: product
  });
});






// const kebab = (s = "") =>
//   s.toString().trim().toLowerCase()
//     .replace(/\s+/g, "-")
//     .replace(/[^\w-]+/g, "")
//     .replace(/--+/g, "-");

// const escapeRx = (s = "") => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// // @desc    Get featured products
// // @route   GET /api/products/featured
// // @access  Public
// export const getFeaturedProducts = asyncHandler(async (req, res) => {
//   const { type, featured = "false", limit = 10 } = req.query;
//   const LIM = Math.max(1, parseInt(limit, 10) || 10);

//   // Base filters
//   const scopeFilter = { isActive: true };
//   let scopeLabel = null; // { kind: 'category'|'subcategory', _id }

//   // Resolve type → category/subcategory
//   if (type) {
//     const needle = kebab(type);

//     // 1) Try Category by slug or name
//     const cat =
//       await Category.findOne({
//         $or: [
//           { slug: needle },
//           { name: new RegExp(`^${escapeRx(type)}$`, "i") },
//         ],
//       }).select("_id name slug");

//     if (cat) {
//       scopeFilter.category = cat._id;
//       scopeLabel = { kind: "category", _id: cat._id };
//     } else {
//       // 2) Try Subcategory by exact slug, slug that starts with needle-, or name
//       const sub =
//         await Subcategory.findOne({
//           $or: [
//             { slug: needle },
//             { slug: new RegExp(`^${escapeRx(needle)}(?:-|$)`, "i") }, // matches "headphones-xxxx"
//             { name: new RegExp(`^${escapeRx(type)}$`, "i") },
//           ],
//         }).select("_id name slug category");

//       if (sub) {
//         scopeFilter.subcategory = sub._id;
//         scopeLabel = { kind: "subcategory", _id: sub._id };
//       } else {
//         // Nothing matched -> empty result so you know the type is invalid
//         return res.json({
//           success: true,
//           count: 0,
//           totalCount: 0,
//           minPrice: null,
//           maxPrice: null,
//           data: [],
//           message: `No category or subcategory found for "${type}"`,
//         });
//       }
//     }
//   }

//   // Build list filter (add featured if requested)
//   const listFilter = { ...scopeFilter };
//   const wantFeatured = String(featured).toLowerCase() === "true";
//   if (wantFeatured) listFilter.featured = true;

//   // Main query
//   const baseQuery = Product.find(listFilter)
//     .populate("category", "name slug")
//     .populate("subcategory", "name slug")
//     .sort({ createdAt: -1 })
//     .limit(LIM);

//   const [items, totalCount] = await Promise.all([
//     baseQuery,
//     Product.countDocuments(listFilter),
//   ]);

//   let products = [...items];

//   // If featured=true but we got fewer than limit, top-up with newest from the same scope (without featured flag)
//   if (wantFeatured && products.length < LIM) {
//     const topUpFilter = { ...scopeFilter, _id: { $nin: products.map(p => p._id) } };
//     const more = await Product.find(topUpFilter)
//       .populate("category", "name slug")
//       .populate("subcategory", "name slug")
//       .sort({ createdAt: -1 })
//       .limit(LIM - products.length);
//     products = products.concat(more);
//   }

//   // Price range for the scope (ignore featured so the slider makes sense)
//   let minPrice = null, maxPrice = null;
//   if (scopeLabel) {
//     const priceAgg = await Product.aggregate([
//       { $match: scopeFilter },
//       { $group: { _id: null, min: { $min: "$price" }, max: { $max: "$price" } } },
//     ]);
//     if (priceAgg[0]) {
//       minPrice = priceAgg[0].min;
//       maxPrice = priceAgg[0].max;
//     }
//   } else {
//     // No type: global active scope
//     const priceAgg = await Product.aggregate([
//       { $match: { isActive: true } },
//       { $group: { _id: null, min: { $min: "$price" }, max: { $max: "$price" } } },
//     ]);
//     if (priceAgg[0]) {
//       minPrice = priceAgg[0].min;
//       maxPrice = priceAgg[0].max;
//     }
//   }

//   return res.json({
//     success: true,
//     count: products.length,
//     totalCount,
//     minPrice,
//     maxPrice,
//     data: products,
//   });
// });


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


