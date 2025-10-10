/**
 * 导出本地 MongoDB 数据到 JSON 文件
 * 使用方法: node scripts/export-data.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Shipment = require('../models/Shipment');
const InventoryAdjustment = require('../models/InventoryAdjustment');

async function exportData() {
  try {
    // 连接本地数据库
    const localUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/order-system';
    await mongoose.connect(localUri);
    console.log('✓ 已连接到本地 MongoDB:', localUri);

    // 导出数据
    const data = {
      customers: await Customer.find().lean(),
      products: await Product.find().lean(),
      orders: await Order.find().lean(),
      shipments: await Shipment.find().lean(),
      inventoryAdjustments: await InventoryAdjustment.find().lean(),
      exportDate: new Date().toISOString(),
      counts: {
        customers: await Customer.countDocuments(),
        products: await Product.countDocuments(),
        orders: await Order.countDocuments(),
        shipments: await Shipment.countDocuments(),
        inventoryAdjustments: await InventoryAdjustment.countDocuments()
      }
    };

    // 创建导出目录
    const exportDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // 写入文件
    const filename = `backup-${Date.now()}.json`;
    const filepath = path.join(exportDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

    console.log('\n========== 数据导出完成 ==========');
    console.log('文件路径:', filepath);
    console.log('导出统计:');
    console.log('  - 客户:', data.counts.customers);
    console.log('  - 产品:', data.counts.products);
    console.log('  - 订单:', data.counts.orders);
    console.log('  - 发货记录:', data.counts.shipments);
    console.log('  - 库存调整:', data.counts.inventoryAdjustments);
    console.log('=====================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('导出失败:', error);
    process.exit(1);
  }
}

exportData();

