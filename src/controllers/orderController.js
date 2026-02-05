import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import ErrorResponse from "../utils/errorResponse.js";

// @desc    Create order from cart
// @route   POST /api/orders
// @access  Private
export const createOrder = asyncHandler(async (req, res) => {
    const {
        shippingAddress,
        billingAddress,
        paymentMethod,
        customerNotes,
        shippingCost = 0,
        tax = 0
    } = req.body;

    // Validate shipping address
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone ||
        !shippingAddress.address || !shippingAddress.city) {
        throw new ErrorResponse("Complete shipping address is required", 400);
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id })
        .populate("items.product");

    if (!cart || cart.items.length === 0) {
        throw new ErrorResponse("Cart is empty", 400);
    }

    // Validate all products are available and in stock
    const orderItems = [];
    let subtotal = 0;

    for (const item of cart.items) {
        const product = item.product;

        if (!product) {
            throw new ErrorResponse("One or more products no longer exist", 400);
        }

        if (!product.isActive) {
            throw new ErrorResponse(
                `Product "${product.name}" is no longer available`,
                400
            );
        }

        if (product.stock.available < item.quantity) {
            throw new ErrorResponse(
                `Insufficient stock for "${product.name}". Only ${product.stock.available} available.`,
                400
            );
        }

        const itemPrice = item.discountPrice || item.price;
        const itemSubtotal = itemPrice * item.quantity;
        subtotal += itemSubtotal;

        orderItems.push({
            product: product._id,
            productSnapshot: {
                name: product.name,
                slug: product.slug,
                image: product.images && product.images[0] ? product.images[0] : null,
                price: item.price,
                discountPrice: item.discountPrice
            },
            quantity: item.quantity,
            price: itemPrice,
            subtotal: itemSubtotal
        });

        // Reduce stock
        product.stock.available -= item.quantity;
        product.stock.sold += item.quantity;
        await product.save();
    }

    const total = subtotal + shippingCost + tax;

    // Create order
    const order = await Order.create({
        user: req.user._id,
        items: orderItems,
        subtotal,
        shippingCost,
        tax,
        total,
        shippingAddress,
        billingAddress: billingAddress || shippingAddress,
        paymentMethod,
        customerNotes,
        timeline: [{
            status: "pending",
            message: "Order created",
            timestamp: new Date()
        }]
    });

    // Clear cart after successful order
    cart.clearCart();
    await cart.save();

    res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: { order }
    });
});

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
export const getOrders = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-timeline -adminNotes");

    const total = await Order.countDocuments({ user: req.user._id });

    res.status(200).json({
        success: true,
        data: {
            orders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    });
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate("items.product", "name slug images");

    if (!order) {
        throw new ErrorResponse("Order not found", 404);
    }

    // Ensure user owns the order (unless admin)
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        throw new ErrorResponse("Not authorized to access this order", 403);
    }

    res.status(200).json({
        success: true,
        data: { order }
    });
});

// @desc    Cancel order
// @route   PATCH /api/orders/:id/cancel
// @access  Private
export const cancelOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        throw new ErrorResponse("Order not found", 404);
    }

    // Ensure user owns the order
    if (order.user.toString() !== req.user._id.toString()) {
        throw new ErrorResponse("Not authorized to cancel this order", 403);
    }

    // Only allow cancellation for pending or processing orders
    if (!["pending", "processing", "confirmed"].includes(order.status)) {
        throw new ErrorResponse(
            `Cannot cancel order with status: ${order.status}`,
            400
        );
    }

    // Restore stock
    for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
            product.stock.available += item.quantity;
            product.stock.sold -= item.quantity;
            await product.save();
        }
    }

    order.status = "cancelled";
    order.paymentStatus = "refunded";
    await order.save();

    res.status(200).json({
        success: true,
        message: "Order cancelled successfully",
        data: { order }
    });
});

// @desc    Update order status (Admin only)
// @route   PATCH /api/admin/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = asyncHandler(async (req, res) => {
    const { status, trackingNumber, carrier, adminNotes } = req.body;

    if (!status) {
        throw new ErrorResponse("Status is required", 400);
    }

    const validStatuses = ["pending", "processing", "confirmed", "shipped", "delivered", "cancelled", "refunded"];
    if (!validStatuses.includes(status)) {
        throw new ErrorResponse("Invalid status", 400);
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
        throw new ErrorResponse("Order not found", 404);
    }

    order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (carrier) order.carrier = carrier;
    if (adminNotes) order.adminNotes = adminNotes;

    await order.save();

    res.status(200).json({
        success: true,
        message: "Order status updated",
        data: { order }
    });
});

// @desc    Get all orders (Admin only)
// @route   GET /api/admin/orders
// @access  Private/Admin
export const getAllOrders = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { status, paymentStatus } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const orders = await Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "name email phone");

    const total = await Order.countDocuments(filter);

    res.status(200).json({
        success: true,
        data: {
            orders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    });
});
