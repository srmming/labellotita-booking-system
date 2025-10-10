import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Select, message } from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '../../services/api';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS
} from '../../utils/constants';

function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, [filters]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getAll(filters);
      setOrders(response.data);
    } catch (error) {
      message.error('加载订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      fixed: 'left'
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
            <div key={idx}>
              {item.productName} x {item.quantity}
            </div>
          ))}
        </div>
      )
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={ORDER_STATUS_COLORS[status]}>
          {ORDER_STATUS_LABELS[status]}
        </Tag>
      )
    },
    {
      title: '付款状态',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status) => (
        <Tag color={PAYMENT_STATUS_COLORS[status]}>
          {PAYMENT_STATUS_LABELS[status]}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/orders/${record._id}`)}
          >
            查看详情
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h1>订单管理</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/orders/new')}
        >
          新建订单
        </Button>
      </div>

      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="筛选订单状态"
          allowClear
          style={{ width: 150 }}
          onChange={(value) => setFilters({ ...filters, status: value })}
        >
          <Select.Option value="pending">待处理</Select.Option>
          <Select.Option value="producing">生产中</Select.Option>
          <Select.Option value="shipping">出货中</Select.Option>
          <Select.Option value="completed">已完成</Select.Option>
        </Select>

        <Select
          placeholder="筛选付款状态"
          allowClear
          style={{ width: 150 }}
          onChange={(value) => setFilters({ ...filters, paymentStatus: value })}
        >
          <Select.Option value="unpaid">未付款</Select.Option>
          <Select.Option value="partial">部分付款</Select.Option>
          <Select.Option value="paid">已付款</Select.Option>
        </Select>
      </Space>

      <Table
        columns={columns}
        dataSource={orders}
        rowKey="_id"
        loading={loading}
        scroll={{ x: 1000 }}
      />
    </div>
  );
}

export default OrderList;

