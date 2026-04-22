import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrder, cancelOrder } from '../services/api';
import CustomerCancelModal from '../components/CustomerCancelModal';

export default function Track() {
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const pollingRef = useRef(null);

  useEffect(() => {
    // Cleanup polling on unmount
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!orderNumber) return;
    
    if (!order) setLoading(true); // Only show loading on initial search
    setError(null);
    try {
      const response = await getOrder(orderNumber);
      const newOrderData = response.data.data;
      setOrder(newOrderData);

      // Start polling if not already started
      if (!pollingRef.current) {
        pollingRef.current = setInterval(() => {
          refreshOrder(orderNumber);
        }, 10000);
      }
    } catch (err) {
      setError('Order not found. Please check the number.');
      setOrder(null);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshOrder = async (num) => {
    try {
      const response = await getOrder(num);
      const updatedOrder = response.data.data;
      setOrder(updatedOrder);
      
      if (['completed', 'cancelled'].includes(updatedOrder.status)) {
        setTimeout(() => {
          localStorage.removeItem('last_order_number');
          navigate('/');
        }, 5000);
      }
    } catch (err) {
      console.error('Polling failed:', err);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelOrder(orderNumber);
      refreshOrder(orderNumber);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order.');
    }
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--space-3xl)', paddingBottom: 'var(--space-3xl)' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ marginBottom: 'var(--space-md)', fontSize: '2rem', fontWeight: '800' }}>Track Your Order</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
          Enter your 6-digit order number to see the current status.
        </p>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-3xl)' }}>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. 123456"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            style={{ flex: 1, height: '50px' }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '50px', padding: '0 var(--space-xl)' }}>
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {error && (
          <div style={{ padding: 'var(--space-lg)', background: 'rgba(255, 23, 68, 0.05)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', fontWeight: '600' }}>
            {error}
          </div>
        )}

        {order && (
          <div className="admin-order-card" style={{ padding: 'var(--space-xl)', textAlign: 'left', background: 'white', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-primary)' }}>#{order.order_number}</span>
              <span className={`status-badge status-${order.status}`} style={{ padding: '6px 16px' }}>{order.status}</span>
            </div>
            
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Customer Name</p>
              <p style={{ fontWeight: '700', fontSize: '1.1rem' }}>{order.customer_name}</p>
            </div>

            <div style={{ padding: 'var(--space-lg)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 'var(--space-sm)' }}>Operational Status</p>
              <p style={{ fontWeight: '800', fontSize: '1.2rem', color: 'var(--color-text-primary)' }}>
                {order.status === 'pending' && '🕒 Waiting for Store Approval'}
                {order.status === 'preparing' && '🍳 Kitchen is preparing your food'}
                {order.status === 'serving' && '📦 Ready for Pickup!'}
                {order.status === 'completed' && '✅ Enjoy your meal!'}
              </p>
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
                  padding: '12px'
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
          </div>
        )}
      </div>
    </div>
  );
}
