import { useState, useEffect } from 'react';
import { getProducts } from '../services/api';
import ProductCard from '../components/ProductCard';

export default function Menu() {
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await getProducts();
      setProducts(response.data.data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
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
        <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>

          <p style={{ color: 'var(--color-text-secondary)' }}>Loading menu...</p>
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
