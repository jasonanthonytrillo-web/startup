import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrder } from '../services/api';
import html2canvas from 'html2canvas';

export default function OrderConfirmation() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const receiptRef = useRef(null);

  useEffect(() => {
    loadOrder();
  }, [orderNumber]);

  const loadOrder = async () => {
    try {
      const response = await getOrder(orderNumber);
      setOrder(response.data.data);
    } catch (error) {
      console.error('Failed to load order:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#f8fafc',
      });
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Receipt-${order.order_number}.png`;
      link.click();
    } catch (err) {
      console.error('Failed to download image:', err);
      alert('Failed to generate image receipt.');
    }
  };

  const downloadText = () => {
    if (!order) return;
    let text = `MK FOOD CORNER - RECEIPT\n`;
    text += `========================\n`;
    text += `Order No: ${order.order_number}\n`;
    text += `Type: ${order.order_type === 'dine_in' ? 'DINE IN' : 'TAKE OUT'}\n`;
    text += `Status: ${order.status.toUpperCase()}\n`;
    text += `Payment: ${order.payment_method.toUpperCase()}\n`;
    text += `Customer: ${order.customer_name}\n`;
    text += `------------------------\n`;
    order.items?.forEach(item => {
      text += `${item.quantity}x ${item.product?.name} - P${(item.price * item.quantity).toFixed(2)}\n`;
    });
    text += `------------------------\n`;
    text += `TOTAL: P${parseFloat(order.total).toFixed(2)}\n`;
    text += `========================\n`;
    text += `Kindly present this receipt to the cashier.`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `Receipt-${order.order_number}.txt`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
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
        <div className="confirmation-card animate-fade-in-up" ref={receiptRef}>
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
        
        <div className="confirmation-actions" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <button className="btn btn-secondary" onClick={downloadImage} style={{flex: 1}}>
            Save as Image
          </button>
          <button className="btn btn-secondary" onClick={downloadText} style={{flex: 1}}>
            Save as Text
          </button>
        </div>

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
