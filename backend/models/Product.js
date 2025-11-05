const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['combo', 'base'],
    required: true
  },
  // Only for combo products
  components: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    productName: String,  // Denormalized for faster access
    quantity: {
      type: Number,
      min: 1
    }
  }],
  annualSalesTarget: {
    type: Number,
    default: 0,
    min: 0
  },
  // Only for base products
  inventory: {
    current: {
      type: Number,
      default: 0,
      min: 0
    }
  }
}, {
  timestamps: true
});

// Index for faster queries
productSchema.index({ type: 1 });

module.exports = mongoose.model('Product', productSchema);

