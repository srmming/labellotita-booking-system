const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Shipment = require('../models/Shipment');
const OrderActivity = require('../models/OrderActivity');
const { calculateShippedQuantities, updateOrderStatus } = require('../utils/orderStatus');

// Get all orders with filters
router.get('/', async (req, res, next) => {
  try {
    const { status, paymentStatus, startDate, endDate, expectedShipDateFrom, expectedShipDateTo, productIds } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    // Filter by expected ship date range
    if (expectedShipDateFrom || expectedShipDateTo) {
      filter.expectedShipDate = {};
      if (expectedShipDateFrom) filter.expectedShipDate.$gte = new Date(expectedShipDateFrom);
      if (expectedShipDateTo) {
        const toDate = new Date(expectedShipDateTo);
        toDate.setHours(23, 59, 59, 999);
        filter.expectedShipDate.$lte = toDate;
      }
    }
    
    // Filter by product IDs (multi-select)
    if (productIds) {
      const ids = Array.isArray(productIds) ? productIds : [productIds];
      filter['items.productId'] = { $in: ids };
    }
    
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// Get dashboard stats
router.get('/stats', async (req, res, next) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: { $in: ['pending', 'producing'] } });
    const shippingOrders = await Order.countDocuments({ status: 'shipping' });
    const completedOrders = await Order.countDocuments({ status: 'completed' });
    
    const orders = await Order.find();
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    // Get orders that need to ship within 7 days
    const today = new Date();
    const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingShipments = await Order.find({
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
      totalRevenue,
      upcomingShipments
    });
  } catch (err) {
    next(err);
  }
});

// Get order by ID with shipments
router.get('/:id', async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const shipments = await Shipment.find({ orderId: req.params.id }).sort({ shippedAt: -1 });
    const activities = await OrderActivity.find({ orderId: req.params.id }).sort({ createdAt: -1 });
    
    // Calculate shipped quantities
    const shippedQty = {};
    shipments.forEach(shipment => {
      shipment.shippedItems.forEach(item => {
        const key = item.productId.toString();
        shippedQty[key] = (shippedQty[key] || 0) + item.quantity;
      });
    });
    
    res.json({ order, shipments, shippedQty, activities });
  } catch (err) {
    next(err);
  }
});

// Create order
router.post('/', async (req, res, next) => {
  try {
    const { customerId, items, paymentStatus, totalAmount, expectedShipDate, remarks } = req.body;
    
    // Get customer info
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Populate product info and snapshot components
    const orderItems = [];
    for (let item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ error: `Product not found: ${item.productId}` });
      }
      
      // 验证：订单中只能包含组合产品
      if (product.type !== 'combo') {
        return res.status(400).json({ 
          error: `订单只能销售组合产品。产品 "${product.name}" 是基础产品，不能直接销售。` 
        });
      }
      
      orderItems.push({
        productId: product._id,
        productName: product.name,
        productType: product.type,
        quantity: item.quantity,
        // Snapshot components for combo products
        components: product.components
      });
    }
    
    const order = new Order({
      customerId,
      customerName: customer.name,
      items: orderItems,
      paymentStatus: paymentStatus || 'unpaid',
      totalAmount: totalAmount || 0,
      status: 'pending',
      expectedShipDate: expectedShipDate ? new Date(expectedShipDate) : undefined,
      remarks: remarks
    });
    
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

// Update order item quantity
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

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const item = order.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: 'Order item not found' });
    }

    if (item.quantity === parsedQuantity) {
      return res.status(400).json({ error: '新数量与当前数量相同，无需更新' });
    }

    const shippedQty = await calculateShippedQuantities(order._id);
    const shippedForItem = shippedQty[item.productId.toString()] || 0;

    if (parsedQuantity < shippedForItem) {
      return res.status(400).json({
        error: `新数量不能小于已出货数量 ${shippedForItem}`
      });
    }

    const previousQuantity = item.quantity;
    item.quantity = parsedQuantity;

    await order.save();
    await updateOrderStatus(order);

    const activity = await OrderActivity.create({
      orderId: order._id,
      orderNumber: order.orderNumber,
      type: 'ITEM_QUANTITY_UPDATED',
      productId: item.productId,
      productName: item.productName,
      previousQuantity,
      newQuantity: parsedQuantity,
      delta: parsedQuantity - previousQuantity,
      changedBy: operator,
      note: typeof note === 'string' && note.trim() ? note.trim() : undefined
    });

    const updatedOrder = await Order.findById(order._id);
    const updatedShippedQty = await calculateShippedQuantities(order._id);

    res.json({
      order: updatedOrder,
      shippedQty: updatedShippedQty,
      activity
    });
  } catch (err) {
    next(err);
  }
});

// Update order
router.put('/:id', async (req, res, next) => {
  try {
    const { paymentStatus, status, totalAmount, expectedShipDate, remarks } = req.body;
    
    const updateData = {};
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (status) updateData.status = status;
    if (totalAmount !== undefined) updateData.totalAmount = totalAmount;
    if (expectedShipDate !== undefined) updateData.expectedShipDate = expectedShipDate ? new Date(expectedShipDate) : null;
    if (remarks !== undefined) updateData.remarks = remarks;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (err) {
    next(err);
  }
});

// Delete order
router.delete('/:id', async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

