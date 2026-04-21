import { useState, useEffect, useRef } from 'react';

export default function ProductFormModal({ isOpen, onClose, onSuccess, product = null, existingCategories = [] }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: 0,
    image: '',
    available: true
  });
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [categorySelect, setCategorySelect] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        category: product.category || '',
        stock: product.stock || 0,
        image: product.image || '',
        available: product.available ?? true
      });
      setImagePreview(product.image || '');

      if (existingCategories.includes(product.category)) {
        setCategorySelect(product.category);
        setIsNewCategory(false);
      } else {
        setCategorySelect('__new__');
        setIsNewCategory(true);
      }
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: 0,
        image: '',
        available: true
      });
      setImagePreview('');
      setCategorySelect('');
      setIsNewCategory(false);
    }
  }, [product, isOpen]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleCategoryChange = (value) => {
    setCategorySelect(value);
    if (value === '__new__') {
      setIsNewCategory(true);
      setFormData(prev => ({ ...prev, category: '' }));
    } else {
      setIsNewCategory(false);
      setFormData(prev => ({ ...prev, category: value }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      setFormData(prev => ({ ...prev, image: base64 }));
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category.trim()) {
      alert('Please select or enter a category.');
      return;
    }
    setLoading(true);
    try {
      await onSuccess(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product. Please check your input.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h2 className="modal-title">{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', maxHeight: '65vh', overflowY: 'auto' }}>
            <div className="form-group">
              <label className="form-label">Product Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g. Mocha Latte"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-input"
                value={categorySelect}
                onChange={(e) => handleCategoryChange(e.target.value)}
                required={!isNewCategory}
                style={{ cursor: 'pointer' }}
              >
                <option value="" disabled>Select a category</option>
                {existingCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="__new__">＋ New Category...</option>
              </select>
            </div>

            {isNewCategory && (
              <div className="form-group" style={{ animation: 'fadeInUp 0.25s ease' }}>
                <label className="form-label">New Category Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  placeholder="e.g. Desserts, Snacks..."
                  autoFocus
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  This will create a new menu category.
                </p>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Price (₱)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Stock Level</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  required
                  min="0"
                />
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: 'var(--space-xs)', paddingBottom: 'var(--space-xs)' }}>
              <label className="form-checkbox" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer', fontWeight: '600' }}>
                <input
                  type="checkbox"
                  checked={formData.available}
                  onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                />
                Available for Order
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="2"
                placeholder="Product description..."
              ></textarea>
            </div>

            <div className="form-group">
              <label className="form-label">Product Image</label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                id="product-image-upload"
              />

              {imagePreview ? (
                <div className="image-upload-preview">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="image-preview-img"
                  />
                  <div className="image-preview-actions">
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change Image
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={removeImage}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="image-upload-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="image-upload-icon">📷</div>
                  <p className="image-upload-text">Click to choose an image</p>
                  <p className="image-upload-hint">JPG, PNG or WebP • Max 2MB</p>
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-md)', paddingBottom: 'var(--space-md)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
