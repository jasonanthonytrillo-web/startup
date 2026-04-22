import { useState, useEffect } from 'react';

export default function CustomerCancelModal({ isOpen, onClose, onConfirm, orderNumber }) {
  const [isClosing, setIsClosing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setIsProcessing(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (isProcessing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 250);
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    await onConfirm();
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setIsProcessing(false);
    }, 250);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`modal-overlay ${isClosing ? 'closing' : ''}`}
      style={{ zIndex: 9999, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={handleClose}
    >
      <div
        className={`modal-content ${isClosing ? 'closing' : ''}`}
        style={{ 
          maxWidth: '400px', 
          textAlign: 'center', 
          padding: 'var(--space-2xl) var(--space-xl)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ 
          width: '80px', 
          height: '80px', 
          background: 'rgba(239, 68, 68, 0.1)', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto var(--space-xl)',
          animation: 'pulse-red 2s infinite'
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>

        <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: 'var(--space-sm)', color: 'white' }}>
          Change your mind?
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6', marginBottom: 'var(--space-2xl)' }}>
          Are you sure you want to cancel order <strong style={{ color: 'var(--color-primary)' }}>#{orderNumber}</strong>? 
          <br/>This will release your items for other customers.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <button 
            className="btn btn-primary btn-lg" 
            onClick={handleClose}
            disabled={isProcessing}
            style={{ width: '100%', padding: 'var(--space-md)' }}
          >
            No, Keep My Order
          </button>
          
          <button 
            className="btn btn-secondary" 
            onClick={handleConfirm}
            disabled={isProcessing}
            style={{ 
              width: '100%', 
              background: 'transparent', 
              color: '#ef4444', 
              borderColor: 'rgba(239, 68, 68, 0.2)',
              padding: 'var(--space-md)'
            }}
          >
            {isProcessing ? 'Cancelling...' : 'Yes, Cancel Order'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
}
