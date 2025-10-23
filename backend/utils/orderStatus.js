const Shipment = require('../models/Shipment');

async function calculateShippedQuantities(orderId, session) {
  const query = Shipment.find({ orderId });
  if (session) {
    query.session(session);
  }
  const shipments = await query;
  const shippedQty = {};

  shipments.forEach(shipment => {
    shipment.shippedItems.forEach(item => {
      const key = item.productId.toString();
      shippedQty[key] = (shippedQty[key] || 0) + item.quantity;
    });
  });

  return shippedQty;
}

async function updateOrderStatus(order, session) {
  const shippedQty = await calculateShippedQuantities(order._id, session);

  let allShipped = true;
  let anyShipped = false;

  order.items.forEach(item => {
    const shipped = shippedQty[item.productId.toString()] || 0;
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

  if (session) {
    await order.save({ session });
  } else {
    await order.save();
  }
}

module.exports = {
  calculateShippedQuantities,
  updateOrderStatus
};
