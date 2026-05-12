import { useState } from 'react';
import { X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createProduct, uploadImage } from '../../lib/api';

const CATEGORIES = [
  'Clothes', 'Food', 'Raw Ingredients', 'Electronics', 'Furniture',
  'Construction Materials', 'Agriculture', 'Packaging', 'Other',
];

export function CreateProductModal({ isOpen, onClose, onCreated }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    productName: '', category: '', price: '',
    location: '', contactNumber: '', description: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  }

  function handleChange(e) {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.productName || !formData.category) {
      setError('Product name and category are required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      let imageUrl = '';
      if (imageFile) {
        imageUrl = await uploadImage(imageFile, 'products');
      }

      const product = await createProduct(user.id, {
        ...formData,
        imageUrl,
      });

      // Reset
      setFormData({ productName: '', category: '', price: '', location: '', contactNumber: '', description: '' });
      setImageFile(null);
      setImagePreview('');
      onClose();
      if (onCreated) onCreated(product);
    } catch (err) {
      setError(err.message || 'Failed to create listing.');
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl text-gray-900 dark:text-white">Create Product Listing</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Image Upload */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Product Image</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(''); }}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload product image</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">PNG, JPG, WEBP up to 10MB</p>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Fields */}
          <div>
            <label htmlFor="productName" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              Product Name *
            </label>
            <input
              id="productName" name="productName" type="text" required
              value={formData.productName} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Industrial Steel Beams"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              Category *
            </label>
            <select
              id="category" name="category" required
              value={formData.category} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a category</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                Price ($)
              </label>
              <input
                id="price" name="price" type="number" step="0.01" min="0"
                value={formData.price} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label htmlFor="contactNumber" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                Contact Number
              </label>
              <input
                id="contactNumber" name="contactNumber" type="tel"
                value={formData.contactNumber} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              Location
            </label>
            <input
              id="location" name="location" type="text"
              value={formData.location} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="City, State"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description" name="description" rows={4}
              value={formData.description} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe your product..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Posting...
                </>
              ) : 'Post Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
