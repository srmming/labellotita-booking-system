import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Table,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Space,
  Progress
} from 'antd';
import { ArrowLeftOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import { orderAPI, shipmentAPI } from '../../services/api';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS
} from '../../utils/constants';

const OPERATOR_STORAGE_KEY = 'orderQuantityOperator';

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [shippedQty, setShippedQty] = useState({});
  const [activities, setActivities] = useState([]);
  const [shipmentModalVisible, setShipmentModalVisible] = useState(false);
  const [quantityModalVisible, setQuantityModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [shipmentForm] = Form.useForm();
  const [quantityForm] = Form.useForm();

  const getProductKey = (value) => {
    if (!value) return value;
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && typeof value.toString === 'function') {
      return value.toString();
    }
    return value;
  };

  const loadOrderDetail = useCallback(async () => {
    try {
      const response = await orderAPI.getById(id);
      const orderData = response.data.order;
      if (orderData && orderData.items) {
        orderData.items = Array.isArray(orderData.items) ? orderData.items : [];
      }
      setOrder(orderData);
      setShipments(Array.isArray(response.data.shipments) ? response.data.shipments : []);
      setShippedQty(response.data.shippedQty || {});
      setActivities(Array.isArray(response.data.activities) ? response.data.activities : []);
    } catch (error) {
      message.error('加载订单详情失败');
      setShipments([]);
      setActivities([]);
    }
  }, [id]);

  useEffect(() => {
    loadOrderDetail();
  }, [loadOrderDetail]);

  const handleCreateShipment = async (values) => {
    try {
      const items = values?.shippedItems || [];
      const uniq = new Set(items.map(item => getProductKey(item?.productId)));
      if (items.length !== uniq.size) {
        message.error('同一产品请勿重复添加');
        return;
      }
      await shipmentAPI.create({
        orderId: id,
        ...values
      });
      message.success('出货成功');
      setShipmentModalVisible(false);
      shipmentForm.resetFields();
      loadOrderDetail();
    } catch (error) {
      message.error(error.response?.data?.error || '出货失败');
    }
  };

  const handleOpenQuantityModal = (item) => {
    setEditingItem(item);
    setQuantityModalVisible(true);
    const storedOperator = typeof window !== 'undefined'
      ? window.localStorage.getItem(OPERATOR_STORAGE_KEY)
      : '';
    quantityForm.setFieldsValue({
      quantity: item.quantity,
      changedBy: storedOperator || '',
      note: ''
    });
  };

  const handleCloseQuantityModal = () => {
    setQuantityModalVisible(false);
    setEditingItem(null);
    quantityForm.resetFields();
  };

  const handleUpdateQuantity = async (values) => {
    if (!editingItem || !order) {
      return;
    }
    try {
      await orderAPI.updateItemQuantity(order._id, editingItem._id || editingItem.productId, values);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(OPERATOR_STORAGE_KEY, values.changedBy);
      }
      message.success('订单数量已更新');
      handleCloseQuantityModal();
      loadOrderDetail();
    } catch (error) {
      message.error(error.response?.data?.error || '更新订单数量失败');
    }
  };

  const orderItemColumns = [
    {
      title: '产品名称',
      dataIndex: 'productName',
      key: 'productName'
    },
    {
      title: '订单数量',
      dataIndex: 'quantity',
      key: 'quantity'
    },
    {
      title: '已出货',
      key: 'shipped',
      render: (_, record) => {
        const shipped = shippedQty[getProductKey(record.productId)] || 0;
        return shipped;
      }
    },
    {
      title: '待出货',
      key: 'remaining',
      render: (_, record) => {
        const shipped = shippedQty[getProductKey(record.productId)] || 0;
        return Math.max(record.quantity - shipped, 0);
      }
    },
    {
      title: '进度',
      key: 'progress',
      render: (_, record) => {
        const shipped = shippedQty[getProductKey(record.productId)] || 0;
        const base = record.quantity || 0;
        const percent = base > 0 ? Math.min(Math.round((shipped / base) * 100), 100) : 0;
        return <Progress percent={percent} />;
      }
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleOpenQuantityModal(record)}
          disabled={order?.status === 'cancelled'}
        >
          调整数量
        </Button>
      )
    }
  ];

  const shipmentColumns = [
    {
      title: '出货时间',
      dataIndex: 'shippedAt',
      key: 'shippedAt',
      render: (date) => new Date(date).toLocaleString('zh-CN')
    },
    {
      title: '出货产品',
      dataIndex: 'shippedItems',
      key: 'shippedItems',
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
      title: '备注',
      dataIndex: 'notes',
      key: 'notes'
    }
  ];

  const activityColumns = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value) => new Date(value).toLocaleString('zh-CN')
    },
    {
      title: '产品',
      dataIndex: 'productName',
      key: 'productName',
      render: (text) => text || '-'
    },
    {
      title: '调整前',
      dataIndex: 'previousQuantity',
      key: 'previousQuantity'
    },
    {
      title: '调整后',
      dataIndex: 'newQuantity',
      key: 'newQuantity'
    },
    {
      title: '变动',
      dataIndex: 'delta',
      key: 'delta',
      render: (value) => {
        if (typeof value !== 'number') {
          return '-';
        }
        const display = value > 0 ? `+${value}` : `${value}`;
        const color = value > 0 ? '#389e0d' : value < 0 ? '#cf1322' : 'inherit';
        return <span style={{ color }}>{display}</span>;
      }
    },
    {
      title: '操作人',
      dataIndex: 'changedBy',
      key: 'changedBy'
    },
    {
      title: '备注',
      dataIndex: 'note',
      key: 'note',
      render: (text) => text || '-'
    }
  ];

  const shippedForEditingItem = editingItem
    ? shippedQty[getProductKey(editingItem.productId)] || 0
    : 0;

  if (!order) return <div>加载中...</div>;

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/orders')}
        style={{ marginBottom: 16 }}
      >
        返回订单列表
      </Button>

      <Card title="订单信息" style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="订单号">{order.orderNumber}</Descriptions.Item>
          <Descriptions.Item label="客户">{order.customerName}</Descriptions.Item>
          <Descriptions.Item label="订单状态">
            <Tag color={ORDER_STATUS_COLORS[order.status]}>
              {ORDER_STATUS_LABELS[order.status]}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="付款状态">
            <Tag color={PAYMENT_STATUS_COLORS[order.paymentStatus]}>
              {PAYMENT_STATUS_LABELS[order.paymentStatus]}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="订单金额">
            ¥{order.totalAmount || 0}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(order.createdAt).toLocaleString('zh-CN')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

        <Card
          title="订单产品"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShipmentModalVisible(true)}
              disabled={order.status === 'completed' || order.status === 'cancelled'}
            >
              新增出货
            </Button>
          }
        style={{ marginBottom: 16 }}
      >
        <Table
          columns={orderItemColumns}
          dataSource={order.items}
          rowKey={(record) => record._id || getProductKey(record.productId)}
          pagination={false}
        />
      </Card>

      <Card title="出货记录">
        <Table
          columns={shipmentColumns}
          dataSource={shipments}
          rowKey="_id"
          pagination={false}
        />
      </Card>

      <Card title="操作日志" style={{ marginTop: 16 }}>
        <Table
          columns={activityColumns}
          dataSource={activities}
          rowKey="_id"
          pagination={false}
          locale={{ emptyText: '暂无操作记录' }}
        />
      </Card>

      <Modal
        title="新增出货"
        open={shipmentModalVisible}
        onOk={() => shipmentForm.submit()}
        onCancel={() => {
          setShipmentModalVisible(false);
          shipmentForm.resetFields();
        }}
      >
        <Form form={shipmentForm} layout="vertical" onFinish={handleCreateShipment}>
          <Form.List
            name="shippedItems"
            rules={[
              {
                validator: async (_, items) => {
                  if (!items || items.length < 1) {
                    return Promise.reject(new Error('至少选择一个产品'));
                  }
                }
              }
            ]}
          >
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => {
                  const listValues = shipmentForm.getFieldValue('shippedItems') || [];
                  const selectedIds = listValues
                    .filter((_, idx) => idx !== name)
                    .map(item => getProductKey(item?.productId))
                    .filter(Boolean);
                  const currentProductId = getProductKey(listValues[name]?.productId);
                  const orderItemForField = currentProductId
                    ? order.items.find(i => getProductKey(i.productId) === currentProductId)
                    : null;
                  const rawMaxQuantity = orderItemForField
                    ? orderItemForField.quantity - (shippedQty[getProductKey(orderItemForField.productId)] || 0)
                    : undefined;
                  const maxQuantity = rawMaxQuantity > 0 ? rawMaxQuantity : undefined;
                  return (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name, 'productId']}
                        rules={[{ required: true, message: '请选择产品' }]}
                      >
                        <Select placeholder="选择产品" style={{ width: 220 }}>
                          {order.items.map((item) => {
                            const productKey = getProductKey(item.productId);
                            const shipped = shippedQty[productKey] || 0;
                            const remaining = item.quantity - shipped;
                            if (remaining <= 0) {
                              return null;
                            }
                            const disabled = selectedIds.includes(productKey);
                            return (
                              <Select.Option key={productKey} value={productKey} disabled={disabled}>
                                {item.productName} (剩余: {remaining})
                              </Select.Option>
                            );
                          })}
                        </Select>
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'quantity']}
                        rules={[{ required: true, message: '请输入数量' }]}
                      >
                        <InputNumber
                          min={1}
                          max={maxQuantity}
                          placeholder="数量"
                          style={{ width: 160 }}
                        />
                      </Form.Item>
                      <Button onClick={() => remove(name)}>删除</Button>
                    </Space>
                  );
                })}
                <Button type="dashed" onClick={() => add()} block>
                  添加产品
                </Button>
              </>
            )}
          </Form.List>

          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingItem ? `调整数量 - ${editingItem.productName}` : '调整数量'}
        open={quantityModalVisible}
        onOk={() => quantityForm.submit()}
        onCancel={handleCloseQuantityModal}
        destroyOnClose
      >
        <Form form={quantityForm} layout="vertical" onFinish={handleUpdateQuantity}>
          <Form.Item
            name="quantity"
            label="新数量"
            rules={[{ required: true, message: '请输入新的订单数量' }]}
            extra={editingItem ? `已出货：${shippedForEditingItem}，当前数量：${editingItem.quantity}` : undefined}
          >
            <InputNumber
              min={Math.max(shippedForEditingItem || 0, 1)}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            name="changedBy"
            label="操作人"
            rules={[{ required: true, message: '请输入操作人' }]}
          >
            <Input placeholder="请输入操作人姓名" />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={3} placeholder="记录说明（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default OrderDetail;
