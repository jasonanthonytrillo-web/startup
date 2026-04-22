import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';

export default function Cart() {
  const { items, getTotal, clearCart } = useCart();
  const total = getTotal();

  if (items.length === 0) {
    return (
      <div className="cart-page" id="cart-page">
        <div className="container">
          <div className="cart-empty animate-fade-in-up">
            <div className="cart-empty-icon" style={{ display: 'none' }}></div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven&apos;t added anything yet.</p>
            <Link to="/menu" className="btn btn-primary">
              Browse Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page" id="cart-page">
      <div className="container">
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <Link to="/menu" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', textDecoration: 'none', fontWeight: '600' }}>
            ← Back to Menu
          </Link>
        </div>
        <div className="page-header animate-fade-in-up">
          <h1 className="page-title">Your Cart</h1>
          <p className="page-subtitle">
            Review your items before checkout
          </p>
        </div>

        <div className="cart-layout">
          <div className="cart-items">
            {items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
            <button
              className="btn btn-danger btn-sm"
              onClick={clearCart}
              style={{ alignSelf: 'flex-start' }}
              id="clear-cart-btn"
            >
              Clear Cart
            </button>
          </div>

          <div className="cart-summary glass-card animate-slide-in-right">
            <h3>Order Summary</h3>
            {items.map((item) => (
              <div key={item.id} className="summary-row">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>₱{(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            ))}
            <div className="summary-row total">
              <span>Total</span>
              <span>₱{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <Link
              to="/checkout"
              className="btn btn-primary btn-block btn-lg"
              style={{ marginTop: 'var(--space-lg)' }}
              id="proceed-checkout-btn"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
