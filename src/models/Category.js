const mongoose = require('mongoose');
const { Schema } = mongoose;

const subcategorySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const categorySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    maxlength: 50
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: String,
  image: String,
  icon: String,
  subcategories: [subcategorySchema],
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  metaTitle: String,
  metaDescription: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-generate slugs before saving
categorySchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  }
  this.updatedAt = new Date();
  next();
});

// Auto-generate slugs for subcategories
subcategorySchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  }
  next();
});

// Prevent category deletion if products exist
categorySchema.pre('remove', async function(next) {
  const Product = mongoose.model('Product');
  const productsExist = await Product.exists({ category: this._id });
  
  if (productsExist) {
    throw new Error('Cannot delete category with associated products');
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

// Indexes for better performance
categorySchema.index({ name: 1, slug: 1, isActive: 1 });
subcategorySchema.index({ name: 1, slug: 1 });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;