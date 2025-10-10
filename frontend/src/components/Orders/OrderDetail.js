import React, { useState, useEffect } from 'react';
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
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import { orderAPI, shipmentAPI } from '../../services/api';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS
} from '../../utils/constants';

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [shippedQty, setShippedQty] = useState({});
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const getProductKey = (value) => {
    if (!value) return value;
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && typeof value.toString === 'function') {
      return value.toString();
    }
    return value;
  };

  useEffect(() => {
    loadOrderDetail();
  }, [id]);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getById(id);
      const orderData = response.data.order;
      if (orderData && orderData.items) {
        orderData.items = Array.isArray(orderData.items) ? orderData.items : [];
      }
      setOrder(orderData);
      setShipments(Array.isArray(response.data.shipments) ? response.data.shipments : []);
      setShippedQty(response.data.shippedQty || {});
    } catch (error) {
      message.error('加载订单详情失败');
      setShipments([]);
    } finally {
      setLoading(false);
    }
  };

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
      setModalVisible(false);
      form.resetFields();
      loadOrderDetail();
    } catch (error) {
      message.error(error.response?.data?.error || '出货失败');
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
        return record.quantity - shipped;
      }
    },
    {
      title: '进度',
      key: 'progress',
      render: (_, record) => {
        const shipped = shippedQty[getProductKey(record.productId)] || 0;
        const percent = Math.round((shipped / record.quantity) * 100);
        return <Progress percent={percent} />;
      }
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
            onClick={() => setModalVisible(true)}
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
          rowKey={(record) => getProductKey(record.productId)}
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

      <Modal
        title="新增出货"
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateShipment}>
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
                  const listValues = form.getFieldValue('shippedItems') || [];
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
    </div>
  );
}

export default OrderDetail;
