import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import ErrorResponse from "../utils/errorResponse.js";

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
export const getCart = asyncHandler(async (req, res) => {
    let cart = await Cart.findOne({ user: req.user._id })
        .populate({
            path: "items.product",
            select: "name slug price discountPrice images stock brand isActive"
        });

    if (!cart) {
        // Create empty cart if doesn't exist
        cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Filter out items with deleted or inactive products
    const validItems = cart.items.filter(item =>
        item.product && item.product.isActive
    );

    if (validItems.length !== cart.items.length) {
        cart.items = validItems;
        await cart.save();
    }

    res.status(200).json({
        success: true,
        data: {
            cart,
            itemCount: cart.itemCount,
            cartTotal: cart.cartTotal
        }
    });
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
export const addToCart = asyncHandler(async (req, res) => {
    const { productId, quantity = 1 } = req.body;

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

    // Check stock availability
    if (product.stock.available < quantity) {
        throw new ErrorResponse(
            `Only ${product.stock.available} units available in stock`,
            400
        );
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
        cart = new Cart({ user: req.user._id, items: [] });
    }

    // Get current price
    const price = typeof product.price === "number" ? product.price : 0;
    const discountPrice = product.discountPrice || null;

    // Add or update item
    cart.addItem(productId, quantity, price, discountPrice);
    await cart.save();

    // Populate and return updated cart
    await cart.populate({
        path: "items.product",
        select: "name slug price discountPrice images stock brand"
    });

    res.status(200).json({
        success: true,
        message: "Item added to cart",
        data: {
            cart,
            itemCount: cart.itemCount,
            cartTotal: cart.cartTotal
        }
    });
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/:itemId
// @access  Private
export const updateCartItem = asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
        throw new ErrorResponse("Quantity must be at least 1", 400);
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
        throw new ErrorResponse("Cart not found", 404);
    }

    const item = cart.items.id(itemId);
    if (!item) {
        throw new ErrorResponse("Item not found in cart", 404);
    }

    // Check stock for the product
    const product = await Product.findById(item.product);
    if (!product) {
        throw new ErrorResponse("Product not found", 404);
    }

    if (product.stock.available < quantity) {
        throw new ErrorResponse(
            `Only ${product.stock.available} units available in stock`,
            400
        );
    }

    // Update quantity
    const updated = cart.updateItemQuantity(itemId, quantity);
    if (!updated) {
        throw new ErrorResponse("Failed to update item", 400);
    }

    await cart.save();

    // Populate and return
    await cart.populate({
        path: "items.product",
        select: "name slug price discountPrice images stock brand"
    });

    res.status(200).json({
        success: true,
        message: "Cart updated",
        data: {
            cart,
            itemCount: cart.itemCount,
            cartTotal: cart.cartTotal
        }
    });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
export const removeFromCart = asyncHandler(async (req, res) => {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
        throw new ErrorResponse("Cart not found", 404);
    }

    cart.removeItem(itemId);
    await cart.save();

    await cart.populate({
        path: "items.product",
        select: "name slug price discountPrice images stock brand"
    });

    res.status(200).json({
        success: true,
        message: "Item removed from cart",
        data: {
            cart,
            itemCount: cart.itemCount,
            cartTotal: cart.cartTotal
        }
    });
});

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
export const clearCart = asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
        throw new ErrorResponse("Cart not found", 404);
    }

    cart.clearCart();
    await cart.save();

    res.status(200).json({
        success: true,
        message: "Cart cleared",
        data: {
            cart,
            itemCount: 0,
            cartTotal: 0
        }
    });
});
