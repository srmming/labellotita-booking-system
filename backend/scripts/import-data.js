/**
 * 导入数据到云端 MongoDB
 * 使用方法: MONGODB_URI=<云端连接字符串> node scripts/import-data.js <备份文件路径>
 * 示例: MONGODB_URI=mongodb+srv://... node scripts/import-data.js exports/backup-1234567890.json
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

async function importData() {
  try {
    // 检查参数
    const backupFile = process.argv[2];
    if (!backupFile) {
      console.error('错误: 请提供备份文件路径');
      console.log('用法: MONGODB_URI=<云端连接字符串> node scripts/import-data.js <备份文件路径>');
      process.exit(1);
    }

    // 读取备份文件
    const filepath = path.resolve(backupFile);
    if (!fs.existsSync(filepath)) {
      console.error('错误: 文件不存在:', filepath);
      process.exit(1);
    }

    console.log('✓ 读取备份文件:', filepath);
    const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));

    // 连接目标数据库 (云端)
    const targetUri = process.env.MONGODB_URI;
    if (!targetUri || targetUri.includes('localhost')) {
      console.error('错误: 请设置云端 MONGODB_URI 环境变量');
      console.log('用法: MONGODB_URI=mongodb+srv://... node scripts/import-data.js <备份文件路径>');
      process.exit(1);
    }

    await mongoose.connect(targetUri);
    console.log('✓ 已连接到目标数据库');

    // 确认导入
    console.log('\n即将导入以下数据:');
    console.log('  - 客户:', data.counts.customers);
    console.log('  - 产品:', data.counts.products);
    console.log('  - 订单:', data.counts.orders);
    console.log('  - 发货记录:', data.counts.shipments);
    console.log('  - 库存调整:', data.counts.inventoryAdjustments);
    console.log('  - 备份日期:', data.exportDate);

    // 检查目标数据库是否为空
    const existingCounts = {
      customers: await Customer.countDocuments(),
      products: await Product.countDocuments(),
      orders: await Order.countDocuments(),
      shipments: await Shipment.countDocuments(),
      inventoryAdjustments: await InventoryAdjustment.countDocuments()
    };

    const totalExisting = Object.values(existingCounts).reduce((a, b) => a + b, 0);
    if (totalExisting > 0) {
      console.log('\n⚠️  警告: 目标数据库不为空!');
      console.log('现有数据:');
      console.log('  - 客户:', existingCounts.customers);
      console.log('  - 产品:', existingCounts.products);
      console.log('  - 订单:', existingCounts.orders);
      console.log('  - 发货记录:', existingCounts.shipments);
      console.log('  - 库存调整:', existingCounts.inventoryAdjustments);
      console.log('\n如需清空数据，请先运行: node scripts/clear-database.js');
      console.log('或手动删除集合后重新运行此脚本\n');
      
      // 为安全起见，退出
      console.log('为避免数据冲突，导入已取消。');
      await mongoose.disconnect();
      process.exit(1);
    }

    // 导入数据
    console.log('\n开始导入数据...\n');

    if (data.customers && data.customers.length > 0) {
      await Customer.insertMany(data.customers);
      console.log('✓ 导入客户:', data.customers.length);
    }

    if (data.products && data.products.length > 0) {
      await Product.insertMany(data.products);
      console.log('✓ 导入产品:', data.products.length);
    }

    if (data.orders && data.orders.length > 0) {
      await Order.insertMany(data.orders);
      console.log('✓ 导入订单:', data.orders.length);
    }

    if (data.shipments && data.shipments.length > 0) {
      await Shipment.insertMany(data.shipments);
      console.log('✓ 导入发货记录:', data.shipments.length);
    }

    if (data.inventoryAdjustments && data.inventoryAdjustments.length > 0) {
      await InventoryAdjustment.insertMany(data.inventoryAdjustments);
      console.log('✓ 导入库存调整:', data.inventoryAdjustments.length);
    }

    console.log('\n========== 数据导入完成 ==========');
    console.log('所有数据已成功导入到云端数据库');
    console.log('=====================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('导入失败:', error);
    process.exit(1);
  }
}

importData();

