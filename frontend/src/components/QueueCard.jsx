export default function QueueCard({ order }) {
  return (
    <div className="queue-card" id={`queue-${order.order_number}`}>
      <div className="queue-card-header">
        <span className="queue-card-number">{order.order_number}</span>
        <span className="queue-card-name">{order.customer_name}</span>
      </div>
    </div>
  );
}
