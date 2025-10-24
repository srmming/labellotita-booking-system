import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Progress,
  Select,
  Space,
  Table,
  Tag
} from 'antd';
import { ArrowLeftOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { stockOrderAPI, stockShipmentAPI } from '../../services/api';
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS
} from '../../utils/constants';

const OPERATOR_STORAGE_KEY = 'stockOrderQuantityOperator';

function StockOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [shippedQty, setShippedQty] = useState({});
  const [shipmentModalVisible, setShipmentModalVisible] = useState(false);
  const [quantityModalVisible, setQuantityModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [shipmentForm] = Form.useForm();
  const [quantityForm] = Form.useForm();

  const loadDetail = useCallback(async () => {
    try {
      const response = await stockOrderAPI.getById(id);
      const data = response.data || {};
      const orderData = data.order;
      if (!orderData) {
        message.error('未找到备货订单');
        navigate('/stock-orders');
        return;
      }
      orderData.items = Array.isArray(orderData.items) ? orderData.items : [];
      setOrder(orderData);
      setShipments(Array.isArray(data.shipments) ? data.shipments : []);
      setActivities(Array.isArray(data.activities) ? data.activities : []);
      setShippedQty(data.shippedQty || {});
    } catch (error) {
      message.error('加载备货订单详情失败');
      navigate('/stock-orders');
    }
  }, [id, navigate]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleOpenShipmentModal = () => {
    shipmentForm.resetFields();
    shipmentForm.setFieldsValue({
      shippedItems: [{ itemId: undefined, quantity: 1 }]
    });
    setShipmentModalVisible(true);
  };

  const handleCreateShipment = async (values) => {
    try {
      const items = values?.shippedItems || [];
      const normalized = items.filter(item => item?.itemId && item?.quantity);
      if (normalized.length === 0) {
        message.error('至少选择一个产品');
        return;
      }
      const uniq = new Set(normalized.map(item => item.itemId));
      if (uniq.size !== normalized.length) {
        message.error('同一产品请勿重复添加');
        return;
      }
      await stockShipmentAPI.create({
        stockOrderId: id,
        shippedItems: normalized,
        notes: values?.notes
      });
      message.success('出货成功');
      setShipmentModalVisible(false);
      shipmentForm.resetFields();
      loadDetail();
    } catch (error) {
      message.error(error.response?.data?.error || '出货失败');
    }
  };

  const handleOpenQuantityModal = (item) => {
    setEditingItem(item);
    const storedOperator = typeof window !== 'undefined'
      ? window.localStorage.getItem(OPERATOR_STORAGE_KEY)
      : '';
    quantityForm.setFieldsValue({
      quantity: item.quantity,
      changedBy: storedOperator || '',
      note: ''
    });
    setQuantityModalVisible(true);
  };

  const handleUpdateQuantity = async (values) => {
    if (!order || !editingItem) return;
    try {
      await stockOrderAPI.updateItemQuantity(order._id, editingItem._id, values);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(OPERATOR_STORAGE_KEY, values.changedBy);
      }
      message.success('订单数量已更新');
      setQuantityModalVisible(false);
      setEditingItem(null);
      quantityForm.resetFields();
      loadDetail();
    } catch (error) {
      message.error(error.response?.data?.error || '更新订单数量失败');
    }
  };

  const handleCloseQuantityModal = () => {
    setQuantityModalVisible(false);
    setEditingItem(null);
    quantityForm.resetFields();
  };

  const itemColumns = [
    {
      title: '产品名称',
      dataIndex: 'productName',
      key: 'productName'
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      render: (text) => text || '-'
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
        const shipped = shippedQty[record._id] || 0;
        return shipped;
      }
    },
    {
      title: '待出货',
      key: 'remaining',
      render: (_, record) => {
        const shipped = shippedQty[record._id] || 0;
        return Math.max(record.quantity - shipped, 0);
      }
    },
    {
      title: '进度',
      key: 'progress',
      render: (_, record) => {
        const shipped = shippedQty[record._id] || 0;
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
          {(items || []).map((item, index) => (
            <div key={index}>
              {item.productName} x {item.quantity}
            </div>
          ))}
        </div>
      )
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      render: (text) => text || '-'
    }
  ];

  return (
    <div>
      <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/stock-orders')}>
        返回列表
      </Button>
      <h1 style={{ marginBottom: 24 }}>备货订单详情</h1>

      <Card title="订单信息" style={{ marginBottom: 16 }}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="备货单号">{order?.orderNumber}</Descriptions.Item>
          <Descriptions.Item label="客户名称">{order?.customerName}</Descriptions.Item>
          <Descriptions.Item label="联系人">{order?.contactPerson || '-'}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{order?.contactPhone || '-'}</Descriptions.Item>
          <Descriptions.Item label="订单状态">
            <Tag color={ORDER_STATUS_COLORS[order?.status] || 'default'}>
              {ORDER_STATUS_LABELS[order?.status] || order?.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="付款状态">
            <Tag color={PAYMENT_STATUS_COLORS[order?.paymentStatus] || 'default'}>
              {PAYMENT_STATUS_LABELS[order?.paymentStatus] || order?.paymentStatus}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="订单金额">{order?.totalAmount ? order.totalAmount.toFixed(2) : '-'}</Descriptions.Item>
          <Descriptions.Item label="预计出货时间">
            {order?.expectedShipDate ? dayjs(order.expectedShipDate).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="备注" span={2}>
            {order?.remarks || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {order?.createdAt ? dayjs(order.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {order?.updatedAt ? dayjs(order.updatedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        title="产品明细"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenShipmentModal}
            disabled={!order || order.status === 'cancelled'}
          >
            创建出货
          </Button>
        }
        style={{ marginBottom: 16 }}
      >
        <Table
          columns={itemColumns}
          dataSource={order?.items || []}
          rowKey="_id"
          pagination={false}
        />
      </Card>

      <Card title="出货记录" style={{ marginBottom: 16 }}>
        <Table
          columns={shipmentColumns}
          dataSource={shipments}
          rowKey="_id"
          pagination={false}
          locale={{ emptyText: '暂无出货记录' }}
        />
      </Card>

      <Card title="操作日志">
        <Table
          dataSource={activities}
          rowKey="_id"
          pagination={false}
          columns={[
            {
              title: '时间',
              dataIndex: 'createdAt',
              key: 'createdAt',
              width: 200,
              render: (date) => new Date(date).toLocaleString('zh-CN')
            },
            {
              title: '类型',
              dataIndex: 'type',
              key: 'type'
            },
            {
              title: '描述',
              dataIndex: 'description',
              key: 'description'
            }
          ]}
          locale={{ emptyText: '暂无日志' }}
        />
      </Card>

      <Modal
        title="创建出货"
        open={shipmentModalVisible}
        onCancel={() => setShipmentModalVisible(false)}
        onOk={() => shipmentForm.submit()}
        destroyOnClose
      >
        <Form form={shipmentForm} layout="vertical" onFinish={handleCreateShipment}>
          <Form.List
            name="shippedItems"
            rules={[{
              validator: async (_, value) => {
                if (!value || value.length < 1) {
                  return Promise.reject(new Error('至少添加一个出货项'));
                }
              }
            }]}
          >
            {(fields, { add, remove }) => (
              <>
                {fields.map(field => (
                  <Space key={field.key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                    <Form.Item
                      {...field}
                      name={[field.name, 'itemId']}
                      rules={[{ required: true, message: '请选择产品' }]}
                    >
                      <Select placeholder="选择产品" style={{ width: 220 }}>
                        {(order?.items || []).map(item => (
                          <Select.Option key={item._id} value={item._id}>
                            {item.productName}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'quantity']}
                      rules={[{ required: true, message: '请输入数量' }]}
                    >
                      <InputNumber min={1} placeholder="数量" />
                    </Form.Item>
                    {fields.length > 1 && (
                      <Button type="link" danger onClick={() => remove(field.name)}>
                        删除
                      </Button>
                    )}
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add({ itemId: undefined, quantity: 1 })} icon={<PlusOutlined />}>
                  添加出货项
                </Button>
              </>
            )}
          </Form.List>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} placeholder="输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="调整数量"
        open={quantityModalVisible}
        onCancel={handleCloseQuantityModal}
        onOk={() => quantityForm.submit()}
        destroyOnClose
      >
        <Form form={quantityForm} layout="vertical" onFinish={handleUpdateQuantity}>
          <Form.Item
            name="quantity"
            label="新数量"
            rules={[{ required: true, message: '请输入新数量' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="changedBy"
            label="操作人"
            rules={[{ required: true, message: '请输入操作人' }]}
          >
            <Input placeholder="输入操作人姓名" />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={3} placeholder="输入备注信息（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default StockOrderDetail;
