// ─── ProductDetailsModal ───────────────────────────────────────────────────────
import { X, MapPin, Building2, Phone, Clock, Tag, Send } from 'lucide-react';
import { timeAgo } from '../utils/timeAgo';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { getOrCreateConversation } from '../../lib/api';

export function ProductDetailsModal({ isOpen, onClose, product }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  async function handleContact() {
    if (!product?.userId || product.userId === user?.id) return;
    try {
      const conv = await getOrCreateConversation(user.id, product.userId, {
        productName: product.productName,
      });
      onClose();
      navigate('/messages');
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  }

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl text-gray-900 dark:text-white line-clamp-1">{product.productName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0 ml-4">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div>
          {product.image && (
            <img
              src={product.image}
              alt={product.productName}
              className="w-full h-64 object-cover"
              onError={e => { e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop'; }}
            />
          )}

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              {product.type === 'request' ? (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Budget</p>
                  <p className="text-3xl text-purple-600">{product.budget}</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Price</p>
                  <p className="text-3xl text-blue-600">{product.price}</p>
                </div>
              )}
              {product.category && (
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {product.category}
                </span>
              )}
            </div>

            <div className="space-y-3">
              {(product.companyName || product.supplierName || product.businessName) && (
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-gray-900 dark:text-white">{product.companyName || product.businessName}</p>
                    {product.supplierName && product.companyName && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">by {product.supplierName}</p>
                    )}
                  </div>
                </div>
              )}

              {product.location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">{product.location}</span>
                </div>
              )}

              {product.contactNumber && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">{product.contactNumber}</span>
                </div>
              )}

              {product.postedAt && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-500 dark:text-gray-400">
                    Posted {timeAgo(product.postedAt instanceof Date ? product.postedAt : new Date(product.postedAt))}
                  </span>
                </div>
              )}
            </div>

            {product.description && (
              <div>
                <h3 className="text-sm text-gray-700 dark:text-gray-300 mb-2">Description</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {product.type === 'request' && product.quantity && (
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="text-gray-900 dark:text-white">Quantity needed:</span> {product.quantity} units
                </p>
                {product.deadline && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <span className="text-gray-900 dark:text-white">Deadline:</span> {product.deadline}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Close
              </button>
              {product.userId && product.userId !== user?.id && (
                <button
                  onClick={handleContact}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {product.type === 'request' ? 'Submit Offer' : 'Contact Seller'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
