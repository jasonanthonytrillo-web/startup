export default function OrderDetailsModal({ order, onClose }) {
  if (!order) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Order Details</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              {order.order_number} • {order.customer_name}
            </span>
          </div>
          <button className="btn-close" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
            <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>
                <strong>Status:</strong> <span className={`status-badge status-${order.status}`} style={{ display: 'inline-block', transform: 'scale(0.85)', transformOrigin: 'left' }}>{order.status}</span>
              </div>
              <div>
                <strong>Type:</strong> <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{order.order_type === 'dine_in' ? 'DINE IN' : 'TAKE OUT'}</span>
              </div>
            </div>
            <div style={{ fontSize: '0.9rem', textAlign: 'right' }}>
              <strong>Payment:</strong> {order.payment_method.toUpperCase()}
            </div>
          </div>

          <table className="order-details-table">
            <thead>
              <tr>
                <th>Item</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Price</th>
                <th style={{ textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items && order.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.product?.name || 'Unknown Item'}</td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>₱{parseFloat(item.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style={{ textAlign: 'right' }}>₱{(item.quantity * item.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="order-details-summary">
            <div className="summary-row">
              <span>Items Total</span>
              <span>₱{parseFloat(order.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="summary-row total">
              <span>Grand Total</span>
              <span>₱{parseFloat(order.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          {order.accepted_at && (
            <div style={{ marginTop: 'var(--space-xl)', fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center', background: 'var(--color-bg-secondary)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
              Order was received and finalized at {new Date(order.accepted_at).toLocaleString()}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
