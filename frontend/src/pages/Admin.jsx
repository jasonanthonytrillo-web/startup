import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminOrders, updateOrderStatus, logout } from '../services/api';
import OrderCard from '../components/OrderCard';
import OrderDetailsModal from '../components/OrderDetailsModal';
import PinModal from '../components/PinModal';
import ProductManagement from '../components/ProductManagement';

const statusFilters = [
  { id: 'all', label: 'Live Orders' },
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
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/login');
      return;
    }

    loadOrders();
    const interval = setInterval(loadOrders, 10000); // Poll every 10 seconds to save battery and reduce server load
    return () => clearInterval(interval);
  }, [navigate]);

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'sine';
      // High-pitched friendly "ding"
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.3); // A4

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      console.warn('Audio notification failed:', e);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await getAdminOrders('all');
      const fetchedOrders = response.data.data;
      
      const storedIds = JSON.parse(sessionStorage.getItem('seenOrderIds') || '[]');
      const previousIds = new Set(storedIds);
      const currentIds = new Set(fetchedOrders.map(o => o.id));
      
      if (previousIds.size > 0) {
        const newPendingOrders = fetchedOrders.filter(
          o => !previousIds.has(o.id) && o.status === 'pending'
        );
        
        if (newPendingOrders.length > 0) {
          playNotificationSound(); // Play sound for new orders
          setNotifications(prev => {
            const existingIds = new Set(prev.map(n => n.id));
            const distinctNew = newPendingOrders.filter(n => !existingIds.has(n.id));
            return [...prev, ...distinctNew];
          });
        }
      } else if (fetchedOrders.length > 0) {
        // First ever load in this session, don't notify but do store them
      }
      
      sessionStorage.setItem('seenOrderIds', JSON.stringify(Array.from(currentIds)));

      setOrders(fetchedOrders);
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

    const previousOrders = [...orders];

    try {
      // Optimistic Update: Update the UI immediately
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      ));
      
      await updateOrderStatus(orderId, newStatus, pin);
      setPinModal({ isOpen: false, orderId: null, status: null, error: false });
      loadOrders();
    } catch (error) {
      // If it fails, revert the orders to previous state
      setOrders(previousOrders);

      if (error.response?.status === 403) {
        setPinModal(prev => ({ ...prev, error: true }));
      } else {
        // Only show alert if it's NOT a timeout or empty response (which often actually worked)
        const errorMessage = error.response?.data?.message;
        if (errorMessage || (error.response && error.response.status !== 504)) {
          console.error('Failed to update status:', error);
          alert(errorMessage || 'Failed to update order status.');
        } else {
          // If it was a timeout/network error, just refresh to see if it actually worked
          loadOrders();
        }
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

        <div className="admin-sales-header animate-fade-in-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
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

        <div className="admin-tabs animate-fade-in-up delay-2" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', borderBottom: '1px solid var(--color-border)' }}>
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

              <div className="admin-search animate-fade-in-up delay-2" style={{ marginBottom: 'var(--space-lg)' }}>
                <div style={{ position: 'relative', maxWidth: '100%' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search by Order # or Customer Name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ 
                      paddingLeft: 'var(--space-2xl)',
                      height: '45px',
                      fontSize: '0.95rem'
                    }}
                  />
                  <span style={{ 
                    position: 'absolute', 
                    left: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    opacity: 0.5,
                    fontSize: '1.1rem'
                  }}>
                    🔍
                  </span>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        fontSize: '1.2rem',
                        cursor: 'pointer',
                        opacity: 0.5
                      }}
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="admin-orders">
              {(() => {
                const filtered = orders.filter(o => {
                  if (activeFilter === 'all') {
                    // Main list only shows active orders
                    return ['pending', 'preparing', 'serving'].includes(o.status);
                  }
                  
                  const matchesStatus = o.status === activeFilter;
                  const matchesSearch = 
                    o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    o.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
                  return matchesStatus && matchesSearch;
                });

                // Apply search to "Live Orders" too
                const finalFiltered = activeFilter === 'all' 
                  ? filtered.filter(o => 
                      o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      o.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                  : filtered;

                if (finalFiltered.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--color-text-muted)' }}>
                      {searchTerm ? 'No orders match your search' : 'No orders found'}
                    </div>
                  );
                }

                return finalFiltered.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onUpdateStatus={handleUpdateStatus}
                    onViewDetails={setSelectedOrder}
                  />
                ));
              })()}
            </div>
          </>
        ) : (
          <ProductManagement showFilters={showFilters} />
        )}
      </div>

      {/* Toast Notifications */}
      <div className="toast-container">
        {notifications.map((order, idx) => (
          <div 
            key={order.id + '-' + idx} 
            className="toast animate-fade-in-up"
            onClick={() => {
              setNotifications(prev => prev.filter(n => n.id !== order.id));
              setActiveTab('orders');
              setActiveFilter('pending');
              setSelectedOrder(order);
            }}
          >
            <div className="toast-icon">🔔</div>
            <div className="toast-content">
              <strong>New Order #{order.order_number}</strong>
              <span>{order.customer_name} • ₱{order.total}</span>
            </div>
            <button 
              className="toast-close"
              onClick={(e) => {
                e.stopPropagation();
                setNotifications(prev => prev.filter(n => n.id !== order.id));
              }}
            >&times;</button>
          </div>
        ))}
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
