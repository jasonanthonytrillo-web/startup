import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getOrder, cancelOrder } from '../services/api';
import CustomerCancelModal from '../components/CustomerCancelModal';
import { subscribeToPush } from '../utils/push';

export default function OrderConfirmation() {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [pushStatus, setPushStatus] = useState('idle'); // idle, loading, success, error
  const [pushError, setPushError] = useState('');

  useEffect(() => {
    loadOrder();
    const interval = setInterval(loadOrder, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [orderNumber]);

  const loadOrder = async () => {
    try {
      const response = await getOrder(orderNumber);
      const newOrder = response.data.data;
      setOrder(newOrder);

      // If order is completed or cancelled, clear data and redirect after a delay
      if (['completed', 'cancelled'].includes(newOrder.status)) {
        setTimeout(() => {
          localStorage.removeItem('last_order_number');
          navigate('/');
        }, 5000); // 5 second delay to see the final status
      }
    } catch (error) {
      console.error('Failed to load order:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = async () => {
    try {
      await cancelOrder(orderNumber);
      loadOrder();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel order.');
    }
  };

  const handleEnablePush = async () => {
    setPushStatus('loading');
    setPushError('');
    const result = await subscribeToPush(orderNumber);
    if (result.success) {
      setPushStatus('success');
    } else {
      setPushStatus('error');
      setPushError(result.error);
    }
  };

  if (loading) {
    return (
      <div className="confirmation-page">
        <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="confirmation-page">
        <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
          <h2>Order not found</h2>
          <Link to="/menu" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Back to Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-page" id="confirmation-page">
      <div className="container">
        <div className="confirmation-card animate-fade-in-up">
          <div className="confirmation-icon" style={{ display: 'none' }}></div>
          <h2>{order.status === 'pending' ? 'Order Pending' : 'Order Placed!'}</h2>
          <p style={{ color: 'var(--color-text-secondary)', margin: 'var(--space-sm) 0' }}>
            {order.status === 'pending' 
              ? 'Awaiting Cashier Approval for Cash Payment'
              : 'Your order has been received'}
          </p>

          <div style={{ marginTop: 'var(--space-md)' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Here's your order number:
            </span>
            <div className="order-number">{order.order_number}</div>
          </div>

          {order.status !== 'pending' ? (
            <div className="queue-info">
              Queue Position: #{order.queue_position}
            </div>
          ) : (
            <div className="queue-info" style={{background: 'rgba(255, 23, 68, 0.1)', color: 'var(--color-danger)', borderColor: 'rgba(255, 23, 68, 0.3)'}}>
              Please pay at the counter
            </div>
          )}

          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: 'rgba(255, 107, 53, 0.05)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-primary)' }}>
              <p style={{ fontSize: '0.9rem', marginBottom: 'var(--space-sm)', fontWeight: '600' }}>
                🔔 Want to know when your order is ready?
              </p>
              <button
                onClick={handleEnablePush}
                disabled={pushStatus === 'loading' || pushStatus === 'success'}
                className="btn btn-primary"
                style={{ width: '100%', fontSize: '0.9rem', padding: 'var(--space-sm)' }}
              >
                {pushStatus === 'loading' ? 'Enabling...' : 
                 pushStatus === 'success' ? 'Notifications Enabled!' : 
                 'Enable Push Notifications'}
              </button>
              {pushStatus === 'error' && (
                <p style={{ fontSize: '0.8rem', color: 'var(--color-danger)', marginTop: 'var(--space-xs)' }}>
                  {pushError || 'Failed to enable. Please check browser permissions.'}
                </p>
              )}
            </div>
          )}

          <div style={{ textAlign: 'left', marginTop: 'var(--space-xl)' }}>
            <div className="summary-row">
              <span style={{ color: 'var(--color-text-secondary)' }}>Customer</span>
              <span>{order.customer_name}</span>
            </div>
            <div className="summary-row">
              <span style={{ color: 'var(--color-text-secondary)' }}>Order Type</span>
              <span>{order.order_type === 'dine_in' ? 'DINE IN' : 'TAKE OUT'}</span>
            </div>
            <div className="summary-row">
              <span style={{ color: 'var(--color-text-secondary)' }}>Payment</span>
              <span>{order.payment_method.toUpperCase()}</span>
            </div>
            <div className="summary-row">
              <span style={{ color: 'var(--color-text-secondary)' }}>Status</span>
              <span className={`status-badge status-${order.status}`}>
                {order.status}
              </span>
            </div>
            {order.items && order.items.map((item) => (
              <div key={item.id} className="summary-row">
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  {item.quantity}x {item.product?.name}
                </span>
                <span>₱{(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            ))}
            <div className="summary-row total">
              <span>Total</span>
              <span>₱{parseFloat(order.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

        </div>

        {order.status === 'pending' && (
          <button 
            onClick={() => setIsCancelModalOpen(true)}
            className="btn btn-secondary" 
            style={{ 
              marginTop: 'var(--space-md)', 
              width: '100%', 
              color: 'var(--color-danger)',
              borderColor: 'var(--color-danger)',
              background: 'transparent',
              opacity: 0.8
            }}
          >
            Cancel Order
          </button>
        )}

        <CustomerCancelModal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          onConfirm={handleCancel}
          orderNumber={orderNumber}
        />

        <div className="confirmation-actions" style={{ maxWidth: '500px', margin: 'var(--space-md) auto 0' }}>
          <Link to="/queue" className="btn btn-primary" id="view-queue-btn" style={{flex: 1}}>
            View Queue
          </Link>
          <Link to="/menu" className="btn btn-secondary" id="order-again-btn" style={{flex: 1}}>
            Order Again
          </Link>
        </div>
      </div>
    </div>
  );
}
