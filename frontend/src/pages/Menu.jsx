import { useState, useEffect, useRef } from 'react';
import { getProducts } from '../services/api';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';

export default function Menu() {
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const { syncStock } = useCart();
  const pollingRef = useRef(null);

  useEffect(() => {
    loadProducts();

    // Poll for stock updates every 15 seconds
    pollingRef.current = setInterval(() => {
      fetchAndCacheProducts(false);
    }, 15000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const loadProducts = async () => {
    // Try to load from session cache first for instant navigation
    const cachedData = sessionStorage.getItem('cached_menu_data');
    if (cachedData) {
      try {
        setProducts(JSON.parse(cachedData));
        setLoading(false);
        // Refresh cache in the background (optional, but keeps data fresh)
        fetchAndCacheProducts(false);
        return;
      } catch (e) {
        sessionStorage.removeItem('cached_menu_data');
      }
    }
    
    await fetchAndCacheProducts(true);
  };

  const fetchAndCacheProducts = async (shouldSetLoading) => {
    try {
      const response = await getProducts();
      const productData = response.data.data;
      setProducts(productData);
      sessionStorage.setItem('cached_menu_data', JSON.stringify(productData));

      // Sync latest stock values to cart items
      const allProducts = Object.values(productData).flat();
      syncStock(allProducts);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      if (shouldSetLoading) setLoading(false);
    }
  };

  const categories = ['All', ...Object.keys(products)];

  const getFilteredProducts = () => {
    if (activeCategory === 'All') {
      return Object.entries(products);
    }
    return Object.entries(products).filter(
      ([category]) => category === activeCategory
    );
  };

  if (loading) {
    return (
      <div className="menu-page">
        <div className="container">
          <div className="page-header animate-pulse">
            <div style={{ height: '2.5rem', width: '200px', backgroundColor: 'var(--color-bg-glass)', borderRadius: 'var(--radius-md)', margin: '0 auto var(--space-md)' }}></div>
            <div style={{ height: '1.2rem', width: '300px', backgroundColor: 'var(--color-bg-glass)', borderRadius: 'var(--radius-sm)', margin: '0 auto' }}></div>
          </div>

          {[1, 2].map((i) => (
            <div key={i} className="category-section">
              <div style={{ height: '2rem', width: '150px', backgroundColor: 'var(--color-bg-glass)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-lg)' }} className="animate-pulse"></div>
              <div className="products-grid">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="product-card skeleton" style={{ height: '350px', backgroundColor: 'var(--color-bg-glass)', borderRadius: 'var(--radius-lg)' }}>
                    <div className="animate-pulse" style={{ height: '100%', width: '100%' }}></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="menu-page" id="menu-page">
      <div className="container">
        <div className="page-header animate-fade-in-up">
          <h1 className="page-title">Our Menu</h1>
          <p className="page-subtitle">
            Handcrafted with love — pick your favorites!
          </p>
        </div>

        <div className="category-tabs animate-fade-in-up delay-1">
          {categories.map((category) => (
            <button
              key={category}
              className={`category-tab ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
              id={`tab-${category.toLowerCase()}`}
            >
              {category}
            </button>
          ))}
        </div>

        {getFilteredProducts().map(([category, items]) => (
          <div key={category} className="category-section">
            <h2 className="category-title animate-fade-in-up">
              {category}
            </h2>
            <div className="products-grid">
              {items.map((product, index) => (
                <div
                  key={product.id}
                  className={`animate-fade-in-up delay-${Math.min(index + 1, 5)}`}
                  style={{ animationFillMode: 'forwards' }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
