import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Table,
  message,
  Select,
  Statistic,
  Row,
  Col,
  Progress,
  Tag,
  Space
} from 'antd';
import { productAPI } from '../../services/api';

function ComboTargetDashboard() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [loading, setLoading] = useState(false);
  const [comboSummary, setComboSummary] = useState([]);
  const [totals, setTotals] = useState({ target: 0, shipped: 0, remaining: 0, shortage: 0 });
  const [baseProducts, setBaseProducts] = useState([]);

  const yearOptions = useMemo(() => {
    const startYear = currentYear - 2;
    return Array.from({ length: 5 }, (_, index) => startYear + index);
  }, [currentYear]);

  const fetchSummary = async (year) => {
    try {
      setLoading(true);
      const response = await productAPI.getComboTargetSummary(year);
      const data = response.data || {};
      const combos = Array.isArray(data.combos) ? data.combos : [];
      const totalsData = data.totals || {};
      const baseProductsData = Array.isArray(data.baseProducts) ? data.baseProducts : [];

      setComboSummary(combos);
      setTotals({
        target: totalsData.target || 0,
        shipped: totalsData.shipped || 0,
        remaining: totalsData.remaining || 0,
        shortage: totalsData.shortage || 0
      });
      setBaseProducts(baseProductsData);
    } catch (error) {
      message.error('加载组合销售目标数据失败');
      setComboSummary([]);
      setTotals({ target: 0, shipped: 0, remaining: 0, shortage: 0 });
      setBaseProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(selectedYear);
  }, [selectedYear]);

  const overallCompletion = useMemo(() => {
    if (!totals.target) {
      return 0;
    }
    return Math.min((totals.shipped / totals.target) * 100, 100);
  }, [totals]);

  const comboColumns = [
    {
      title: '组合产品',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '年度销售目标',
      dataIndex: 'annualSalesTarget',
      key: 'annualSalesTarget'
    },
    {
      title: '已出货',
      dataIndex: 'shippedQuantity',
      key: 'shippedQuantity'
    },
    {
      title: '目标差额',
      dataIndex: 'remainingQuantity',
      key: 'remainingQuantity'
    },
    {
      title: '达成率',
      dataIndex: 'completionRate',
      key: 'completionRate',
      render: (value) => {
        const percent = Math.round((value || 0) * 10) / 10;
        return (
          <div style={{ minWidth: 120 }}>
            <Progress
              percent={percent}
              size="small"
              status={percent >= 100 ? 'success' : 'active'}
            />
          </div>
        );
      }
    },
    {
      title: '基础产品缺口',
      key: 'shortage',
      render: (_, record) => {
        const shortage = record.totalShortage || 0;
        if (shortage > 0) {
          return <Tag color="red">{shortage}</Tag>;
        }
        return <Tag color="green">无缺口</Tag>;
      }
    }
  ];

  const componentColumns = [
    {
      title: '基础产品',
      dataIndex: 'productName',
      key: 'productName'
    },
    {
      title: '单套用量',
      dataIndex: 'quantityPerCombo',
      key: 'quantityPerCombo'
    },
    {
      title: '目标总量',
      dataIndex: 'plannedQuantity',
      key: 'plannedQuantity'
    },
    {
      title: '已消耗',
      dataIndex: 'usedQuantity',
      key: 'usedQuantity'
    },
    {
      title: '剩余需求',
      dataIndex: 'remainingQuantity',
      key: 'remainingQuantity'
    },
    {
      title: '当前库存',
      dataIndex: 'currentInventory',
      key: 'currentInventory',
      render: (value) =>
        value === null || value === undefined ? '未知' : value
    },
    {
      title: '缺口',
      dataIndex: 'shortage',
      key: 'shortage',
      render: (value) =>
        value > 0 ? <Tag color="red">{value}</Tag> : <Tag color="green">无</Tag>
    }
  ];

  const expandedRowRender = (record) => (
    <Table
      columns={componentColumns}
      dataSource={(record.components || []).map(item => ({
        ...item,
        key: item.productId || item.productName
      }))}
      pagination={false}
      size="small"
    />
  );

  const baseProductColumns = [
    {
      title: '基础产品',
      dataIndex: 'productName',
      key: 'productName'
    },
    {
      title: '关联组合数量',
      dataIndex: 'combosInvolved',
      key: 'combosInvolved'
    },
    {
      title: '计划总量',
      dataIndex: 'plannedQuantity',
      key: 'plannedQuantity'
    },
    {
      title: '已消耗',
      dataIndex: 'usedQuantity',
      key: 'usedQuantity'
    },
    {
      title: '剩余需求',
      dataIndex: 'remainingQuantity',
      key: 'remainingQuantity'
    },
    {
      title: '当前库存',
      dataIndex: 'currentInventory',
      key: 'currentInventory',
      render: (value) => (value === null || value === undefined ? '未知' : value)
    },
    {
      title: '缺口',
      dataIndex: 'shortage',
      key: 'shortage',
      render: (value) => {
        if (value === null || value === undefined) {
          return <Tag color="default">未知</Tag>;
        }
        return value > 0 ? <Tag color="red">{value}</Tag> : <Tag color="green">无</Tag>;
      }
    },
    {
      title: '涉及组合',
      dataIndex: 'comboNames',
      key: 'comboNames',
      render: (value) => (Array.isArray(value) && value.length > 0 ? value.join('、') : '—')
    }
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16
        }}
      >
        <h1 style={{ margin: 0 }}>组合销售目标达成情况</h1>
        <Space>
          <span>选择年份：</span>
          <Select
            value={selectedYear}
            onChange={setSelectedYear}
            style={{ width: 120 }}
            options={yearOptions.map(year => ({ value: year, label: `${year} 年` }))}
          />
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="年度目标（套）" value={totals.target} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="已出货（套）" value={totals.shipped} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="剩余目标（套）" value={totals.remaining} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="基础产品缺口（件）" value={totals.shortage} />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Statistic
          title="年度总体达成率"
          value={Math.round(overallCompletion * 10) / 10}
          suffix="%"
        />
        <Progress
          percent={Math.round(overallCompletion * 10) / 10}
          status={overallCompletion >= 100 ? 'success' : 'active'}
          style={{ marginTop: 16 }}
        />
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <h2 style={{ marginBottom: 16 }}>基础产品统计</h2>
        <Table
          columns={baseProductColumns}
          dataSource={baseProducts.map(item => ({
            ...item,
            key: item.productId || item.productName
          }))}
          loading={loading}
          pagination={false}
        />
      </Card>

      <Card>
        <Table
          columns={comboColumns}
          dataSource={comboSummary.map(item => ({ ...item, key: item.comboId }))}
          loading={loading}
          expandable={{ expandedRowRender }}
          pagination={false}
        />
      </Card>
    </div>
  );
}

export default ComboTargetDashboard;
