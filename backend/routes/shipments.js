const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Shipment = require('../models/Shipment');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { calculateShippedQuantities, updateOrderStatus } = require('../utils/orderStatus');

function canUseTransactions() {
  try {
    const client = mongoose.connection.getClient();
    const topologyType = client?.topology?.description?.type;
    return topologyType && topologyType !== 'Single';
  } catch (err) {
    return false;
  }
}

// Core logic: Expand combo products to base products
function expandComboProducts(order, shippedItems) {
  const inventoryChanges = {};
  
  shippedItems.forEach(shippedItem => {
    // Find the corresponding order item
    const orderItem = order.items.find(
      item => item.productId.toString() === shippedItem.productId.toString()
    );
    
    if (!orderItem) {
      throw new Error(`Product ${shippedItem.productId} not found in order`);
    }
    
    if (orderItem.productType === 'combo') {
      // Expand combo product to base products
      orderItem.components.forEach(comp => {
        const baseProductId = comp.productId.toString();
        const qty = comp.quantity * shippedItem.quantity;
        inventoryChanges[baseProductId] = (inventoryChanges[baseProductId] || 0) + qty;
      });
    } else {
      // Base product - direct deduction
      const baseProductId = shippedItem.productId.toString();
      inventoryChanges[baseProductId] = (inventoryChanges[baseProductId] || 0) + shippedItem.quantity;
    }
  });
  
  return Object.entries(inventoryChanges).map(([productId, quantity]) => ({
    productId,
    quantity
  }));
}

// Create shipment - THE CORE LOGIC
router.post('/', async (req, res, next) => {
  const useTransaction = canUseTransactions();
  let session = null;
  if (useTransaction) {
    session = await mongoose.startSession();
    session.startTransaction();
  }
  
  try {
    const { orderId, shippedItems, notes } = req.body;
    
    // Basic validations
    if (!orderId) {
      throw new Error('缺少订单ID');
    }
    if (!Array.isArray(shippedItems) || shippedItems.length === 0) {
      throw new Error('至少需要选择一个出货产品');
    }
    
    // 1. Get order
    const orderQuery = Order.findById(orderId);
    if (session) {
      orderQuery.session(session);
    }
    const order = await orderQuery;
    if (!order) {
      throw new Error('Order not found');
    }
    
    // 2. Normalize and validate shipped quantities (aggregate duplicates within the same request)
    const requestedMap = {};
    for (let raw of shippedItems) {
      if (!raw?.productId || !raw?.quantity || raw.quantity <= 0) {
        throw new Error('无效的出货项：缺少产品或数量');
      }
      const key = raw.productId.toString();
      requestedMap[key] = (requestedMap[key] || 0) + Number(raw.quantity);
    }
    
    const currentShipped = await calculateShippedQuantities(orderId, session);
    for (let [productIdStr, reqQty] of Object.entries(requestedMap)) {
      const orderItem = order.items.find(oi => oi.productId.toString() === productIdStr);
      if (!orderItem) {
        throw new Error(`订单中不存在所选产品：${productIdStr}`);
      }
      const alreadyShipped = currentShipped[productIdStr] || 0;
      if (alreadyShipped + reqQty > orderItem.quantity) {
        throw new Error(
          `出货数量超出订单数量：${orderItem.productName} 申请出货 ${reqQty}，` +
          `订单数量 ${orderItem.quantity}，已出货 ${alreadyShipped}`
        );
      }
    }
    
    // 3. Build normalized shippedItems with productName (and deduplicated)
    const normalizedShippedItems = Object.entries(requestedMap).map(([productIdStr, quantity]) => {
      const orderItem = order.items.find(oi => oi.productId.toString() === productIdStr);
      return {
        productId: orderItem.productId,
        productName: orderItem.productName,
        quantity
      };
    });
    
    // 4. Expand combo products to base product inventory changes
    const inventoryChanges = expandComboProducts(order, normalizedShippedItems);
    
    // 5. Deduct inventory (atomic operation)
    for (let change of inventoryChanges) {
      const query = Product.updateOne(
        { 
          _id: change.productId,
          type: 'base',
          'inventory.current': { $gte: change.quantity }
        },
        { $inc: { 'inventory.current': -change.quantity } }
      );
      if (session) {
        query.session(session);
      }
      const result = await query;
      
      if (result.modifiedCount === 0) {
        const product = await Product.findById(change.productId);
        throw new Error(
          `Insufficient inventory for ${product?.name || change.productId}. ` +
          `Required: ${change.quantity}, Available: ${product?.inventory?.current || 0}`
        );
      }
    }
    
    // 6. Create shipment record
    const shipment = new Shipment({
      orderId,
      orderNumber: order.orderNumber,
      shippedItems: normalizedShippedItems,
      notes
    });
    if (session) {
      await shipment.save({ session });
    } else {
      await shipment.save();
    }
    
    // 7. Update order status
    await updateOrderStatus(order, session);
    
    if (session) {
      await session.commitTransaction();
    }
    res.status(201).json(shipment);
    
  } catch (err) {
    if (session) {
      await session.abortTransaction();
    }
    next(err);
  } finally {
    if (session) {
      session.endSession();
    }
  }
});

// Get all shipments
router.get('/', async (req, res, next) => {
  try {
    const { orderId } = req.query;
    const filter = orderId ? { orderId } : {};
    
    const shipments = await Shipment.find(filter).sort({ shippedAt: -1 });
    res.json(shipments);
  } catch (err) {
    next(err);
  }
});

// Get shipment by ID
router.get('/:id', async (req, res, next) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    res.json(shipment);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
