const mongoose = require('mongoose');

const stockOrderItemSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: true });

const stockOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  contactPerson: {
    type: String,
    trim: true
  },
  contactPhone: {
    type: String,
    trim: true
  },
  items: {
    type: [stockOrderItemSchema],
    validate: [items => Array.isArray(items) && items.length > 0, '至少添加一个产品']
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid'
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'producing', 'shipping', 'completed', 'cancelled'],
    default: 'pending'
  },
  expectedShipDate: {
    type: Date
  },
  remarks: {
    type: String
  }
}, {
  timestamps: true
});

stockOrderSchema.pre('save', async function generateNumber(next) {
  if (!this.orderNumber) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.constructor.countDocuments({
      orderNumber: new RegExp(`^STK-${dateStr}`)
    });
    this.orderNumber = `STK-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

stockOrderSchema.index({ status: 1 });
stockOrderSchema.index({ paymentStatus: 1 });
stockOrderSchema.index({ expectedShipDate: 1 });

module.exports = mongoose.model('StockOrder', stockOrderSchema);
