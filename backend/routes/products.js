const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const InventoryAdjustment = require('../models/InventoryAdjustment');
const mongoose = require('mongoose');

// Get all products
router.get('/', async (req, res, next) => {
  try {
    const { type } = req.query;
    const filter = type ? { type } : {};
    
    const products = await Product.find(filter)
      .populate('components.productId', 'name type')
      .sort({ createdAt: -1 });
    
    res.json(products);
  } catch (err) {
    next(err);
  }
});

// Get product by ID
router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('components.productId', 'name type inventory');
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (err) {
    next(err);
  }
});

// Create product
router.post('/', async (req, res, next) => {
  try {
    const { type, components } = req.body;
    
    // Validate: combo products must have components
    if (type === 'combo' && (!components || components.length === 0)) {
      return res.status(400).json({ error: 'Combo products must have components' });
    }
    
    // Validate: base products should not have components
    if (type === 'base' && components && components.length > 0) {
      return res.status(400).json({ error: 'Base products cannot have components' });
    }
    
    // For combo products, populate component names
    if (type === 'combo' && components) {
      for (let comp of components) {
        const baseProduct = await Product.findById(comp.productId);
        if (!baseProduct || baseProduct.type !== 'base') {
          return res.status(400).json({ 
            error: `Invalid component: ${comp.productId}. Only base products can be components.` 
          });
        }
        comp.productName = baseProduct.name;
      }
    }
    
    const product = new Product(req.body);
    await product.save();
    
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

// Update product
router.put('/:id', async (req, res, next) => {
  try {
    const { type, components } = req.body;
    
    // Same validations as create
    if (type === 'combo' && components) {
      for (let comp of components) {
        const baseProduct = await Product.findById(comp.productId);
        if (!baseProduct || baseProduct.type !== 'base') {
          return res.status(400).json({ 
            error: `Invalid component: ${comp.productId}` 
          });
        }
        comp.productName = baseProduct.name;
      }
    }
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (err) {
    next(err);
  }
});

// Update inventory (for base products only)
router.patch('/:id/inventory', async (req, res, next) => {
  try {
    const { current } = req.body;
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    if (product.type !== 'base') {
      return res.status(400).json({ error: 'Only base products have inventory' });
    }
    
    product.inventory.current = current;
    await product.save();
    
    res.json(product);
  } catch (err) {
    next(err);
  }
});

// Delete product
router.delete('/:id', async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// Adjust inventory (增加/减少库存)
router.post('/:id/adjust-inventory', async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { type, quantity, reason } = req.body;
    
    if (!type || !quantity || !reason) {
      return res.status(400).json({ error: '请提供调整类型、数量和原因' });
    }
    
    if (!['increase', 'decrease'].includes(type)) {
      return res.status(400).json({ error: '调整类型必须是 increase 或 decrease' });
    }
    
    const product = await Product.findById(req.params.id).session(session);
    if (!product) {
      throw new Error('Product not found');
    }
    
    if (product.type !== 'base') {
      throw new Error('只能调整基础产品的库存');
    }
    
    const beforeQuantity = product.inventory.current;
    const adjustAmount = type === 'increase' ? quantity : -quantity;
    const afterQuantity = beforeQuantity + adjustAmount;
    
    if (afterQuantity < 0) {
      throw new Error(`库存不足，无法减少 ${quantity}。当前库存: ${beforeQuantity}`);
    }
    
    // 更新库存
    product.inventory.current = afterQuantity;
    await product.save({ session });
    
    // 创建调整记录
    await InventoryAdjustment.create([{
      productId: product._id,
      productName: product.name,
      type,
      quantity,
      reason,
      beforeQuantity,
      afterQuantity
    }], { session });
    
    await session.commitTransaction();
    res.json({ 
      product, 
      adjustment: { type, quantity, reason, beforeQuantity, afterQuantity }
    });
    
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
});

// Get inventory adjustment history
router.get('/:id/adjustment-history', async (req, res, next) => {
  try {
    const history = await InventoryAdjustment.find({ productId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(history);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

