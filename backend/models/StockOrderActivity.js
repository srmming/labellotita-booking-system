const mongoose = require('mongoose');

const stockOrderActivitySchema = new mongoose.Schema({
  stockOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StockOrder',
    required: true
  },
  type: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

stockOrderActivitySchema.index({ stockOrderId: 1, createdAt: -1 });

module.exports = mongoose.model('StockOrderActivity', stockOrderActivitySchema);
