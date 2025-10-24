import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag
} from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { stockOrderAPI } from '../../services/api';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS
} from '../../utils/constants';

function StockOrderList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [editingOrder, setEditingOrder] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  useEffect(() => {
    loadOrders();
  }, [filters]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await stockOrderAPI.getAll(filters);
      const data = Array.isArray(response.data) ? response.data : [];
      setOrders(data);
    } catch (error) {
      message.error('加载备货订单失败');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (order) => {
    setEditingOrder(order);
    setEditModalVisible(true);
    editForm.setFieldsValue({
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount,
      expectedShipDate: order.expectedShipDate ? dayjs(order.expectedShipDate) : null,
      remarks: order.remarks,
      customerName: order.customerName,
      contactPerson: order.contactPerson,
      contactPhone: order.contactPhone
    });
  };

  const closeEditModal = () => {
    setEditingOrder(null);
    setEditModalVisible(false);
    editForm.resetFields();
  };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      if (!editingOrder) return;
      setEditSubmitting(true);
      await stockOrderAPI.update(editingOrder._id, {
        ...values,
        expectedShipDate: values.expectedShipDate ? values.expectedShipDate.toISOString() : null
      });
      message.success('备货订单更新成功');
      closeEditModal();
      loadOrders();
    } catch (error) {
      if (error?.errorFields) {
        return;
      }
      message.error(error.response?.data?.error || '更新备货订单失败');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeleteLoadingId(id);
      await stockOrderAPI.delete(id);
      message.success('删除成功');
      loadOrders();
    } catch (error) {
      message.error(error.response?.data?.error || '删除备货订单失败');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleDateRangeChange = (values) => {
    if (!values || values.length !== 2) {
      setFilters(prev => {
        const { expectedShipDateFrom, expectedShipDateTo, ...rest } = prev;
        return rest;
      });
      return;
    }
    setFilters(prev => ({
      ...prev,
      expectedShipDateFrom: values[0]?.startOf('day').toISOString(),
      expectedShipDateTo: values[1]?.endOf('day').toISOString()
    }));
  };

  const columns = [
    {
      title: '备货单号',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 150
    },
    {
      title: '客户名称',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 160
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={ORDER_STATUS_COLORS[status] || 'default'}>
          {ORDER_STATUS_LABELS[status] || status}
        </Tag>
      )
    },
    {
      title: '付款状态',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 120,
      render: (status) => (
        <Tag color={PAYMENT_STATUS_COLORS[status] || 'default'}>
          {PAYMENT_STATUS_LABELS[status] || status}
        </Tag>
      )
    },
    {
      title: '订单金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      render: (amount) => (amount || amount === 0) ? amount.toFixed(2) : '-'
    },
    {
      title: '预计出货时间',
      dataIndex: 'expectedShipDate',
      key: 'expectedShipDate',
      width: 160,
      render: (date) => date ? new Date(date).toLocaleDateString('zh-CN') : '-'
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 200,
      render: (text) => (
        <div style={{ whiteSpace: 'normal', wordBreak: 'break-word', maxWidth: 200 }}>
          {text || '-'}
        </div>
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
            onClick={() => navigate(`/stock-orders/${record._id}`)}
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
            title="确认删除该备货订单？"
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
        <h1>备货订单</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/stock-orders/new')}
        >
          新建备货单
        </Button>
      </div>

      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="筛选订单状态"
          allowClear
          style={{ width: 150 }}
          onChange={(value) => setFilters(prev => {
            if (!value) {
              const { status, ...rest } = prev;
              return rest;
            }
            return { ...prev, status: value };
          })}
        >
          {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
            <Select.Option key={value} value={value}>
              {label}
            </Select.Option>
          ))}
        </Select>

        <Select
          placeholder="筛选付款状态"
          allowClear
          style={{ width: 150 }}
          onChange={(value) => setFilters(prev => {
            if (!value) {
              const { paymentStatus, ...rest } = prev;
              return rest;
            }
            return { ...prev, paymentStatus: value };
          })}
        >
          {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
            <Select.Option key={value} value={value}>
              {label}
            </Select.Option>
          ))}
        </Select>

        <DatePicker.RangePicker
          placeholder={['预计出货日期从', '预计出货日期到']}
          onChange={handleDateRangeChange}
        />
      </Space>

      <Table
        columns={columns}
        dataSource={orders}
        rowKey="_id"
        loading={loading}
        tableLayout="fixed"
        scroll={{ x: 1200 }}
      />

      <Modal
        title="编辑备货订单"
        open={editModalVisible}
        onCancel={closeEditModal}
        onOk={handleEditSubmit}
        confirmLoading={editSubmitting}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="customerName"
            label="客户名称"
            rules={[{ required: true, message: '请输入客户名称' }]}
          >
            <Input placeholder="输入客户名称" />
          </Form.Item>
          <Form.Item name="contactPerson" label="联系人">
            <Input placeholder="输入联系人" />
          </Form.Item>
          <Form.Item name="contactPhone" label="联系电话">
            <Input placeholder="输入联系电话" />
          </Form.Item>
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
          <Form.Item name="totalAmount" label="订单金额">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="expectedShipDate" label="预计出货时间">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remarks" label="备注">
            <Input.TextArea rows={3} placeholder="输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default StockOrderList;
