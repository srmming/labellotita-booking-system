import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, message, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { productionAPI } from '../../services/api';

function ProductionPlan() {
  const [planItems, setPlanItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProductionPlan();
  }, []);

  const loadProductionPlan = async () => {
    try {
      setLoading(true);
      const response = await productionAPI.getPlan();
      setPlanItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      message.error('加载生产计划失败');
      setPlanItems([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '基础产品',
      dataIndex: 'productName',
      key: 'productName'
    },
    {
      title: '需求数量',
      dataIndex: 'required',
      key: 'required',
      sorter: (a, b) => a.required - b.required
    },
    {
      title: '当前库存',
      dataIndex: 'current',
      key: 'current',
      sorter: (a, b) => a.current - b.current
    },
    {
      title: '缺货数量',
      dataIndex: 'shortage',
      key: 'shortage',
      sorter: (a, b) => a.shortage - b.shortage,
      render: (shortage) => (
        <Tag color={shortage > 0 ? 'red' : 'green'}>
          {shortage > 0 ? shortage : '充足'}
        </Tag>
      )
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => {
        if (record.shortage > 0) {
          return <Tag color="red">需要补货</Tag>;
        } else if (record.current < record.required * 1.2) {
          return <Tag color="orange">库存偏低</Tag>;
        } else {
          return <Tag color="green">库存充足</Tag>;
        }
      }
    }
  ];

  const summary = planItems.reduce(
    (acc, item) => {
      if (item.shortage > 0) {
        acc.shortageCount++;
      }
      return acc;
    },
    { shortageCount: 0 }
  );

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h1>生产计划</h1>
        <Button
          icon={<ReloadOutlined />}
          onClick={loadProductionPlan}
          loading={loading}
        >
          刷新
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 16 }}>
          <p>基于当前待生产订单，汇总所需基础产品数量</p>
          <p style={{ color: '#faad14', marginTop: 8 }}>
            ⚠️ 缺货产品数量: <strong>{summary.shortageCount}</strong>
          </p>
        </div>
      </Card>

      <Table
        columns={columns}
        dataSource={planItems}
        rowKey="productId"
        loading={loading}
        pagination={false}
      />
    </div>
  );
}

export default ProductionPlan;

