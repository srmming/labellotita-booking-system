/**
 * 测试数据填充脚本
 * 使用方法: node scripts/seed.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Order = require('../models/Order');

async function seed() {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/order-system');
    console.log('MongoDB connected');

    // 清空现有数据（可选，谨慎使用）
    // await Customer.deleteMany({});
    // await Product.deleteMany({});
    // await Order.deleteMany({});

    // 1. 创建客户
    const customers = await Customer.create([
      { name: '张三', phone: '13800138000', email: 'zhangsan@example.com' },
      { name: '李四', phone: '13800138001', email: 'lisi@example.com' },
      { name: '王五', phone: '13800138002', email: 'wangwu@example.com' }
    ]);
    console.log('✓ 创建了', customers.length, '个客户');

    // 2. 创建基础产品
    const baseProducts = await Product.create([
      { name: '香薰蜡烛', type: 'base', inventory: { current: 100 } },
      { name: '精油', type: 'base', inventory: { current: 80 } },
      { name: '礼品盒', type: 'base', inventory: { current: 120 } },
      { name: '装饰丝带', type: 'base', inventory: { current: 150 } },
      { name: '贺卡', type: 'base', inventory: { current: 200 } }
    ]);
    console.log('✓ 创建了', baseProducts.length, '个基础产品');

    // 3. 创建组合产品
    const comboProducts = await Product.create([
      {
        name: '节日礼品套装',
        type: 'combo',
        components: [
          { productId: baseProducts[0]._id, productName: baseProducts[0].name, quantity: 2 },
          { productId: baseProducts[1]._id, productName: baseProducts[1].name, quantity: 1 },
          { productId: baseProducts[2]._id, productName: baseProducts[2].name, quantity: 1 }
        ]
      },
      {
        name: '豪华礼品套装',
        type: 'combo',
        components: [
          { productId: baseProducts[0]._id, productName: baseProducts[0].name, quantity: 3 },
          { productId: baseProducts[1]._id, productName: baseProducts[1].name, quantity: 2 },
          { productId: baseProducts[2]._id, productName: baseProducts[2].name, quantity: 1 },
          { productId: baseProducts[3]._id, productName: baseProducts[3].name, quantity: 1 },
          { productId: baseProducts[4]._id, productName: baseProducts[4].name, quantity: 1 }
        ]
      },
      {
        name: '迷你礼品套装',
        type: 'combo',
        components: [
          { productId: baseProducts[0]._id, productName: baseProducts[0].name, quantity: 1 },
          { productId: baseProducts[2]._id, productName: baseProducts[2].name, quantity: 1 }
        ]
      }
    ]);
    console.log('✓ 创建了', comboProducts.length, '个组合产品');

    // 4. 创建示例订单
    const orders = [];
    
    // 订单 1: 张三 - 节日礼品套装
    const order1 = new Order({
      customerId: customers[0]._id,
      customerName: customers[0].name,
      items: [{
        productId: comboProducts[0]._id,
        productName: comboProducts[0].name,
        productType: 'combo',
        quantity: 5,
        components: comboProducts[0].components
      }],
      paymentStatus: 'paid',
      totalAmount: 1500,
      status: 'pending'
    });
    await order1.save();
    orders.push(order1);

    // 订单 2: 李四 - 豪华礼品套装
    const order2 = new Order({
      customerId: customers[1]._id,
      customerName: customers[1].name,
      items: [{
        productId: comboProducts[1]._id,
        productName: comboProducts[1].name,
        productType: 'combo',
        quantity: 3,
        components: comboProducts[1].components
      }],
      paymentStatus: 'partial',
      totalAmount: 2400,
      status: 'pending'
    });
    await order2.save();
    orders.push(order2);

    // 订单 3: 王五 - 多个产品
    const order3 = new Order({
      customerId: customers[2]._id,
      customerName: customers[2].name,
      items: [
        {
          productId: comboProducts[2]._id,
          productName: comboProducts[2].name,
          productType: 'combo',
          quantity: 10,
          components: comboProducts[2].components
        },
        {
          productId: baseProducts[0]._id,
          productName: baseProducts[0].name,
          productType: 'base',
          quantity: 5,
          components: []
        }
      ],
      paymentStatus: 'unpaid',
      totalAmount: 1800,
      status: 'pending'
    });
    await order3.save();
    orders.push(order3);

    console.log('✓ 创建了', orders.length, '个订单');

    console.log('\n========== 测试数据填充完成 ==========');
    console.log('客户数:', customers.length);
    console.log('基础产品数:', baseProducts.length);
    console.log('组合产品数:', comboProducts.length);
    console.log('订单数:', orders.length);
    console.log('=====================================\n');

    process.exit(0);
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
}

seed();

