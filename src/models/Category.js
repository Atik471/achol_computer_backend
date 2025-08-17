import mongoose from "mongoose"; 
const { Schema } = mongoose;



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
  subcategories: [{
    type: Schema.Types.ObjectId,
    ref: "Subcategory"
  }],
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

// validate slug for category
categorySchema.pre('validate', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }
  next();
});



// Improved slug generation middleware
categorySchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/\s+/g, '-')       // Replace spaces with -
      .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
      .replace(/\-\-+/g, '-')     // Replace multiple - with single -
      .replace(/^-+/, '')         // Trim - from start of text
      .replace(/-+$/, '');        // Trim - from end of text
  }
  this.updatedAt = new Date();
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



// Cascade delete subcategories when a category is deleted
categorySchema.pre('findOneAndDelete', async function(next) {
  const category = await this.model.findOne(this.getQuery());
  if (category && category.subcategories && category.subcategories.length > 0) {
    const Subcategory = mongoose.model('Subcategory');
    await Subcategory.deleteMany({ _id: { $in: category.subcategories } });
  }
  next();
});

// index definitions:
// categorySchema.index({ name: 1, slug: 1, isActive: 1 });

// Regular index for slug
// subcategorySchema.index({ name: 1 }, { unique: true, sparse: true });

const Category = mongoose.model('Category', categorySchema);

export default Category;