const StockShipment = require('../models/StockShipment');

async function calculateShippedQuantities(stockOrderId) {
  const shipments = await StockShipment.find({ stockOrderId });
  const shippedQty = {};

  shipments.forEach(shipment => {
    shipment.shippedItems.forEach(item => {
      const key = item.itemId.toString();
      shippedQty[key] = (shippedQty[key] || 0) + item.quantity;
    });
  });

  return shippedQty;
}

async function updateStockOrderStatus(order) {
  const shippedQty = await calculateShippedQuantities(order._id);

  let allShipped = true;
  let anyShipped = false;

  order.items.forEach(item => {
    const key = item._id.toString();
    const shipped = shippedQty[key] || 0;
    if (shipped < item.quantity) {
      allShipped = false;
    }
    if (shipped > 0) {
      anyShipped = true;
    }
  });

  if (order.status !== 'cancelled') {
    if (allShipped) {
      order.status = 'completed';
    } else if (anyShipped) {
      order.status = 'shipping';
    }
  }

  await order.save();
}

module.exports = {
  calculateShippedQuantities,
  updateStockOrderStatus
};
