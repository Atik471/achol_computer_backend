import mongoose from "mongoose";
const { Schema } = mongoose;

const orderItemSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    // Store product snapshot in case product is deleted/modified later
    productSnapshot: {
        name: String,
        slug: String,
        image: String,
        price: Number,
        discountPrice: Number
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true
    },
    subtotal: {
        type: Number,
        required: true
    }
}, { _id: true });

const orderSchema = new Schema({
    orderNumber: {
        type: String,
        unique: true,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    items: [orderItemSchema],

    // Pricing
    subtotal: {
        type: Number,
        required: true
    },
    shippingCost: {
        type: Number,
        default: 0
    },
    tax: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        required: true
    },

    // Shipping Information
    shippingAddress: {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        email: String,
        address: { type: String, required: true },
        city: { type: String, required: true },
        postalCode: String,
        country: { type: String, default: "Bangladesh" },
        additionalInfo: String
    },

    // Billing Address (optional, defaults to shipping)
    billingAddress: {
        fullName: String,
        phone: String,
        email: String,
        address: String,
        city: String,
        postalCode: String,
        country: String
    },

    // Order Status
    status: {
        type: String,
        enum: ["pending", "processing", "confirmed", "shipped", "delivered", "cancelled", "refunded"],
        default: "pending"
    },

    // Payment Information
    paymentMethod: {
        type: String,
        enum: ["stripe", "bkash", "nagad", "cod"],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending"
    },
    paymentId: String, // Reference to Payment document
    transactionId: String,

    // Order Timeline
    timeline: [{
        status: String,
        message: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],

    // Dates
    paidAt: Date,
    confirmedAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,

    // Notes
    customerNotes: String,
    adminNotes: String,

    // Tracking
    trackingNumber: String,
    carrier: String

}, { timestamps: true });

// Generate unique order number before saving
orderSchema.pre("save", async function (next) {
    if (!this.orderNumber) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        // Find the count of orders today
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));

        const count = await mongoose.model("Order").countDocuments({
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        const sequence = String(count + 1).padStart(4, "0");
        this.orderNumber = `ORD${year}${month}${day}${sequence}`;
    }
    next();
});

// Add timeline entry when status changes
orderSchema.pre("save", function (next) {
    if (this.isModified("status")) {
        this.timeline.push({
            status: this.status,
            message: `Order ${this.status}`,
            timestamp: new Date()
        });

        // Update respective date fields
        switch (this.status) {
            case "confirmed":
                this.confirmedAt = new Date();
                break;
            case "shipped":
                this.shippedAt = new Date();
                break;
            case "delivered":
                this.deliveredAt = new Date();
                break;
            case "cancelled":
                this.cancelledAt = new Date();
                break;
        }
    }

    if (this.isModified("paymentStatus") && this.paymentStatus === "paid") {
        this.paidAt = new Date();
    }

    next();
});

// Indexes for better query performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;
