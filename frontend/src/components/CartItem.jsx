import { useCart } from '../context/CartContext';

export default function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart();

  const imageUrl = item.image
    ? item.image
    : `https://placehold.co/200x200/f8fafc/ff6b35?text=${encodeURIComponent(item.name)}`;

  return (
    <div className="cart-item animate-fade-in" id={`cart-item-${item.id}`}>
      <img
        src={imageUrl}
        alt={item.name}
        className="cart-item-image"
        onError={(e) => {
          e.target.src = `https://placehold.co/200x200/f8fafc/ff6b35?text=${encodeURIComponent(item.name)}`;
        }}
      />
      <div className="cart-item-info">
        <h4 className="cart-item-name">{item.name}</h4>
        <span className="cart-item-price">₱{parseFloat(item.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      <div className="cart-item-controls">
        <div className="quantity-control">
          <button
            className="quantity-btn"
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="quantity-value">{item.quantity}</span>
          <button
            className="quantity-btn"
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <button
          className="remove-btn"
          onClick={() => removeFromCart(item.id)}
          aria-label="Remove item"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
