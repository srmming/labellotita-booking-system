const mongoose = require('mongoose');

const stockShipmentItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
}, { _id: false });

const stockShipmentSchema = new mongoose.Schema({
  stockOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StockOrder',
    required: true
  },
  orderNumber: {
    type: String,
    required: true
  },
  shippedItems: {
    type: [stockShipmentItemSchema],
    validate: [items => Array.isArray(items) && items.length > 0, '至少需要一个出货产品']
  },
  notes: {
    type: String
  },
  shippedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

stockShipmentSchema.index({ stockOrderId: 1, shippedAt: -1 });

module.exports = mongoose.model('StockShipment', stockShipmentSchema);
