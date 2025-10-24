const express = require('express');
const router = express.Router();
const StockOrder = require('../models/StockOrder');
const StockShipment = require('../models/StockShipment');
const StockOrderActivity = require('../models/StockOrderActivity');
const { calculateShippedQuantities, updateStockOrderStatus } = require('../utils/stockOrderStatus');

router.post('/', async (req, res, next) => {
  try {
    const { stockOrderId, shippedItems, notes } = req.body;

    if (!stockOrderId) {
      return res.status(400).json({ error: '缺少订单ID' });
    }

    if (!Array.isArray(shippedItems) || shippedItems.length === 0) {
      return res.status(400).json({ error: '至少需要选择一个出货产品' });
    }

    const order = await StockOrder.findById(stockOrderId);
    if (!order) {
      return res.status(404).json({ error: 'Stock order not found' });
    }

    const currentShipped = await calculateShippedQuantities(order._id);
    const normalizedItems = [];

    for (let item of shippedItems) {
      const { itemId, quantity } = item || {};
      if (!itemId || !quantity || quantity <= 0) {
        return res.status(400).json({ error: '无效的出货项：缺少产品或数量' });
      }

      const orderItem = order.items.id(itemId);
      if (!orderItem) {
        return res.status(400).json({ error: '订单中不存在所选产品' });
      }

      const alreadyShipped = currentShipped[itemId.toString()] || 0;
      if (alreadyShipped + Number(quantity) > orderItem.quantity) {
        return res.status(400).json({
          error: `出货数量超出订单数量：${orderItem.productName} 申请出货 ${quantity}，订单数量 ${orderItem.quantity}，已出货 ${alreadyShipped}`
        });
      }

      const existingIndex = normalizedItems.findIndex(i => i.itemId.toString() === itemId.toString());
      if (existingIndex >= 0) {
        normalizedItems[existingIndex].quantity += Number(quantity);
      } else {
        normalizedItems.push({
          itemId,
          productName: orderItem.productName,
          quantity: Number(quantity)
        });
      }
    }

    const shipment = new StockShipment({
      stockOrderId: order._id,
      orderNumber: order.orderNumber,
      shippedItems: normalizedItems,
      notes
    });
    await shipment.save();

    await updateStockOrderStatus(order);
    await StockOrderActivity.create({
      stockOrderId: order._id,
      type: 'shipment',
      description: `出货：${normalizedItems.map(i => `${i.productName} x ${i.quantity}`).join('，')}`
    });

    res.status(201).json(shipment);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { stockOrderId } = req.query;
    const filter = stockOrderId ? { stockOrderId } : {};
    const shipments = await StockShipment.find(filter).sort({ shippedAt: -1 });
    res.json(shipments);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const shipment = await StockShipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    res.json(shipment);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
