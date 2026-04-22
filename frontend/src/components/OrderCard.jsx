import { useState } from 'react';
import CancelOrderModal from './CancelOrderModal';

export default function OrderCard({ order, onUpdateStatus, onViewDetails }) {
  const [showCancelModal, setShowCancelModal] = useState(false);

  const statusFlow = {
    pending: 'preparing',
    preparing: 'serving',
    serving: 'completed',
  };

  const nextStatus = statusFlow[order.status];

  const statusLabels = {
    pending: 'Accept Order (Cash)',
    preparing: 'Mark as Serving',
    serving: 'Mark as Completed',
  };

  const btnClass = {
    pending: 'btn btn-sm btn-primary',
    preparing: 'btn btn-sm btn-warning',
    serving: 'btn btn-sm btn-success',
  };

  // Check if order is stale (preparing for > 30 mins)
  const isStale = order.status === 'preparing' && order.accepted_at && (
    (new Date() - new Date(order.accepted_at)) > 30 * 60 * 1000
  );

  const isTerminal = ['completed', 'cancelled'].includes(order.status);

  return (
    <>
      <div className={`admin-order-card ${isStale ? 'stale' : ''}`} id={`admin-order-${order.id}`}>
        <div className="admin-order-header">
          <span className="admin-order-number">
            {order.order_number}
            {isStale && <span className="stale-badge">Delayed</span>}
            {isTerminal && <span style={{ marginLeft: 'var(--space-sm)', opacity: 0.5, fontSize: '0.9rem' }}>🔒</span>}
          </span>
          {order.accepted_at && (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: 'auto', marginRight: 'var(--space-sm)' }}>
              Received at {new Date(order.accepted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <span className={`status-badge status-${order.status}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>
        <div className="admin-order-info" style={{ padding: '0 var(--space-xl)', marginBottom: 'var(--space-md)' }}>
          <span style={{ fontWeight: '700', fontSize: '1rem' }}>{order.customer_name}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>{order.payment_method.toUpperCase()}</span>
            <span style={{ color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 'bold' }}>
              {order.order_type === 'dine_in' ? 'DINE IN' : 'TAKE OUT'}
            </span>
          </div>
          <span style={{ fontWeight: '800', color: 'var(--color-primary)' }}>₱{parseFloat(order.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>

        <div className="status-stepper">
          {['pending', 'preparing', 'serving', 'completed'].map((s, i) => {
            const statuses = ['pending', 'preparing', 'serving', 'completed'];
            const currentIndex = statuses.indexOf(order.status);
            const stepIndex = i;
            
            let stateClass = '';
            if (order.status === s) stateClass = 'active';
            else if (currentIndex > stepIndex) stateClass = 'completed';

            return (
              <div 
                key={s} 
                className={`step ${stateClass}`}
                onClick={() => !isTerminal && onUpdateStatus(order.id, s)}
                style={{ cursor: isTerminal ? 'default' : 'pointer' }}
                title={isTerminal ? 'Finalized' : `Move to ${s}`}
              >
                <div className="step-dot"></div>
                <span className="step-label">{s}</span>
              </div>
            );
          })}
        </div>

        <div className="admin-order-actions" style={{ 
          padding: 'var(--space-md) var(--space-xl)', 
          background: 'var(--color-bg-secondary)', 
          borderTop: '1px solid var(--color-border)', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between' 
        }}>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => onViewDetails(order)}
            style={{ padding: 'var(--space-xs) var(--space-lg)', borderRadius: 'var(--radius-full)', fontWeight: '700' }}
          >
            Order Details
          </button>
          
          {isTerminal ? (
            <button
              className="btn btn-sm btn-outline"
              onClick={() => onUpdateStatus(order.id, 'preparing')}
              style={{ 
                color: 'var(--color-primary)', 
                borderColor: 'var(--color-primary)', 
                padding: 'var(--space-xs) var(--space-md)', 
                borderRadius: 'var(--radius-full)',
                background: 'transparent',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              🔓 Manager Unlock
            </button>
          ) : (
            <button
              className="btn-cancel"
              onClick={() => setShowCancelModal(true)}
              id={`cancel-order-${order.id}`}
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      <CancelOrderModal
        isOpen={showCancelModal}
        order={order}
        onClose={() => setShowCancelModal(false)}
        onConfirm={onUpdateStatus}
      />
    </>
  );
}
