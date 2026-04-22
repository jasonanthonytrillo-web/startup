import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/api';

const orderTypes = [
  { id: 'dine_in', label: 'Dine In' },
  { id: 'take_out', label: 'Take Out' },
];

const paymentCategories = [
  { id: 'cash', label: 'Cash' },
  { id: 'cashless', label: 'Cashless' },
];

const cashlessMethods = [
  { id: 'gcash', label: 'GCash' },
  { id: 'maya', label: 'Maya' },
];

export default function Checkout() {
  const { items, getTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [paymentCategory, setPaymentCategory] = useState('cash');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [orderType, setOrderType] = useState('dine_in');

  const handleCategorySelect = (categoryId) => {
    // If clicking the already selected category, unselect everything
    if (paymentCategory === categoryId) {
      setPaymentCategory('');
      setPaymentMethod('');
      return;
    }

    setPaymentCategory(categoryId);
    if (categoryId === 'cash') {
      setPaymentMethod('cash');
    } else {
      setPaymentMethod(''); // Require user to click a specific cashless option
    }
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);

  const total = getTotal();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    if (!paymentMethod) {
      setError('Please select a valid payment method.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const orderData = {
        customer_name: customerName.trim() || 'Guest',
        order_type: orderType,
        payment_method: paymentMethod,
        items: items.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
      };

      const response = await createOrder(orderData);
      const order = response.data.data;

      // Save last order number so customer can retrieve receipt if they close the page
      localStorage.setItem('last_order_number', order.order_number);

      setOrderSuccess(true);
      clearCart();
      navigate(`/order/${order.order_number}`);
    } catch (err) {
      console.error('Order failed:', err);
      setError(
        err.response?.data?.message ||
        'Failed to place order. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (items.length === 0 && !isSubmitting && !orderSuccess) {
      navigate('/menu');
    }
  }, [items.length, isSubmitting, orderSuccess, navigate]);

  if (items.length === 0 && !orderSuccess) {
    return null;
  }
  return (
    <div className="checkout-page" id="checkout-page">
      <div className="container">
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <Link to="/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', textDecoration: 'none', fontWeight: '600' }}>
            ← Back to Cart
          </Link>
        </div>
        <div className="page-header animate-fade-in-up">
          <h1 className="page-title">Checkout</h1>
          <p className="page-subtitle">
            Almost there — just a few details!
          </p>
        </div>

        <form
          className="checkout-form glass-card animate-fade-in-up delay-1"
          onSubmit={handleSubmit}
          style={{ padding: 'var(--space-xl)' }}
        >
          {error && (
            <div
              style={{
                background: 'var(--color-danger-bg)',
                border: '1px solid rgba(255, 23, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-md)',
                color: 'var(--color-danger)',
                fontSize: '0.9rem',
              }}
            >
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="customer-name">
              Your Name (Optional)
            </label>
            <input
              type="text"
              id="customer-name"
              className="form-input"
              placeholder="Enter your name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group" style={{ textAlign: 'center' }}>
            <label className="form-label" style={{ display: 'block', textAlign: 'center' }}>Order Type</label>
            <div className="payment-methods" style={{ justifyContent: 'center' }}>
              {orderTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  className={`payment-option ${orderType === type.id ? 'selected' : ''}`}
                  onClick={() => setOrderType(type.id)}
                  id={`order-type-${type.id}`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ textAlign: 'center' }}>
            <label className="form-label" style={{ display: 'block', textAlign: 'center' }}>Payment Method</label>
            <div className="payment-methods" style={{ justifyContent: 'center' }}>
              {paymentCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`payment-option ${paymentCategory === category.id ? 'selected' : ''}`}
                  onClick={() => handleCategorySelect(category.id)}
                  id={`payment-category-${category.id}`}
                >
                  {category.label}
                </button>
              ))}
            </div>

            {paymentCategory === 'cashless' && (
              <div className="payment-methods" style={{ marginTop: 'var(--space-md)', justifyContent: 'center' }}>
                {cashlessMethods.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    className={`payment-option ${paymentMethod === method.id ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod(method.id)}
                    id={`payment-${method.id}`}
                    style={{ padding: 'var(--space-sm) var(--space-md)', fontSize: '0.9rem' }}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-lg)' }}>
            <div className="summary-row">
              <span>Items ({items.length})</span>
              <span>₱{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>₱{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={isSubmitting}
            id="place-order-btn"
          >
            {isSubmitting ? 'Placing Order...' : 'Place Order'}
          </button>
        </form>
      </div>
    </div>
  );
}
