const mongoose = require('mongoose');

const orderActivitySchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  orderNumber: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['ITEM_QUANTITY_UPDATED'],
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  productName: String,
  previousQuantity: Number,
  newQuantity: Number,
  delta: Number,
  changedBy: {
    type: String,
    required: true,
    trim: true
  },
  note: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

orderActivitySchema.index({ orderId: 1, createdAt: -1 });

module.exports = mongoose.model('OrderActivity', orderActivitySchema);
