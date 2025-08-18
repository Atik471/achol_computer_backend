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
    price: {
        type: Number,
        required: [true, "Product price is required"],
        min: [0, "Price must be at least 0"]
    },
    discountPrice: {
        type: Number,
        validate: {
            validator: function (value) {
                return value < this.price;
            },
            message: "Discount price must be less than regular price"
        }
    },
    images: [{
        type: String,
        required: [true, "At least one image is required"]
    }],
    stock: {
        type: Number,
        required: true,
        min: [0, "Stock cannot be negative"],
        default: 0
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
    specifications: {
        type: Map,
        of: String
    },
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
productSchema.index({ name: "text", description: "text" });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ price: 1 });
productSchema.index({ ratings: -1 });

const Product = mongoose.model("Product", productSchema);

export default Product;