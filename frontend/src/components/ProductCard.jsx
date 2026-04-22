import { useState } from 'react';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    setIsAdding(true);
    addToCart(product);
    
    // Trigger a light haptic feedback on mobile if supported
    if ('vibrate' in navigator) navigator.vibrate(20);
    
    setTimeout(() => setIsAdding(false), 300);
  };

  const imageUrl = product.image
    ? product.image
    : `https://placehold.co/400x300/f8fafc/ff6b35?text=${encodeURIComponent(product.name)}`;

  return (
    <div className="product-card animate-fade-in-up" id={`product-${product.id}`}>
      <img
        src={imageUrl}
        alt={product.name}
        className="product-card-image"
        loading="lazy"
        onError={(e) => {
          e.target.src = `https://placehold.co/400x300/f8fafc/ff6b35?text=${encodeURIComponent(product.name)}`;
        }}
      />
      <div className="product-card-body">
        <span className="product-card-category">{product.category}</span>
        <h3 className="product-card-name">{product.name}</h3>
        <p className="product-card-desc">{product.description}</p>
        <div className="product-card-footer">
          <span className="product-card-price">
            ₱{parseFloat(product.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          {product.stock > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              {product.stock <= 10 && (
                <span className="low-stock-badge" style={{ 
                  fontSize: '0.7rem', 
                  color: 'white', 
                  background: 'var(--color-danger)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: '700'
                }}>
                  {product.stock} LEFT
                </span>
              )}
              <button
                className={`add-to-cart-btn ${isAdding ? 'adding' : ''}`}
                onClick={handleAdd}
                aria-label={`Add ${product.name} to cart`}
                id={`add-to-cart-${product.id}`}
                style={{
                  transform: isAdding ? 'scale(1.3)' : 'scale(1)',
                  transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  backgroundColor: isAdding ? 'var(--color-success)' : 'var(--color-primary)',
                  boxShadow: isAdding ? '0 0 15px var(--color-success)' : 'none'
                }}
              >
                {isAdding ? '✓' : '+'}
              </button>
            </div>
          ) : (
            <span className="out-of-stock-label" style={{ 
              color: 'var(--color-danger)', 
              fontSize: '0.75rem', 
              fontWeight: '700',
              textTransform: 'uppercase'
            }}>
              Out of Stock
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
