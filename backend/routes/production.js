const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const Shipment = require('../models/Shipment');

// Get production plan - aggregate base products needed
router.get('/plan', async (req, res, next) => {
  try {
    // Get all orders that need production (pending, producing)
    const orders = await Order.find({ 
      status: { $in: ['pending', 'producing'] } 
    });
    
    // Aggregate base product requirements
    const requirements = {};
    
    for (let order of orders) {
      // Get already shipped quantities for this order
      const shipments = await Shipment.find({ orderId: order._id });
      const shippedQty = {};
      
      shipments.forEach(shipment => {
        shipment.shippedItems.forEach(item => {
          const key = item.productId.toString();
          shippedQty[key] = (shippedQty[key] || 0) + item.quantity;
        });
      });
      
      // Calculate remaining quantities needed
      for (let item of order.items) {
        const shipped = shippedQty[item.productId.toString()] || 0;
        const remaining = item.quantity - shipped;
        
        if (remaining > 0) {
          if (item.productType === 'combo') {
            // Expand combo product
            item.components.forEach(comp => {
              const baseProductId = comp.productId.toString();
              const qty = comp.quantity * remaining;
              
              if (!requirements[baseProductId]) {
                requirements[baseProductId] = {
                  productId: baseProductId,
                  productName: comp.productName,
                  required: 0
                };
              }
              requirements[baseProductId].required += qty;
            });
          } else {
            // Base product
            const baseProductId = item.productId.toString();
            
            if (!requirements[baseProductId]) {
              requirements[baseProductId] = {
                productId: baseProductId,
                productName: item.productName,
                required: 0
              };
            }
            requirements[baseProductId].required += remaining;
          }
        }
      }
    }
    
    // Get current inventory for each required product
    const planItems = await Promise.all(
      Object.values(requirements).map(async (req) => {
        const product = await Product.findById(req.productId);
        const current = product?.inventory?.current || 0;
        const shortage = Math.max(0, req.required - current);
        
        return {
          productId: req.productId,
          productName: req.productName,
          required: req.required,
          current,
          shortage
        };
      })
    );
    
    // Sort by shortage (highest first)
    planItems.sort((a, b) => b.shortage - a.shortage);
    
    res.json(planItems);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

