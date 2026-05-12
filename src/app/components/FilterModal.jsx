import { X, SlidersHorizontal } from 'lucide-react';

const CATEGORIES = [
  'all', 'Clothes', 'Food', 'Raw Ingredients', 'Electronics',
  'Furniture', 'Construction Materials', 'Agriculture', 'Packaging',
];

export function FilterModal({ 
  isOpen, onClose, 
  selectedCategory, onCategoryChange, 
  sortBy, onSortChange,
  listingType = 'all', onTypeChange
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-t-xl sm:rounded-xl shadow-xl w-full sm:max-w-md">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg text-gray-900 dark:text-white">Filters</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {onTypeChange && (
            <div>
              <h3 className="text-sm text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide font-semibold">Listing Type</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'All Listings' },
                  { value: 'product', label: 'Products' },
                  { value: 'request', label: 'Requests' },
                ].map(type => (
                  <button
                    key={type.value}
                    onClick={() => onTypeChange(type.value)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      listingType === type.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide font-semibold">Category</h3>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => onCategoryChange(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {cat === 'all' ? 'All Categories' : cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Sort By</h3>
            <div className="space-y-2">
              {[
                { value: 'recent', label: 'Most Recent' },
                { value: 'price-low', label: 'Price: Low to High' },
                { value: 'price-high', label: 'Price: High to Low' },
              ].map(option => (
                <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="sortBy"
                    value={option.value}
                    checked={sortBy === option.value}
                    onChange={() => onSortChange(option.value)}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
