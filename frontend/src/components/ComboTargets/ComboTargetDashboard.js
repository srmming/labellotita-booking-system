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
  const [baseTotals, setBaseTotals] = useState({ shortage: 0 });

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

      setComboSummary(combos);
      setTotals({
        target: totalsData.target || 0,
        shipped: totalsData.shipped || 0,
        remaining: totalsData.remaining || 0,
        shortage: totalsData.shortage || 0
      });

      const baseSummaryMap = {};
      combos.forEach((combo) => {
        (combo.components || []).forEach((component) => {
          const id = component.productId || component.productName;
          if (!id) {
            return;
          }

          if (!baseSummaryMap[id]) {
            baseSummaryMap[id] = {
              key: id,
              productName: component.productName,
              plannedQuantity: 0,
              usedQuantity: 0,
              remainingQuantity: 0,
              currentInventory: component.currentInventory,
              shortage: 0
            };
          }

          baseSummaryMap[id].plannedQuantity += Number(component.plannedQuantity) || 0;
          baseSummaryMap[id].usedQuantity += Number(component.usedQuantity) || 0;
          baseSummaryMap[id].remainingQuantity += Number(component.remainingQuantity) || 0;
          if (
            baseSummaryMap[id].currentInventory === null ||
            baseSummaryMap[id].currentInventory === undefined
          ) {
            baseSummaryMap[id].currentInventory = component.currentInventory;
          }
        });
      });

      const baseSummaryList = Object.values(baseSummaryMap).map((item) => {
        const current = item.currentInventory || 0;
        const shortage = Math.max(item.remainingQuantity - current, 0);
        return {
          ...item,
          shortage
        };
      });

      const totalBaseShortage = baseSummaryList.reduce(
        (sum, item) => sum + (Number(item.shortage) || 0),
        0
      );

      setBaseTotals({
        shortage: totalBaseShortage
      });
    } catch (error) {
      message.error('加载组合销售目标数据失败');
      setComboSummary([]);
      setTotals({ target: 0, shipped: 0, remaining: 0, shortage: 0 });
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

  const baseProductColumns = [
    {
      title: '基础产品',
      dataIndex: 'productName',
      key: 'productName'
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
      title: '剩余需求（汇总）',
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
      title: '缺口（汇总）',
      dataIndex: 'shortage',
      key: 'shortage',
      render: (value) =>
        value > 0 ? <Tag color="red">{value}</Tag> : <Tag color="green">无</Tag>
    }
  ];

  const baseProductSummary = useMemo(() => {
    const map = {};
    comboSummary.forEach((combo) => {
      (combo.components || []).forEach((component) => {
        const id = component.productId || component.productName;
        if (!id) {
          return;
        }

        if (!map[id]) {
          map[id] = {
            key: id,
            productName: component.productName,
            plannedQuantity: 0,
            usedQuantity: 0,
            remainingQuantity: 0,
            currentInventory: component.currentInventory,
            shortage: 0
          };
        }

        map[id].plannedQuantity += Number(component.plannedQuantity) || 0;
        map[id].usedQuantity += Number(component.usedQuantity) || 0;
        map[id].remainingQuantity += Number(component.remainingQuantity) || 0;

        if (
          map[id].currentInventory === null ||
          map[id].currentInventory === undefined
        ) {
          map[id].currentInventory = component.currentInventory;
        }
      });
    });

    return Object.values(map).map((item) => {
      const current = item.currentInventory || 0;
      const shortage = Math.max(item.remainingQuantity - current, 0);
      return {
        ...item,
        shortage
      };
    });
  }, [comboSummary]);

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
        <h1 style={{ margin: 0 }}>圣诞备货看板</h1>
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
            <Statistic title="基础产品缺口（件）" value={baseTotals.shortage || totals.shortage} />
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

      <Card>
        <Table
          columns={comboColumns}
          dataSource={comboSummary.map(item => ({ ...item, key: item.comboId }))}
          loading={loading}
          expandable={{ expandedRowRender }}
          pagination={false}
        />
      </Card>

      <Card style={{ marginTop: 16 }}>
        <h2 style={{ marginBottom: 16 }}>基础产品汇总需求</h2>
        <Table
          columns={baseProductColumns}
          dataSource={baseProductSummary}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
}

export default ComboTargetDashboard;
