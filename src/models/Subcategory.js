import mongoose from "mongoose";
const { Schema } = mongoose;

const subcategorySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    // unique: true,
    minlength: 2,
    maxlength: 100
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: String,
  image: String,
  isActive: {
    type: Boolean,
    default: true
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: "Category",
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// validate slug for subcategory
subcategorySchema.pre('validate', function(next) {
  if (!this.slug && this.name && this.category) {
    // Include category reference in slug
    this.slug = `${this.name.toLowerCase().replace(/\s+/g, '-')}-${this.category.toString().slice(-4)}`
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }
  next();
});

// Slug generation for subcategories
subcategorySchema.pre('save', function(next) {
  if (!this.slug && this.name && this.category) {
    // Include category reference in slug
    this.slug = `${this.name.toLowerCase().replace(/\s+/g, '-')}-${this.category.toString().slice(-4)}`
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }
  next();
});

// Prevent subcategory deletion if products exist
subcategorySchema.pre('remove', async function(next) {
  const Product = mongoose.model('Product');
  const productsExist = await Product.exists({ subcategory: this._id });
  
  if (productsExist) {
    throw new Error('Cannot delete subcategory with associated products');
  }
  next();
});


const Subcategory = mongoose.model("Subcategory", subcategorySchema);

export default Subcategory;
