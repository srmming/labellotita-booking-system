import React, { useState, useEffect } from 'react';
import { Form, Select, InputNumber, Button, message, Card, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { orderAPI, customerAPI, productAPI } from '../../services/api';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';

function OrderForm() {
  const [form] = Form.useForm();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
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
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="customerId"
            label="客户"
            rules={[{ required: true, message: '请选择客户' }]}
          >
            <Select
              showSearch
              placeholder="选择客户"
              optionFilterProp="children"
            >
              {customers.map(c => (
                <Select.Option key={c._id} value={c._id}>
                  {c.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

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
    </div>
  );
}

export default OrderForm;

