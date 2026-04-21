import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminOrders, updateOrderStatus, logout } from '../services/api';
import OrderCard from '../components/OrderCard';
import OrderDetailsModal from '../components/OrderDetailsModal';
import PinModal from '../components/PinModal';
import ProductManagement from '../components/ProductManagement';

const statusFilters = [
  { id: 'all', label: 'All Orders' },
  { id: 'pending', label: 'Pending' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'serving', label: 'Serving' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default function Admin() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'products'
  const [selectedPeriod, setSelectedPeriod] = useState('today'); // 'today', 'week', 'month'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pinModal, setPinModal] = useState({ isOpen: false, orderId: null, status: null, error: false });
  const [summary, setSummary] = useState({
    today: { sales: 0, orders: 0, completed: 0, cancelled: 0 },
    week: { sales: 0, orders: 0, completed: 0, cancelled: 0 },
    month: { sales: 0, orders: 0, completed: 0, cancelled: 0 },
  });
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/login');
      return;
    }

    loadOrders();
    const interval = setInterval(loadOrders, 10000); // Poll every 10 seconds (slower is better for free tier)
    return () => clearInterval(interval);
  }, [navigate]);

  const loadOrders = async () => {
    try {
      const response = await getAdminOrders('all');
      setOrders(response.data.data);
      if (response.data.summary) {
        setSummary(response.data.summary);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus, pin = null) => {
    const order = orders.find(o => o.id === orderId);
    const isTerminalCurrent = order && ['completed', 'cancelled'].includes(order.status);

    // If order is ALREADY locked and no PIN provided, open modal for override
    if (isTerminalCurrent && !pin) {
      setPinModal({ isOpen: true, orderId, status: newStatus, error: false });
      return;
    }

    try {
      await updateOrderStatus(orderId, newStatus, pin);
      setPinModal({ isOpen: false, orderId: null, status: null, error: false });
      loadOrders();
    } catch (error) {
      if (error.response?.status === 403) {
        setPinModal(prev => ({ ...prev, error: true }));
      } else {
        console.error('Failed to update status:', error);
        alert(error.response?.data?.message || 'Failed to update order status.');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem('admin_token');
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if API call fails, clear local session
      localStorage.removeItem('admin_token');
      navigate('/login');
    }
  };

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    preparing: orders.filter((o) => o.status === 'preparing').length,
    serving: orders.filter((o) => o.status === 'serving').length,
    completed: orders.filter((o) => o.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading orders...</p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: 'var(--space-sm)' }}>
            Note: It may take up to 60 seconds to "wake up" the server on the first try.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page" id="admin-page">
      <div className="container">
        <div className="page-header animate-fade-in-up">
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Manage and update order statuses</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-md)' }} className="animate-fade-in-up delay-1">
          <div>
            <p className="page-subtitle" style={{ marginBottom: 'var(--space-xs)' }}>Sales Overview</p>
          </div>
          <div className="period-selector" style={{ display: 'flex', gap: 'var(--space-xs)', background: 'var(--color-bg-secondary)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'Last 7 Days' },
              { id: 'month', label: 'Last 30 Days' }
            ].map(period => (
              <button
                key={period.id}
                className={`btn btn-sm ${selectedPeriod === period.id ? 'btn-primary' : ''}`}
                style={{ 
                  background: selectedPeriod === period.id ? 'var(--color-primary)' : 'transparent',
                  color: selectedPeriod === period.id ? 'white' : 'var(--color-text-secondary)',
                  boxShadow: 'none',
                  fontSize: '0.75rem',
                  padding: 'var(--space-xs) var(--space-md)'
                }}
                onClick={() => setSelectedPeriod(period.id)}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`collapsible-wrapper ${!showFilters ? 'collapsed' : ''}`}>
          <div className="admin-summary-grid animate-fade-in-up delay-1">
            <div className="summary-card">
              <span className="summary-label">Total Sales</span>
              <span className="summary-value sales">₱{parseFloat(summary[selectedPeriod].sales).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Orders</span>
              <span className="summary-value">{summary[selectedPeriod].orders}</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Completed</span>
              <span className="summary-value" style={{ color: 'var(--color-success)' }}>{summary[selectedPeriod].completed}</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Cancelled</span>
              <span className="summary-value" style={{ color: 'var(--color-danger)' }}>{summary[selectedPeriod].cancelled}</span>
            </div>
          </div>
        </div>

        <div className="admin-tabs animate-fade-in-up delay-2" style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', borderBottom: '1px solid var(--color-border)' }}>
          <button
            className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              if (activeTab === 'orders') {
                setShowFilters(!showFilters);
              } else {
                setActiveTab('orders');
                setShowFilters(true);
              }
            }}
            style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0', borderBottom: 'none' }}
          >
            Orders
          </button>
          <button
            className={`btn ${activeTab === 'products' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              if (activeTab === 'products') {
                setShowFilters(!showFilters);
              } else {
                setActiveTab('products');
                setShowFilters(true);
              }
            }}
            style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0', borderBottom: 'none' }}
          >
            Products
          </button>

          <button
            className="btn btn-sm btn-danger"
            onClick={handleLogout}
            style={{ marginLeft: 'auto', alignSelf: 'center', marginBottom: 'var(--space-xs)' }}
            id="admin-logout-btn"
          >
            Logout
          </button>
        </div>

        {activeTab === 'orders' ? (
          <>
            <div className={`collapsible-wrapper ${!showFilters ? 'collapsed' : ''}`}>
              <div className="admin-filters animate-fade-in-up delay-2">
                {statusFilters.map((filter) => (
                  <button
                    key={filter.id}
                    className={`category-tab ${activeFilter === filter.id ? 'active' : ''}`}
                    onClick={() => setActiveFilter(filter.id)}
                    id={`filter-${filter.id}`}
                  >
                    {filter.label}
                  </button>
                ))}
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    setLoading(true);
                    loadOrders();
                  }}
                  style={{ marginLeft: 'auto' }}
                  id="refresh-orders-btn"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="admin-orders">
              {orders.filter(o => activeFilter === 'all' || o.status === activeFilter).length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--color-text-muted)' }}>
                  No orders found
                </div>
              ) : (
                orders.filter(o => activeFilter === 'all' || o.status === activeFilter).map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onUpdateStatus={handleUpdateStatus}
                    onViewDetails={setSelectedOrder}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          <ProductManagement showFilters={showFilters} />
        )}
      </div>

      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />

      <PinModal
        isOpen={pinModal.isOpen}
        error={pinModal.error}
        onClose={() => setPinModal({ isOpen: false, orderId: null, status: null, error: false })}
        onSuccess={(pin) => handleUpdateStatus(pinModal.orderId, pinModal.status, pin)}
        title={orders.find(o => o.id === pinModal.orderId)?.status === 'completed' || orders.find(o => o.id === pinModal.orderId)?.status === 'cancelled' ? 'Manager Unlock' : 'Manager Approval'}
        subtitle={orders.find(o => o.id === pinModal.orderId)?.status === 'completed' || orders.find(o => o.id === pinModal.orderId)?.status === 'cancelled' ? 'Enter PIN to authorize order undo/correction.' : 'Enter PIN to authorize finalizing this order.'}
      />
    </div>
  );
}
