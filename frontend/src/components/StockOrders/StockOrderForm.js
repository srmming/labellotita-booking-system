import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Select,
  Space
} from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { stockOrderAPI } from '../../services/api';

function StockOrderForm() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      loadOrder();
    }
  }, [id]);

  const loadOrder = async () => {
    try {
      setInitialLoading(true);
      const response = await stockOrderAPI.getById(id);
      const order = response.data?.order;
      if (!order) {
        message.error('未找到备货订单');
        navigate('/stock-orders');
        return;
      }
      form.setFieldsValue({
        customerName: order.customerName,
        contactPerson: order.contactPerson,
        contactPhone: order.contactPhone,
        items: order.items?.map(item => ({
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit,
          notes: item.notes
        })) || [],
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        status: order.status,
        expectedShipDate: order.expectedShipDate ? dayjs(order.expectedShipDate) : null,
        remarks: order.remarks
      });
    } catch (error) {
      message.error('加载备货订单失败');
      navigate('/stock-orders');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const payload = {
        ...values,
        items: values.items?.map(item => ({
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit,
          notes: item.notes
        })),
        expectedShipDate: values.expectedShipDate ? values.expectedShipDate.toISOString() : null
      };

      if (isEdit) {
        await stockOrderAPI.update(id, payload);
        message.success('备货订单更新成功');
      } else {
        await stockOrderAPI.create(payload);
        message.success('备货订单创建成功');
      }
      navigate('/stock-orders');
    } catch (error) {
      message.error(error.response?.data?.error || `${isEdit ? '更新' : '创建'}备货订单失败`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>{isEdit ? '编辑备货订单' : '创建备货订单'}</h1>
      <Card style={{ marginTop: 16, maxWidth: 900 }} loading={initialLoading}>
        <Form
          layout="vertical"
          form={form}
          onFinish={handleSubmit}
          initialValues={{
            paymentStatus: 'unpaid',
            status: 'pending',
            items: [{ productName: '', quantity: 1 }]
          }}
        >
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

          <Form.List
            name="items"
            rules={[{
              validator: async (_, value) => {
                if (!value || value.length < 1) {
                  return Promise.reject(new Error('至少添加一个产品'));
                }
                if (value.some(item => !item?.productName)) {
                  return Promise.reject(new Error('产品名称不能为空'));
                }
                if (value.some(item => !item?.quantity || item.quantity < 1)) {
                  return Promise.reject(new Error('数量必须大于0'));
                }
              }
            }]}
          >
            {(fields, { add, remove }, { errors }) => (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>产品列表</h3>
                  <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>添加产品</Button>
                </div>
                {fields.map(field => (
                  <Space key={field.key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                    <Form.Item
                      {...field}
                      name={[field.name, 'productName']}
                      rules={[{ required: true, message: '请输入产品名称' }]}
                    >
                      <Input placeholder="产品名称" style={{ width: 220 }} />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'quantity']}
                      rules={[{ required: true, message: '请输入数量' }]}
                    >
                      <InputNumber min={1} placeholder="数量" />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'unit']}
                    >
                      <Input placeholder="单位（可选）" style={{ width: 120 }} />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'notes']}
                    >
                      <Input placeholder="备注（可选）" style={{ width: 200 }} />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(field.name)} />
                  </Space>
                ))}
                <Form.ErrorList errors={errors} />
              </>
            )}
          </Form.List>

          <Form.Item
            name="paymentStatus"
            label="付款状态"
            rules={[{ required: true, message: '请选择付款状态' }]}
          >
            <Select placeholder="选择付款状态">
              <Select.Option value="unpaid">未付款</Select.Option>
              <Select.Option value="partial">部分付款</Select.Option>
              <Select.Option value="paid">已付款</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="订单状态"
            rules={[{ required: true, message: '请选择订单状态' }]}
          >
            <Select placeholder="选择订单状态">
              <Select.Option value="pending">待处理</Select.Option>
              <Select.Option value="producing">生产中</Select.Option>
              <Select.Option value="shipping">出货中</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
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

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {isEdit ? '保存修改' : '创建备货订单'}
              </Button>
              <Button onClick={() => navigate('/stock-orders')}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default StockOrderForm;
