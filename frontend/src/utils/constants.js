// Order status options
export const ORDER_STATUS = {
  PENDING: 'pending',
  PRODUCING: 'producing',
  SHIPPING: 'shipping',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const ORDER_STATUS_LABELS = {
  pending: '待处理',
  producing: '生产中',
  shipping: '出货中',
  completed: '已完成',
  cancelled: '已取消'
};

export const ORDER_STATUS_COLORS = {
  pending: 'orange',
  producing: 'blue',
  shipping: 'cyan',
  completed: 'green',
  cancelled: 'red'
};

// Payment status options
export const PAYMENT_STATUS = {
  UNPAID: 'unpaid',
  PARTIAL: 'partial',
  PAID: 'paid'
};

export const PAYMENT_STATUS_LABELS = {
  unpaid: '未付款',
  partial: '部分付款',
  paid: '已付款'
};

export const PAYMENT_STATUS_COLORS = {
  unpaid: 'red',
  partial: 'orange',
  paid: 'green'
};

// Product types
export const PRODUCT_TYPE = {
  COMBO: 'combo',
  BASE: 'base'
};

export const PRODUCT_TYPE_LABELS = {
  combo: '组合产品',
  base: '基础产品'
};

export const PRODUCT_TYPE_COLORS = {
  combo: 'purple',
  base: 'blue'
};

