import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  TeamOutlined,
  ToolOutlined
} from '@ant-design/icons';

const { Header, Content, Sider } = Layout;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '订单概览' },
  { key: '/orders', icon: <ShoppingOutlined />, label: '订单管理' },
  { key: '/products', icon: <AppstoreOutlined />, label: '产品管理' },
  { key: '/production', icon: <ToolOutlined />, label: '生产计划' },
  { key: '/customers', icon: <TeamOutlined />, label: '客户管理' }
];

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const currentPath = '/' + location.pathname.split('/')[1];
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#001529', 
        color: '#fff', 
        fontSize: '20px',
        fontWeight: 'bold',
        padding: '0 24px'
      }}>
        订单管理系统
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[currentPath]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              background: '#fff',
              padding: 24,
              margin: 0,
              minHeight: 280,
              borderRadius: '8px'
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

export default MainLayout;

