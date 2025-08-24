import mongoose from "mongoose";
const { Schema } = mongoose;

const productSchema = new Schema({
    name: {
        type: String,
        required: [true, "Product name is required"],
        trim: true,
        maxlength: [100, "Product name cannot exceed 100 characters"]
    },
    slug: {
        type: String,
        required: true,
        lowercase: true,
        unique: true
    },
    description: {
        type: String,
        required: [true, "Product description is required"]
    },
    detailedDescription: {
        type: String, // for broad, rich description
    },
    price: {
        type: Schema.Types.Mixed, // can be Number or String (e.g., "TBA")
        required: [true, "Product price is required"],
        validate: {
            validator: function (value) {
                return (
                    typeof value === "number" ||
                    (typeof value === "string" && value.toLowerCase() === "tba")
                );
            },
            message: "Price must be a number or 'TBA'"
        }
    },
    discountPrice: {
        type: Number,
        validate: {
            validator: function (value) {
                return typeof this.price === "number" && value < this.price;
            },
            message: "Discount price must be less than regular price"
        }
    },
    buyingPrice: {
        type: Number,
        required: [true, "Buying price is required"],
        min: [0, "Buying price cannot be negative"]
    },
    images: [String],
    colors: [{
        type: String // e.g., "Red", "Blue", "Black"
    }],
    stock: {
        available: { type: Number, default: 0, min: 0 },  // in stock
        defective: { type: Number, default: 0, min: 0 },  // faulty items
        servicing: { type: Number, default: 0, min: 0 },  // sent to servicing
        sold: { type: Number, default: 0, min: 0 },       // already sold
        incoming: { type: Number, default: 0, min: 0 }    // ordered, not yet received
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        required: [true, "Category is required"]
    },
    subcategory: {
        type: Schema.Types.ObjectId,
        ref: "Subcategory",
        required: [true, "Subcategory is required"],
        validate: {
            validator: async function (value) {
                const subcat = await mongoose.model("Subcategory").findById(value);
                return subcat && subcat.category.toString() === this.category.toString();
            },
            message: "Subcategory must belong to the selected category"
        }
    },
    brand: {
        type: String,
        required: true
    },
    specifications: [
        {
            key: { type: String, required: true },
            value: { type: mongoose.Schema.Types.Mixed, required: true }
        }
    ],
    keyFeatures: [{
        type: String // e.g., "Fast charging", "Waterproof", etc.
    }],
    ratings: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    featured: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Auto-generate slug before saving
productSchema.pre("validate", function (next) {
    if (!this.slug && this.name) {
        this.slug = this.name
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^\w\-]+/g, "")
            .replace(/\-\-+/g, "-")
            .replace(/^-+/, "")
            .replace(/-+$/, "");
    }
    next();
});

// Update timestamp before saving
productSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});

// Indexes for better performance
productSchema.index({ name: "text", description: "text", broadDescription: "text" });
productSchema.index({ category: 1, subcategory: 1 });


export default mongoose.model("Product", productSchema);