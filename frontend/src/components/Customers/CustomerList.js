import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { customerAPI } from '../../services/api';

function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getAll();
      setCustomers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      message.error('加载客户列表失败');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    form.setFieldsValue(customer);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await customerAPI.delete(id);
      message.success('删除成功');
      loadCustomers();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingCustomer) {
        await customerAPI.update(editingCustomer._id, values);
        message.success('更新成功');
      } else {
        await customerAPI.create(values);
        message.success('创建成功');
      }
      
      setModalVisible(false);
      loadCustomers();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone'
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email'
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
            title="确定要删除这个客户吗？"
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

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h1>客户管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增客户
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={customers}
        rowKey="_id"
        loading={loading}
      />

      <Modal
        title={editingCustomer ? '编辑客户' : '新增客户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
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

export default CustomerList;

