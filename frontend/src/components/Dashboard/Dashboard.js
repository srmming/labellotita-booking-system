import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, message, Alert } from 'antd';
import {
  ShoppingOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  TruckOutlined
} from '@ant-design/icons';
import { orderAPI } from '../../services/api';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../utils/constants';

function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    shippingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    upcomingShipments: []
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [upcomingShipments, setUpcomingShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, ordersRes] = await Promise.all([
        orderAPI.getStats(),
        orderAPI.getAll()
      ]);
      
      setStats(statsRes.data || {
        totalOrders: 0,
        pendingOrders: 0,
        shippingOrders: 0,
        completedOrders: 0,
        totalRevenue: 0,
        upcomingShipments: []
      });
      setRecentOrders(Array.isArray(ordersRes.data) ? ordersRes.data.slice(0, 10) : []);
      setUpcomingShipments(statsRes.data?.upcomingShipments || []);
    } catch (error) {
      message.error('加载数据失败');
      setRecentOrders([]);
      setUpcomingShipments([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysUntilShip = (shipDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ship = new Date(shipDate);
    ship.setHours(0, 0, 0, 0);
    const diff = ship - today;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const recentColumns = [
    {
      title: '订单号',
      dataIndex: 'orderNumber',
      key: 'orderNumber'
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName'
    },
    {
      title: '产品数量',
      dataIndex: 'items',
      key: 'items',
      render: (items) => items.length
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={ORDER_STATUS_COLORS[status]}>
          {ORDER_STATUS_LABELS[status]}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString('zh-CN')
    }
  ];

  const upcomingColumns = [
    {
      title: '订单号',
      dataIndex: 'orderNumber',
      key: 'orderNumber'
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName'
    },
    {
      title: '产品',
      dataIndex: 'items',
      key: 'items',
      render: (items) => (
        <div>
          {items.map((item, idx) => (
            <div key={idx}>{item.productName} x {item.quantity}</div>
          ))}
        </div>
      )
    },
    {
      title: '预计出货时间',
      dataIndex: 'expectedShipDate',
      key: 'expectedShipDate',
      render: (date) => new Date(date).toLocaleDateString('zh-CN')
    },
    {
      title: '距离出货',
      dataIndex: 'expectedShipDate',
      key: 'daysUntil',
      render: (date) => {
        const days = calculateDaysUntilShip(date);
        const color = days <= 1 ? 'red' : days <= 3 ? 'orange' : 'blue';
        return <Tag color={color}>{days} 天</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={ORDER_STATUS_COLORS[status]}>
          {ORDER_STATUS_LABELS[status]}
        </Tag>
      )
    }
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>订单概览</h1>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总订单数"
              value={stats.totalOrders}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理"
              value={stats.pendingOrders}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="出货中"
              value={stats.shippingOrders}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={stats.completedOrders}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title={<><TruckOutlined /> 即将出货订单（7天内）</>} style={{ marginTop: 16, marginBottom: 24 }}>
        {upcomingShipments.length === 0 ? (
          <Alert
            message="暂无即将出货的订单"
            type="info"
            showIcon
          />
        ) : (
          <Table
            columns={upcomingColumns}
            dataSource={upcomingShipments}
            rowKey="_id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1000 }}
          />
        )}
      </Card>

      <Card title="最近订单" style={{ marginTop: 16 }}>
        <Table
          columns={recentColumns}
          dataSource={recentOrders}
          rowKey="_id"
          loading={loading}
          pagination={false}
        />
      </Card>
    </div>
  );
}

export default Dashboard;
