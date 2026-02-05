import Payment from "../models/Payment.js";
import Order from "../models/Order.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import ErrorResponse from "../utils/errorResponse.js";
import { createPaymentIntent, retrievePaymentIntent, verifyWebhookSignature } from "../utils/stripe.js";
import { createBkashPayment, executeBkashPayment, queryBkashPayment } from "../utils/bkash.js";
import { createNagadPayment, verifyNagadPayment } from "../utils/nagad.js";

// ====================
// STRIPE PAYMENTS
// ====================

// @desc    Create Stripe payment intent
// @route   POST /api/payments/stripe/create-intent
// @access  Private
export const createStripePaymentIntent = asyncHandler(async (req, res) => {
    const { orderId } = req.body;

    if (!orderId) {
        throw new ErrorResponse("Order ID is required", 400);
    }

    const order = await Order.findById(orderId);
    if (!order) {
        throw new ErrorResponse("Order not found", 404);
    }

    if (order.user.toString() !== req.user._id.toString()) {
        throw new ErrorResponse("Not authorized to process this order", 403);
    }

    if (order.paymentStatus === "paid") {
        throw new ErrorResponse("Order is already paid", 400);
    }

    try {
        // Amount should be in smallest currency unit (paisa for BDT)
        const amount = Math.round(order.total * 100);

        const paymentIntent = await createPaymentIntent(amount, "bdt", {
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            userId: req.user._id.toString()
        });

        // Create payment record
        const payment = await Payment.create({
            order: order._id,
            user: req.user._id,
            amount: order.total,
            currency: "BDT",
            gateway: "stripe",
            paymentIntentId: paymentIntent.id,
            status: "pending"
        });

        order.paymentId = payment._id;
        await order.save();

        res.status(200).json({
            success: true,
            data: {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
                paymentId: payment._id
            }
        });
    } catch (error) {
        throw new ErrorResponse(error.message, 500);
    }
});

// @desc    Handle Stripe webhook
// @route   POST /api/payments/stripe/webhook
// @access  Public (Stripe webhook)
export const stripeWebhook = asyncHandler(async (req, res) => {
    const signature = req.headers["stripe-signature"];

    try {
        const event = verifyWebhookSignature(req.body, signature);

        // Handle different event types
        switch (event.type) {
            case "payment_intent.succeeded":
                await handleStripePaymentSuccess(event.data.object);
                break;

            case "payment_intent.payment_failed":
                await handleStripePaymentFailure(event.data.object);
                break;

            default:
                console.log(`Unhandled Stripe event type: ${event.type}`);
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error("Stripe webhook error:", error);
        throw new ErrorResponse("Webhook signature verification failed", 400);
    }
});

// Helper: Handle successful Stripe payment
const handleStripePaymentSuccess = async (paymentIntent) => {
    const payment = await Payment.findOne({ paymentIntentId: paymentIntent.id });

    if (payment) {
        payment.status = "completed";
        payment.transactionId = paymentIntent.id;
        payment.webhookReceived = true;
        payment.webhookData = paymentIntent;
        await payment.save();

        const order = await Order.findById(payment.order);
        if (order) {
            order.paymentStatus = "paid";
            order.transactionId = paymentIntent.id;
            order.status = "confirmed";
            await order.save();
        }
    }
};

// Helper: Handle failed Stripe payment
const handleStripePaymentFailure = async (paymentIntent) => {
    const payment = await Payment.findOne({ paymentIntentId: paymentIntent.id });

    if (payment) {
        payment.status = "failed";
        payment.errorMessage = paymentIntent.last_payment_error?.message || "Payment failed";
        payment.webhookReceived = true;
        payment.webhookData = paymentIntent;
        await payment.save();

        const order = await Order.findById(payment.order);
        if (order) {
            order.paymentStatus = "failed";
            await order.save();
        }
    }
};

// ====================
// BKASH PAYMENTS
// ====================

// @desc    Create bKash payment
// @route   POST /api/payments/bkash/create
// @access  Private
export const createBkash = asyncHandler(async (req, res) => {
    const { orderId } = req.body;

    if (!orderId) {
        throw new ErrorResponse("Order ID is required", 400);
    }

    const order = await Order.findById(orderId);
    if (!order) {
        throw new ErrorResponse("Order not found", 404);
    }

    if (order.user.toString() !== req.user._id.toString()) {
        throw new ErrorResponse("Not authorized to process this order", 403);
    }

    if (order.paymentStatus === "paid") {
        throw new ErrorResponse("Order is already paid", 400);
    }

    try {
        const callbackURL = `${process.env.FRONTEND_URL}/payment/bkash/callback`;
        const bkashResponse = await createBkashPayment(order.total, order._id.toString(), callbackURL);

        if (!bkashResponse || bkashResponse.statusCode !== "0000") {
            throw new ErrorResponse("Failed to create bKash payment", 500);
        }

        // Create payment record
        const payment = await Payment.create({
            order: order._id,
            user: req.user._id,
            amount: order.total,
            currency: "BDT",
            gateway: "bkash",
            paymentId: bkashResponse.paymentID,
            status: "pending",
            gatewayResponse: bkashResponse
        });

        order.paymentId = payment._id;
        await order.save();

        res.status(200).json({
            success: true,
            data: {
                paymentId: payment._id,
                bkashURL: bkashResponse.bkashURL,
                paymentID: bkashResponse.paymentID
            }
        });
    } catch (error) {
        throw new ErrorResponse(error.message, 500);
    }
});

// @desc    Execute bKash payment
// @route   POST /api/payments/bkash/execute
// @access  Private
export const executeBkash = asyncHandler(async (req, res) => {
    const { paymentID } = req.body;

    if (!paymentID) {
        throw new ErrorResponse("Payment ID is required", 400);
    }

    try {
        const executeResponse = await executeBkashPayment(paymentID);

        if (!executeResponse || executeResponse.statusCode !== "0000") {
            throw new ErrorResponse("bKash payment execution failed", 400);
        }

        // Update payment record
        const payment = await Payment.findOne({ paymentId: paymentID });
        if (payment) {
            payment.status = "completed";
            payment.transactionId = executeResponse.trxID;
            payment.gatewayResponse = executeResponse;
            await payment.save();

            const order = await Order.findById(payment.order);
            if (order) {
                order.paymentStatus = "paid";
                order.transactionId = executeResponse.trxID;
                order.status = "confirmed";
                await order.save();
            }
        }

        res.status(200).json({
            success: true,
            message: "Payment executed successfully",
            data: executeResponse
        });
    } catch (error) {
        throw new ErrorResponse(error.message, 500);
    }
});

// @desc    bKash callback handler
// @route   GET /api/payments/bkash/callback
// @access  Public
export const bkashCallback = asyncHandler(async (req, res) => {
    const { paymentID, status } = req.query;

    if (status === "success" && paymentID) {
        // Redirect to frontend success page
        res.redirect(`${process.env.FRONTEND_URL}/payment/success?paymentID=${paymentID}`);
    } else {
        // Redirect to frontend failure page
        res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
    }
});

// ====================
// NAGAD PAYMENTS
// ====================

// @desc    Create Nagad payment
// @route   POST /api/payments/nagad/create
// @access  Private
export const createNagad = asyncHandler(async (req, res) => {
    const { orderId } = req.body;

    if (!orderId) {
        throw new ErrorResponse("Order ID is required", 400);
    }

    const order = await Order.findById(orderId);
    if (!order) {
        throw new ErrorResponse("Order not found", 404);
    }

    if (order.user.toString() !== req.user._id.toString()) {
        throw new ErrorResponse("Not authorized to process this order", 403);
    }

    if (order.paymentStatus === "paid") {
        throw new ErrorResponse("Order is already paid", 400);
    }

    try {
        const callbackURL = `${process.env.FRONTEND_URL}/payment/nagad/callback`;
        const nagadResponse = await createNagadPayment(order.total, order._id.toString(), callbackURL);

        if (!nagadResponse || !nagadResponse.callBackUrl) {
            throw new ErrorResponse("Failed to create Nagad payment", 500);
        }

        // Create payment record
        const payment = await Payment.create({
            order: order._id,
            user: req.user._id,
            amount: order.total,
            currency: "BDT",
            gateway: "nagad",
            paymentId: nagadResponse.paymentReferenceId,
            status: "pending",
            gatewayResponse: nagadResponse
        });

        order.paymentId = payment._id;
        await order.save();

        res.status(200).json({
            success: true,
            data: {
                paymentId: payment._id,
                nagadURL: nagadResponse.callBackUrl
            }
        });
    } catch (error) {
        throw new ErrorResponse(error.message, 500);
    }
});

// @desc    Nagad callback handler
// @route   GET /api/payments/nagad/callback
// @access  Public
export const nagadCallback = asyncHandler(async (req, res) => {
    const { payment_ref_id, status } = req.query;

    if (status === "Success" && payment_ref_id) {
        try {
            const verifyResponse = await verifyNagadPayment(payment_ref_id);

            if (verifyResponse && verifyResponse.status === "Success") {
                // Update payment record
                const payment = await Payment.findOne({ paymentId: payment_ref_id });
                if (payment) {
                    payment.status = "completed";
                    payment.transactionId = verifyResponse.txnId;
                    payment.gatewayResponse = verifyResponse;
                    await payment.save();

                    const order = await Order.findById(payment.order);
                    if (order) {
                        order.paymentStatus = "paid";
                        order.transactionId = verifyResponse.txnId;
                        order.status = "confirmed";
                        await order.save();
                    }
                }

                res.redirect(`${process.env.FRONTEND_URL}/payment/success?ref=${payment_ref_id}`);
            } else {
                res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
            }
        } catch (error) {
            console.error("Nagad verification error:", error);
            res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
        }
    } else {
        res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
    }
});

// ====================
// COMMON
// ====================

// @desc    Verify payment status
// @route   GET /api/payments/:orderId/verify
// @access  Private
export const verifyPayment = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
        throw new ErrorResponse("Order not found", 404);
    }

    if (order.user.toString() !== req.user._id.toString()) {
        throw new ErrorResponse("Not authorized to access this order", 403);
    }

    const payment = await Payment.findOne({ order: order._id });

    res.status(200).json({
        success: true,
        data: {
            paymentStatus: order.paymentStatus,
            orderStatus: order.status,
            payment: payment || null
        }
    });
});
