const express = require('express');
const router = express.Router();
const StockOrder = require('../models/StockOrder');
const StockShipment = require('../models/StockShipment');
const StockOrderActivity = require('../models/StockOrderActivity');
const { calculateShippedQuantities, updateStockOrderStatus } = require('../utils/stockOrderStatus');

function recordActivity(stockOrderId, type, description) {
  return StockOrderActivity.create({ stockOrderId, type, description }).catch(() => {});
}

router.get('/', async (req, res, next) => {
  try {
    const { status, paymentStatus, expectedShipDateFrom, expectedShipDateTo } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }
    if (expectedShipDateFrom || expectedShipDateTo) {
      filter.expectedShipDate = {};
      if (expectedShipDateFrom) {
        filter.expectedShipDate.$gte = new Date(expectedShipDateFrom);
      }
      if (expectedShipDateTo) {
        const toDate = new Date(expectedShipDateTo);
        toDate.setHours(23, 59, 59, 999);
        filter.expectedShipDate.$lte = toDate;
      }
    }

    const orders = await StockOrder.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const totalOrders = await StockOrder.countDocuments();
    const pendingOrders = await StockOrder.countDocuments({ status: { $in: ['pending', 'producing'] } });
    const shippingOrders = await StockOrder.countDocuments({ status: 'shipping' });
    const completedOrders = await StockOrder.countDocuments({ status: 'completed' });
    const orders = await StockOrder.find();
    const totalAmount = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    const today = new Date();
    const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingShipments = await StockOrder.find({
      expectedShipDate: {
        $gte: today,
        $lte: sevenDaysLater
      }
    }).sort({ expectedShipDate: 1 });

    res.json({
      totalOrders,
      pendingOrders,
      shippingOrders,
      completedOrders,
      totalAmount,
      upcomingShipments
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { customerName, contactPerson, contactPhone, items, paymentStatus, totalAmount, expectedShipDate, remarks } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: '至少添加一个产品' });
    }

    const normalizedItems = items.map(item => ({
      productName: item.productName,
      quantity: Number(item.quantity) || 0,
      unit: item.unit,
      notes: item.notes
    })).filter(item => item.productName && item.quantity > 0);

    if (normalizedItems.length === 0) {
      return res.status(400).json({ error: '至少添加一个有效的产品条目' });
    }

    const order = new StockOrder({
      customerName,
      contactPerson,
      contactPhone,
      items: normalizedItems,
      paymentStatus: paymentStatus || 'unpaid',
      totalAmount: totalAmount || 0,
      status: 'pending',
      expectedShipDate: expectedShipDate ? new Date(expectedShipDate) : undefined,
      remarks
    });

    await order.save();
    await recordActivity(order._id, 'create', '创建备货订单');

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const order = await StockOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Stock order not found' });
    }

    const shipments = await StockShipment.find({ stockOrderId: req.params.id }).sort({ shippedAt: -1 });
    const activities = await StockOrderActivity.find({ stockOrderId: req.params.id }).sort({ createdAt: -1 });
    const shippedQty = await calculateShippedQuantities(order._id);

    res.json({ order, shipments, activities, shippedQty });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { customerName, contactPerson, contactPhone, paymentStatus, status, totalAmount, expectedShipDate, remarks } = req.body;

    const order = await StockOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Stock order not found' });
    }

    order.customerName = customerName ?? order.customerName;
    order.contactPerson = contactPerson ?? order.contactPerson;
    order.contactPhone = contactPhone ?? order.contactPhone;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (status) order.status = status;
    if (typeof totalAmount === 'number') {
      order.totalAmount = totalAmount;
    }
    if (expectedShipDate === null) {
      order.expectedShipDate = undefined;
    } else if (expectedShipDate) {
      order.expectedShipDate = new Date(expectedShipDate);
    }
    order.remarks = remarks ?? order.remarks;

    await order.save();
    await recordActivity(order._id, 'update', '更新备货订单信息');

    res.json(order);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/items/:itemId/quantity', async (req, res, next) => {
  try {
    const { quantity, changedBy, note } = req.body || {};
    const parsedQuantity = Number(quantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      return res.status(400).json({ error: '订单数量必须是大于 0 的整数' });
    }
    const operator = typeof changedBy === 'string' ? changedBy.trim() : '';
    if (!operator) {
      return res.status(400).json({ error: '请填写操作人' });
    }

    const order = await StockOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Stock order not found' });
    }

    const item = order.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: 'Order item not found' });
    }

    const shippedQty = await calculateShippedQuantities(order._id);
    const shippedForItem = shippedQty[item._id.toString()] || 0;
    if (parsedQuantity < shippedForItem) {
      return res.status(400).json({ error: `新数量不能小于已出货数量 ${shippedForItem}` });
    }

    if (item.quantity === parsedQuantity) {
      return res.status(400).json({ error: '新数量与当前数量相同，无需更新' });
    }

    const previousQuantity = item.quantity;
    item.quantity = parsedQuantity;

    await order.save();
    await updateStockOrderStatus(order);

    await recordActivity(order._id, 'quantity-update', `调整 ${item.productName} 数量 ${previousQuantity} → ${parsedQuantity}（操作人：${operator}${note ? `，备注：${note}` : ''}）`);

    const updatedOrder = await StockOrder.findById(order._id);
    const updatedShippedQty = await calculateShippedQuantities(order._id);

    res.json({
      order: updatedOrder,
      shippedQty: updatedShippedQty
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const order = await StockOrder.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Stock order not found' });
    }
    await StockShipment.deleteMany({ stockOrderId: req.params.id });
    await StockOrderActivity.deleteMany({ stockOrderId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
