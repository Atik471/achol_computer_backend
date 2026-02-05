import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
    createStripePaymentIntent,
    stripeWebhook,
    createBkash,
    executeBkash,
    bkashCallback,
    createNagad,
    nagadCallback,
    verifyPayment
} from "../controllers/paymentController.js";

const router = express.Router();

// Stripe routes
router.post("/stripe/create-intent", protect, createStripePaymentIntent);

// Stripe webhook (must be before JSON parsing in app.js)
router.post("/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhook);

// bKash routes
router.post("/bkash/create", protect, createBkash);
router.post("/bkash/execute", protect, executeBkash);
router.get("/bkash/callback", bkashCallback); // Public callback from bKash

// Nagad routes
router.post("/nagad/create", protect, createNagad);
router.get("/nagad/callback", nagadCallback); // Public callback from Nagad

// Verify payment
router.get("/:orderId/verify", protect, verifyPayment);

export default router;
