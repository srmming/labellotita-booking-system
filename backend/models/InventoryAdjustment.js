const mongoose = require('mongoose');

const inventoryAdjustmentSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['increase', 'decrease'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  beforeQuantity: {
    type: Number,
    required: true
  },
  afterQuantity: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

inventoryAdjustmentSchema.index({ productId: 1 });
inventoryAdjustmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('InventoryAdjustment', inventoryAdjustmentSchema);

