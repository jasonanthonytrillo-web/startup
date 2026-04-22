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

  // Let the body scroll normally if needed
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

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
      <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        <form onSubmit={handleSubmit} style={{ margin: 0 }}>
          <div className="modal-header">
            <h2 className="modal-title">{product ? 'Edit Product' : 'Add New Product'}</h2>
            <button type="button" className="btn-close" onClick={onClose}>&times;</button>
          </div>
          <div className="modal-body">
            <div className="form-row">
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

            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ height: '120px', resize: 'none' }}
                  placeholder="Product description..."
                ></textarea>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
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
                  <div className="image-upload-preview" style={{ height: '120px' }}>
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
                        Change
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
                    style={{ padding: 'var(--space-md)', height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
                  >
                    <div className="image-upload-icon" style={{ fontSize: '1.2rem' }}>📷</div>
                    <p className="image-upload-text" style={{ fontSize: '0.75rem' }}>Click to choose</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="modal-footer">
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
