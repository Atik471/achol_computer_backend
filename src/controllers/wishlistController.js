import Wishlist from "../models/Wishlist.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import ErrorResponse from "../utils/errorResponse.js";

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
export const getWishlist = asyncHandler(async (req, res) => {
    let wishlist = await Wishlist.findOne({ user: req.user._id })
        .populate({
            path: "products",
            select: "name slug price discountPrice images brand ratings featured isActive"
        });

    if (!wishlist) {
        // Create empty wishlist if doesn't exist
        wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    // Filter out inactive products
    const activeProducts = wishlist.products.filter(product =>
        product && product.isActive
    );

    if (activeProducts.length !== wishlist.products.length) {
        wishlist.products = activeProducts.map(p => p._id);
        await wishlist.save();
        // Reload with populated data
        await wishlist.populate({
            path: "products",
            select: "name slug price discountPrice images brand ratings featured isActive"
        });
    }

    res.status(200).json({
        success: true,
        data: {
            wishlist,
            count: wishlist.products.length
        }
    });
});

// @desc    Add product to wishlist
// @route   POST /api/wishlist
// @access  Private
export const addToWishlist = asyncHandler(async (req, res) => {
    const { productId } = req.body;

    if (!productId) {
        throw new ErrorResponse("Product ID is required", 400);
    }

    // Validate product exists and is active
    const product = await Product.findById(productId);
    if (!product) {
        throw new ErrorResponse("Product not found", 404);
    }

    if (!product.isActive) {
        throw new ErrorResponse("Product is not available", 400);
    }

    // Find or create wishlist
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
        wishlist = new Wishlist({ user: req.user._id, products: [] });
    }

    try {
        const added = wishlist.addProduct(productId);

        if (!added) {
            return res.status(200).json({
                success: true,
                message: "Product already in wishlist",
                data: { wishlist }
            });
        }

        await wishlist.save();
        await wishlist.populate({
            path: "products",
            select: "name slug price discountPrice images brand ratings featured"
        });

        res.status(200).json({
            success: true,
            message: "Product added to wishlist",
            data: {
                wishlist,
                count: wishlist.products.length
            }
        });
    } catch (error) {
        throw new ErrorResponse(error.message, 400);
    }
});

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
export const removeFromWishlist = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
        throw new ErrorResponse("Wishlist not found", 404);
    }

    const removed = wishlist.removeProduct(productId);
    if (!removed) {
        throw new ErrorResponse("Product not found in wishlist", 404);
    }

    await wishlist.save();
    await wishlist.populate({
        path: "products",
        select: "name slug price discountPrice images brand ratings featured"
    });

    res.status(200).json({
        success: true,
        message: "Product removed from wishlist",
        data: {
            wishlist,
            count: wishlist.products.length
        }
    });
});

// @desc    Clear wishlist
// @route   DELETE /api/wishlist
// @access  Private
export const clearWishlist = asyncHandler(async (req, res) => {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
        throw new ErrorResponse("Wishlist not found", 404);
    }

    wishlist.clearWishlist();
    await wishlist.save();

    res.status(200).json({
        success: true,
        message: "Wishlist cleared",
        data: {
            wishlist,
            count: 0
        }
    });
});

// @desc    Move item from wishlist to cart
// @route   POST /api/wishlist/move-to-cart/:productId
// @access  Private
export const moveToCart = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { quantity = 1 } = req.body;

    // Get wishlist
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist || !wishlist.hasProduct(productId)) {
        throw new ErrorResponse("Product not found in wishlist", 404);
    }

    // Validate product
    const product = await Product.findById(productId);
    if (!product) {
        throw new ErrorResponse("Product not found", 404);
    }

    if (!product.isActive) {
        throw new ErrorResponse("Product is not available", 400);
    }

    // Check stock
    if (product.stock.available < quantity) {
        throw new ErrorResponse(
            `Only ${product.stock.available} units available in stock`,
            400
        );
    }

    // Get or create cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
        cart = new Cart({ user: req.user._id, items: [] });
    }

    // Add to cart
    const price = typeof product.price === "number" ? product.price : 0;
    const discountPrice = product.discountPrice || null;
    cart.addItem(productId, quantity, price, discountPrice);
    await cart.save();

    // Remove from wishlist
    wishlist.removeProduct(productId);
    await wishlist.save();

    res.status(200).json({
        success: true,
        message: "Product moved to cart",
        data: {
            wishlistCount: wishlist.products.length,
            cartCount: cart.itemCount
        }
    });
});
