const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
    // 不设置 required，因为会在 pre-save hook 中自动生成
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    productType: {
      type: String,
      enum: ['combo', 'base']
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    // Snapshot of combo components at order time
    components: [{
      productId: mongoose.Schema.Types.ObjectId,
      productName: String,
      quantity: Number
    }]
  }],
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
  }
}, {
  timestamps: true
});

// Generate order number: ORD-YYYYMMDD-XXXX
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.constructor.countDocuments({
      orderNumber: new RegExp(`^ORD-${dateStr}`)
    });
    this.orderNumber = `ORD-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// orderNumber 已通过 unique: true 自动创建索引，无需重复
orderSchema.index({ customerId: 1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);

