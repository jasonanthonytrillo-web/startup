export default function QueueCard({ order }) {
  return (
    <div className="queue-card" id={`queue-${order.order_number}`}>
      <div className="queue-card-header">
        <span className="queue-card-number">{order.order_number}</span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
          <span className="queue-card-name">{order.customer_name}</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
            {order.order_type === 'dine_in' ? 'DINE IN' : 'TAKE OUT'}
          </span>
        </div>
      </div>
      <div className="queue-card-items">
        {order.items && order.items.map((item, index) => (
          <span key={item.id || index}>
            {item.quantity}x {item.product?.name || 'Item'}
            {index < order.items.length - 1 ? ' • ' : ''}
          </span>
        ))}
      </div>
    </div>
  );
}
