import React, { useState, useEffect } from 'react';
import { 
  Tabs, Table, Button, Modal, Form, Input, Select, InputNumber, 
  message, Space, Tag, Popconfirm, Radio, Pagination 
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SwapOutlined, HistoryOutlined } from '@ant-design/icons';
import { productAPI } from '../../services/api';
import { PRODUCT_TYPE_LABELS, PRODUCT_TYPE_COLORS } from '../../utils/constants';

const { TabPane } = Tabs;

function ProductList() {
  const [products, setProducts] = useState([]);
  const [baseProducts, setBaseProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [adjustmentHistory, setAdjustmentHistory] = useState([]);
  const [form] = Form.useForm();
  const [adjustForm] = Form.useForm();
  
  // 分页状态
  const [comboPage, setComboPage] = useState(1);
  const [basePage, setBasePage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const [allRes, baseRes] = await Promise.all([
        productAPI.getAll(),
        productAPI.getAll('base')
      ]);
      setProducts(Array.isArray(allRes.data) ? allRes.data : []);
      setBaseProducts(Array.isArray(baseRes.data) ? baseRes.data : []);
    } catch (error) {
      message.error('加载产品列表失败');
      setProducts([]);
      setBaseProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingProduct(null);
    form.resetFields();
    form.setFieldsValue({ annualSalesTarget: 0 });
    setModalVisible(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    form.setFieldsValue({
      ...product,
      annualSalesTarget: product.annualSalesTarget ?? 0,
      components: product.components?.map(c => ({
        productId: c.productId._id || c.productId,
        quantity: c.quantity
      }))
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await productAPI.delete(id);
      message.success('删除成功');
      loadProducts();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (values.type === 'base') {
        delete values.annualSalesTarget;
      }

      if (editingProduct) {
        await productAPI.update(editingProduct._id, values);
        message.success('更新成功');
      } else {
        await productAPI.create(values);
        message.success('创建成功');
      }
      
      setModalVisible(false);
      loadProducts();
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  // 打开库存调整弹窗
  const handleAdjustInventory = (product) => {
    setAdjustingProduct(product);
    adjustForm.resetFields();
    setAdjustModalVisible(true);
  };

  // 提交库存调整
  const handleAdjustSubmit = async () => {
    try {
      const values = await adjustForm.validateFields();
      await productAPI.adjustInventory(adjustingProduct._id, values);
      message.success('库存调整成功');
      setAdjustModalVisible(false);
      loadProducts();
    } catch (error) {
      message.error(error.response?.data?.error || '库存调整失败');
    }
  };

  // 查看调整历史
  const handleViewHistory = async (product) => {
    try {
      setAdjustingProduct(product);
      const response = await productAPI.getAdjustmentHistory(product._id);
      setAdjustmentHistory(Array.isArray(response.data) ? response.data : []);
      setHistoryModalVisible(true);
    } catch (error) {
      message.error('加载历史记录失败');
      setAdjustmentHistory([]);
    }
  };

  const productType = Form.useWatch('type', form);

  // 组合产品列表
  const comboProducts = products.filter(p => p.type === 'combo');
  const paginatedComboProducts = comboProducts.slice(
    (comboPage - 1) * pageSize,
    comboPage * pageSize
  );

  // 基础产品列表
  const paginatedBaseProducts = baseProducts.slice(
    (basePage - 1) * pageSize,
    basePage * pageSize
  );

  const comboColumns = [
    {
      title: '产品名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={PRODUCT_TYPE_COLORS[type]}>
          {PRODUCT_TYPE_LABELS[type]}
        </Tag>
      )
    },
    {
      title: '年度销售目标',
      dataIndex: 'annualSalesTarget',
      key: 'annualSalesTarget',
      render: (value) => value ?? 0
    },
    {
      title: '组件配置',
      key: 'components',
      render: (_, record) => (
        <div>
          {record.components?.map(c => (
            <div key={c.productId._id || c.productId}>
              {c.productName} x {c.quantity}
            </div>
          ))}
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个产品吗？"
            onConfirm={() => handleDelete(record._id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const baseColumns = [
    {
      title: '产品名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '当前库存',
      key: 'inventory',
      render: (_, record) => record.inventory?.current || 0
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<SwapOutlined />}
            onClick={() => handleAdjustInventory(record)}
          >
            库存调整
          </Button>
          <Button
            type="link"
            icon={<HistoryOutlined />}
            onClick={() => handleViewHistory(record)}
          >
            调整历史
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个产品吗？"
            onConfirm={() => handleDelete(record._id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const historyColumns = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString('zh-CN')
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'increase' ? 'green' : 'red'}>
          {type === 'increase' ? '增加' : '减少'}
        </Tag>
      )
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity'
    },
    {
      title: '调整前',
      dataIndex: 'beforeQuantity',
      key: 'beforeQuantity'
    },
    {
      title: '调整后',
      dataIndex: 'afterQuantity',
      key: 'afterQuantity'
    },
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason'
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h1>产品管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增产品
        </Button>
      </div>

      <Tabs defaultActiveKey="combo">
        <TabPane tab="组合产品" key="combo">
          <Table
            columns={comboColumns}
            dataSource={paginatedComboProducts}
            rowKey="_id"
            loading={loading}
            pagination={false}
          />
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Pagination
              current={comboPage}
              total={comboProducts.length}
              pageSize={pageSize}
              onChange={setComboPage}
              showTotal={(total) => `共 ${total} 条`}
            />
          </div>
        </TabPane>

        <TabPane tab="基础产品" key="base">
          <Table
            columns={baseColumns}
            dataSource={paginatedBaseProducts}
            rowKey="_id"
            loading={loading}
            pagination={false}
          />
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Pagination
              current={basePage}
              total={baseProducts.length}
              pageSize={pageSize}
              onChange={setBasePage}
              showTotal={(total) => `共 ${total} 条`}
            />
          </div>
        </TabPane>
      </Tabs>

      {/* 产品编辑/创建弹窗 */}
      <Modal
        title={editingProduct ? '编辑产品' : '新增产品'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="产品名称"
            rules={[{ required: true, message: '请输入产品名称' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="type"
            label="产品类型"
            rules={[{ required: true, message: '请选择产品类型' }]}
          >
            <Select>
              <Select.Option value="base">基础产品</Select.Option>
              <Select.Option value="combo">组合产品</Select.Option>
            </Select>
          </Form.Item>

          {productType === 'base' && (
            <Form.Item
              name={['inventory', 'current']}
              label="初始库存"
              rules={[{ required: true, message: '请输入初始库存' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          )}

          {productType === 'combo' && (
            <>
              <Form.Item
                name="annualSalesTarget"
                label="年度销售目标（套）"
                initialValue={0}
                rules={[{ required: true, message: '请输入年度销售目标' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="如：500" />
              </Form.Item>
              <Form.List name="components">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(field => (
                      <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'productId']}
                          rules={[{ required: true, message: '请选择基础产品' }]}
                        >
                          <Select placeholder="选择基础产品" style={{ width: 200 }}>
                            {baseProducts.map(p => (
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
                        <Button onClick={() => remove(field.name)}>删除</Button>
                      </Space>
                    ))}
                    <Button type="dashed" onClick={() => add()} block>
                      添加组件
                    </Button>
                  </>
                )}
              </Form.List>
            </>
          )}
        </Form>
      </Modal>

      {/* 库存调整弹窗 */}
      <Modal
        title={`库存调整 - ${adjustingProduct?.name}`}
        open={adjustModalVisible}
        onOk={handleAdjustSubmit}
        onCancel={() => setAdjustModalVisible(false)}
      >
        <Form form={adjustForm} layout="vertical">
          <Form.Item
            name="type"
            label="调整类型"
            rules={[{ required: true, message: '请选择调整类型' }]}
          >
            <Radio.Group>
              <Radio value="increase">增加库存</Radio>
              <Radio value="decrease">减少库存</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="quantity"
            label="调整数量"
            rules={[{ required: true, message: '请输入调整数量' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="如：100, 58" />
          </Form.Item>

          <Form.Item
            name="reason"
            label="调整原因"
            rules={[{ required: true, message: '请输入调整原因' }]}
          >
            <Input.TextArea rows={3} placeholder="如：采购入库、盘点调整、损耗等" />
          </Form.Item>

          <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
            当前库存：{adjustingProduct?.inventory?.current || 0}
          </div>
        </Form>
      </Modal>

      {/* 调整历史弹窗 */}
      <Modal
        title={`调整历史 - ${adjustingProduct?.name}`}
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={null}
        width={800}
      >
        <Table
          columns={historyColumns}
          dataSource={adjustmentHistory}
          rowKey="_id"
          pagination={false}
        />
      </Modal>
    </div>
  );
}

export default ProductList;
