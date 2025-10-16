import React, { useState, useEffect } from 'react';
import { Form, Select, InputNumber, Button, message, Card, Space, Modal, Input, DatePicker } from 'antd';
import { useNavigate } from 'react-router-dom';
import { orderAPI, customerAPI, productAPI } from '../../services/api';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';

function OrderForm() {
  const [orderForm] = Form.useForm();
  const [customerForm] = Form.useForm();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [customerLoading, setCustomerLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [customersRes, productsRes] = await Promise.all([
        customerAPI.getAll(),
        productAPI.getAll('combo')  // 只加载组合产品
      ]);
      setCustomers(Array.isArray(customersRes.data) ? customersRes.data : []);
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
    } catch (error) {
      message.error('加载数据失败');
      setCustomers([]);
      setProducts([]);
    }
  };

  const handleCustomerSubmit = async () => {
    try {
      const values = await customerForm.validateFields();
      setCustomerLoading(true);
      const response = await customerAPI.create(values);
      const newCustomer = response.data;
      message.success('客户创建成功');
      setCustomers(prev => [newCustomer, ...prev]);
      orderForm.setFieldsValue({ customerId: newCustomer._id });
      setCustomerModalVisible(false);
      customerForm.resetFields();
    } catch (error) {
      if (error?.errorFields) {
        return;
      }
      message.error(error.response?.data?.error || '创建客户失败');
    } finally {
      setCustomerLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      await orderAPI.create(values);
      message.success('订单创建成功');
      navigate('/orders');
    } catch (error) {
      message.error(error.response?.data?.error || '创建订单失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>创建订单</h1>
      
      <Card style={{ marginTop: 16, maxWidth: 800 }}>
        <Form
          form={orderForm}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
            <Form.Item
              name="customerId"
              label="客户"
              rules={[{ required: true, message: '请选择客户' }]}
              style={{ flex: '1 1 200px', minWidth: 200 }}
            >
              <Select
                showSearch
                placeholder="选择客户"
                optionFilterProp="children"
                style={{ width: '100%' }}
              >
                {customers.map(c => (
                  <Select.Option key={c._id} value={c._id}>
                    {c.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => setCustomerModalVisible(true)}
            >
              新增客户
            </Button>
          </div>

          <Form.List
            name="items"
            rules={[
              {
                validator: async (_, items) => {
                  if (!items || items.length < 1) {
                    return Promise.reject(new Error('至少添加一个产品'));
                  }
                }
              }
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <>
                {fields.map((field) => (
                  <Space
                    key={field.key}
                    style={{ display: 'flex', marginBottom: 8 }}
                    align="baseline"
                  >
                    <Form.Item
                      {...field}
                      name={[field.name, 'productId']}
                      rules={[{ required: true, message: '请选择产品' }]}
                    >
                      <Select placeholder="选择组合产品" style={{ width: 300 }}>
                        {products.map(p => (
                          <Select.Option key={p._id} value={p._id}>
                            {p.name}
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
                    <MinusCircleOutlined onClick={() => remove(field.name)} />
                  </Space>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    icon={<PlusOutlined />}
                  >
                    添加产品
                  </Button>
                  <Form.ErrorList errors={errors} />
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item
            name="paymentStatus"
            label="付款状态"
            initialValue="unpaid"
          >
            <Select>
              <Select.Option value="unpaid">未付款</Select.Option>
              <Select.Option value="partial">部分付款</Select.Option>
              <Select.Option value="paid">已付款</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="totalAmount" label="订单金额（可选）">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="expectedShipDate" label="预计出货时间（可选）">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="remarks" label="备注（可选）">
            <Input.TextArea rows={3} placeholder="输入订单备注信息" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                创建订单
              </Button>
              <Button onClick={() => navigate('/orders')}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Modal
        title="新增客户"
        open={customerModalVisible}
        onCancel={() => {
          setCustomerModalVisible(false);
          customerForm.resetFields();
        }}
        onOk={() => handleCustomerSubmit()}
        confirmLoading={customerLoading}
      >
        <Form form={customerForm} layout="vertical">
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input type="email" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default OrderForm;

