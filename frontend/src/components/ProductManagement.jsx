import { useState, useEffect } from 'react';
import { getAdminProducts, createProduct, updateProduct, deleteProduct } from '../services/api';
import ProductFormModal from './ProductFormModal';

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await getAdminProducts();
      setProducts(response.data.data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await deleteProduct(id);
      loadProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product.');
    }
  };

  const handleSaveProduct = async (formData) => {
    if (selectedProduct) {
      await updateProduct(selectedProduct.id, formData);
    } else {
      await createProduct(formData);
    }
    loadProducts();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading products...</p>
      </div>
    );
  }

  return (
    <div className="product-management animate-fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>Products & Stocks</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Manage your menu items and inventory</p>
        </div>
        <button className="btn btn-primary" onClick={handleAddProduct}>
          + Add Product
        </button>
      </div>

      <div className="admin-orders">
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <thead style={{ backgroundColor: 'var(--color-surface-secondary)', textAlign: 'left' }}>
            <tr>
              <th style={{ padding: 'var(--space-md)', fontSize: '0.875rem' }}>Product</th>
              <th style={{ padding: 'var(--space-md)', fontSize: '0.875rem' }}>Category</th>
              <th style={{ padding: 'var(--space-md)', fontSize: '0.875rem' }}>Price</th>
              <th style={{ padding: 'var(--space-md)', fontSize: '0.875rem' }}>Stock</th>
              <th style={{ padding: 'var(--space-md)', fontSize: '0.875rem' }}>Status</th>
              <th style={{ padding: 'var(--space-md)', fontSize: '0.875rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 'var(--space-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <img 
                      src={product.image || `https://placehold.co/40x40?text=${encodeURIComponent(product.name)}`} 
                      alt="" 
                      style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                      onError={(e) => { e.target.src = `https://placehold.co/40x40?text=${encodeURIComponent(product.name)}`; }}
                    />
                    <span style={{ fontWeight: '600' }}>{product.name}</span>
                  </div>
                </td>
                <td style={{ padding: 'var(--space-md)' }}>{product.category}</td>
                <td style={{ padding: 'var(--space-md)' }}>₱{parseFloat(product.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style={{ padding: 'var(--space-md)' }}>
                  <span style={{ 
                    fontWeight: '700', 
                    color: product.stock <= 5 ? 'var(--color-danger)' : 'inherit' 
                  }}>
                    {product.stock}
                  </span>
                </td>
                <td style={{ padding: 'var(--space-md)' }}>
                  <span className={`status-badge ${product.available && product.stock > 0 ? 'completed' : 'cancelled'}`} style={{ fontSize: '0.75rem' }}>
                    {product.available && product.stock > 0 ? 'In Stock' : 'Unavailable'}
                  </span>
                </td>
                <td style={{ padding: 'var(--space-md)' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                    <button className="btn btn-sm btn-secondary" onClick={() => handleEditProduct(product)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteProduct(product.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--color-text-muted)' }}>
            No products found.
          </div>
        )}
      </div>

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSaveProduct}
        product={selectedProduct}
      />
    </div>
  );
}
