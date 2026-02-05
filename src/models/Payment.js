import mongoose from "mongoose";
const { Schema } = mongoose;

const paymentSchema = new Schema({
    order: {
        type: Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: "BDT"
    },

    // Payment Gateway
    gateway: {
        type: String,
        enum: ["stripe", "bkash", "nagad", "cod"],
        required: true
    },

    // Payment Status
    status: {
        type: String,
        enum: ["pending", "processing", "completed", "failed", "refunded", "cancelled"],
        default: "pending"
    },

    // Gateway Transaction Details
    transactionId: String, // Gateway's transaction ID
    paymentIntentId: String, // For Stripe
    invoiceNumber: String, // For bKash
    paymentId: String, // Generic payment ID from gateway

    // Gateway Response
    gatewayResponse: Schema.Types.Mixed, // Store full gateway response

    // Error Details
    errorMessage: String,
    errorCode: String,

    // Payment Method Details (for card payments)
    paymentMethodDetails: {
        type: String, // e.g., "card", "mobile_wallet"
        brand: String, // e.g., "visa", "mastercard"
        last4: String, // Last 4 digits
        expiryMonth: Number,
        expiryYear: Number
    },

    // Refund Information
    refundAmount: Number,
    refundReason: String,
    refundedAt: Date,

    // Additional metadata
    metadata: Schema.Types.Mixed,

    // Webhook verification
    webhookReceived: {
        type: Boolean,
        default: false
    },
    webhookData: Schema.Types.Mixed,

    // Dates
    initiatedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: Date,
    failedAt: Date

}, { timestamps: true });

// Update completion/failure dates based on status
paymentSchema.pre("save", function (next) {
    if (this.isModified("status")) {
        if (this.status === "completed") {
            this.completedAt = new Date();
        } else if (this.status === "failed") {
            this.failedAt = new Date();
        }
    }
    next();
});

// Indexes
paymentSchema.index({ order: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ paymentIntentId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ gateway: 1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
