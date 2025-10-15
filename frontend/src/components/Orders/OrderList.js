import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Select, message, Modal, Form, InputNumber, Popconfirm } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
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
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [editForm] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, [filters]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getAll(filters);
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      message.error('加载订单列表失败');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (order) => {
    setEditingOrder(order);
    editForm.setFieldsValue({
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalAmount: typeof order.totalAmount === 'number' ? order.totalAmount : undefined
    });
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setEditingOrder(null);
    editForm.resetFields();
  };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      const payload = { ...values };
      if (payload.totalAmount === null || payload.totalAmount === '') {
        delete payload.totalAmount;
      }
      if (!editingOrder?._id) {
        return;
      }
      setEditSubmitting(true);
      await orderAPI.update(editingOrder._id, payload);
      message.success('订单更新成功');
      closeEditModal();
      loadOrders();
    } catch (error) {
      if (!error?.errorFields) {
        message.error(error.response?.data?.error || '更新订单失败');
      }
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (orderId) => {
    try {
      setDeleteLoadingId(orderId);
      await orderAPI.delete(orderId);
      message.success('订单已删除');
      loadOrders();
    } catch (error) {
      message.error(error.response?.data?.error || '删除订单失败');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      ellipsis: true,
      width: 160
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
      ellipsis: true,
      width: 180
    },
    {
      title: '产品',
      dataIndex: 'items',
      key: 'items',
      width: 240,
      render: (items) => (
        <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
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
      width: 120,
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
      width: 140,
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
      width: 200,
      render: (date) => new Date(date).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_, record) => (
        <Space wrap size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/orders/${record._id}`)}
          >
            查看详情
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除该订单？"
            description="删除后将无法恢复，请谨慎操作。"
            okText="删除"
            cancelText="取消"
            onConfirm={() => handleDelete(record._id)}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              loading={deleteLoadingId === record._id}
            >
              删除
            </Button>
          </Popconfirm>
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

      <Space style={{ marginBottom: 16 }} wrap>
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
        tableLayout="fixed"
        scroll={{ x: 1000 }}
      />

      <Modal
        title="编辑订单"
        open={editModalVisible}
        onCancel={closeEditModal}
        onOk={handleEditSubmit}
        confirmLoading={editSubmitting}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="status"
            label="订单状态"
            rules={[{ required: true, message: '请选择订单状态' }]}
          >
            <Select placeholder="选择订单状态">
              {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                <Select.Option key={value} value={value}>
                  {label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="paymentStatus"
            label="付款状态"
            rules={[{ required: true, message: '请选择付款状态' }]}
          >
            <Select placeholder="选择付款状态">
              {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                <Select.Option key={value} value={value}>
                  {label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="totalAmount"
            label="订单金额"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default OrderList;
