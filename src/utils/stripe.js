import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2024-12-18.acacia"
});

/**
 * Create a payment intent for Stripe
 * @param {number} amount - Amount in cents (e.g., 1000 = $10.00 or 1000 BDT)
 * @param {string} currency - Currency code (default: 'bdt')
 * @param {object} metadata - Additional metadata for the payment
 * @returns {Promise<object>} Payment intent object
 */
export const createPaymentIntent = async (amount, currency = "bdt", metadata = {}) => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount), // Ensure integer
            currency: currency.toLowerCase(),
            automatic_payment_methods: {
                enabled: true,
            },
            metadata
        });

        return paymentIntent;
    } catch (error) {
        console.error("Stripe payment intent creation error:", error);
        throw new Error(`Failed to create payment intent: ${error.message}`);
    }
};

/**
 * Retrieve a payment intent
 * @param {string} paymentIntentId - Payment intent ID
 * @returns {Promise<object>} Payment intent object
 */
export const retrievePaymentIntent = async (paymentIntentId) => {
    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        return paymentIntent;
    } catch (error) {
        console.error("Stripe payment intent retrieval error:", error);
        throw new Error(`Failed to retrieve payment intent: ${error.message}`);
    }
};

/**
 * Confirm a payment intent
 * @param {string} paymentIntentId - Payment intent ID
 * @returns {Promise<object>} Confirmed payment intent
 */
export const confirmPaymentIntent = async (paymentIntentId) => {
    try {
        const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
        return paymentIntent;
    } catch (error) {
        console.error("Stripe payment confirmation error:", error);
        throw new Error(`Failed to confirm payment: ${error.message}`);
    }
};

/**
 * Cancel a payment intent
 * @param {string} paymentIntentId - Payment intent ID
 * @returns {Promise<object>} Cancelled payment intent
 */
export const cancelPaymentIntent = async (paymentIntentId) => {
    try {
        const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
        return paymentIntent;
    } catch (error) {
        console.error("Stripe payment cancellation error:", error);
        throw new Error(`Failed to cancel payment: ${error.message}`);
    }
};

/**
 * Create a refund
 * @param {string} paymentIntentId - Payment intent ID
 * @param {number} amount - Amount to refund (optional, defaults to full refund)
 * @returns {Promise<object>} Refund object
 */
export const createRefund = async (paymentIntentId, amount = null) => {
    try {
        const refundData = { payment_intent: paymentIntentId };
        if (amount) {
            refundData.amount = Math.round(amount);
        }

        const refund = await stripe.refunds.create(refundData);
        return refund;
    } catch (error) {
        console.error("Stripe refund creation error:", error);
        throw new Error(`Failed to create refund: ${error.message}`);
    }
};

/**
 * Verify webhook signature
 * @param {string} payload - Raw request body
 * @param {string} signature - Stripe signature header
 * @returns {object} Verified event object
 */
export const verifyWebhookSignature = (payload, signature) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        throw new Error("Stripe webhook secret not configured");
    }

    try {
        const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        return event;
    } catch (error) {
        console.error("Webhook signature verification failed:", error);
        throw new Error(`Webhook verification failed: ${error.message}`);
    }
};

export default stripe;
