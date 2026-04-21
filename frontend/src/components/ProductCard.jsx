import { useCart } from '../context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();

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
            {parseFloat(product.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          {product.stock > 0 ? (
            <button
              className="add-to-cart-btn"
              onClick={() => addToCart(product)}
              aria-label={`Add ${product.name} to cart`}
              id={`add-to-cart-${product.id}`}
            >
              +
            </button>
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
