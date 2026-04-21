import { useState, useEffect } from 'react';

export default function CancelOrderModal({ isOpen, order, onClose, onConfirm }) {
  const [isClosing, setIsClosing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setConfirmed(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 250);
  };

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => {
      onConfirm(order.id, 'cancelled');
      setIsClosing(true);
      setTimeout(() => {
        onClose();
        setIsClosing(false);
        setConfirmed(false);
      }, 250);
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`modal-overlay cancel-modal-overlay ${isClosing ? 'closing' : ''}`}
      style={{ zIndex: 3000 }}
      onClick={handleClose}
    >
      <div
        className={`cancel-modal ${isClosing ? 'closing' : ''} ${confirmed ? 'confirmed' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Warning Icon */}
        <div className="cancel-modal-icon-wrapper">
          <div className={`cancel-modal-icon ${confirmed ? 'icon-success' : ''}`}>
            {confirmed ? (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" className="checkmark-path" />
              </svg>
            ) : (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            )}
          </div>
        </div>

        {/* Title */}
        <h2 className="cancel-modal-title">
          {confirmed ? 'Order Cancelled' : 'Cancel Order?'}
        </h2>

        {/* Subtitle */}
        <p className="cancel-modal-subtitle">
          {confirmed
            ? 'This order has been cancelled successfully.'
            : 'This action cannot be easily undone. The customer will need to place a new order.'}
        </p>

        {/* Order Info Summary */}
        {order && !confirmed && (
          <div className="cancel-modal-order-info">
            <div className="cancel-modal-info-row">
              <span className="cancel-modal-info-label">Order</span>
              <span className="cancel-modal-info-value highlight">{order.order_number}</span>
            </div>
            <div className="cancel-modal-info-row">
              <span className="cancel-modal-info-label">Customer</span>
              <span className="cancel-modal-info-value">{order.customer_name}</span>
            </div>
            <div className="cancel-modal-info-row">
              <span className="cancel-modal-info-label">Total</span>
              <span className="cancel-modal-info-value">₱{parseFloat(order.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="cancel-modal-info-row">
              <span className="cancel-modal-info-label">Items</span>
              <span className="cancel-modal-info-value">{order.items?.length || 0} item(s)</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!confirmed && (
          <div className="cancel-modal-actions">
            <button
              className="cancel-modal-btn cancel-modal-btn-back"
              onClick={handleClose}
            >
              Go Back
            </button>
            <button
              className="cancel-modal-btn cancel-modal-btn-confirm"
              onClick={handleConfirm}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              Yes, Cancel Order
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
