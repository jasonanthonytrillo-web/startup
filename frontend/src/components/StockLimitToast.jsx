import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';

export default function StockLimitToast() {
  const { stockWarning, dismissStockWarning } = useCart();
  const [isExiting, setIsExiting] = useState(false);
  const [progressKey, setProgressKey] = useState(0);

  useEffect(() => {
    if (stockWarning) {
      setIsExiting(false);
      setProgressKey(stockWarning.key);

      // Start exit animation slightly before auto-dismiss
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
      }, 3000);

      return () => clearTimeout(exitTimer);
    }
  }, [stockWarning]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      dismissStockWarning();
    }, 350);
  };

  if (!stockWarning) return null;

  return (
    <div
      className={`stock-toast-container ${isExiting ? 'stock-toast-exit' : 'stock-toast-enter'}`}
      id="stock-limit-toast"
      role="alert"
      aria-live="assertive"
    >
      <div className="stock-toast">
        {/* Animated Icon */}
        <div className="stock-toast-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="2" />
            <line x1="12" y1="7" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16.5" r="1.2" fill="currentColor" />
          </svg>
        </div>

        {/* Message Content */}
        <div className="stock-toast-content">
          <p className="stock-toast-title">Stock Limit Reached</p>
          <p className="stock-toast-message">
            Sorry, you can't add more than <strong>{stockWarning.stock}</strong> of <strong>{stockWarning.productName}</strong>
          </p>
        </div>

        {/* Dismiss Button */}
        <button
          className="stock-toast-close"
          onClick={handleDismiss}
          aria-label="Dismiss notification"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Progress Bar */}
        <div className="stock-toast-progress" key={progressKey}>
          <div className="stock-toast-progress-bar" />
        </div>
      </div>
    </div>
  );
}
