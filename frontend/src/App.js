import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './components/Dashboard/Dashboard';
import CustomerList from './components/Customers/CustomerList';
import ProductList from './components/Products/ProductList';
import OrderList from './components/Orders/OrderList';
import OrderForm from './components/Orders/OrderForm';
import OrderDetail from './components/Orders/OrderDetail';
import StockOrderList from './components/StockOrders/StockOrderList';
import StockOrderForm from './components/StockOrders/StockOrderForm';
import StockOrderDetail from './components/StockOrders/StockOrderDetail';
import ProductionPlan from './components/Production/ProductionPlan';
import ComboTargetDashboard from './components/ComboTargets/ComboTargetDashboard';

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="customers" element={<CustomerList />} />
            <Route path="products" element={<ProductList />} />
            <Route path="orders" element={<OrderList />} />
            <Route path="orders/new" element={<OrderForm />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="orders/:id/edit" element={<OrderForm />} />
            <Route path="stock-orders" element={<StockOrderList />} />
            <Route path="stock-orders/new" element={<StockOrderForm />} />
            <Route path="stock-orders/:id" element={<StockOrderDetail />} />
            <Route path="stock-orders/:id/edit" element={<StockOrderForm />} />
            <Route path="production" element={<ProductionPlan />} />
            <Route path="combo-targets" element={<ComboTargetDashboard />} />
          </Route>
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;

