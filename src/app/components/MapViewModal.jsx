// ─── MapViewModal ─────────────────────────────────────────────────────────────
import { X, MapPin } from 'lucide-react';

export function MapViewModal({ isOpen, onClose, products }) {
  if (!isOpen) return null;

  // Group products by location for the list view
  const byLocation = products.reduce((acc, p) => {
    const loc = p.location || 'Unknown Location';
    if (!acc[loc]) acc[loc] = [];
    acc[loc].push(p);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl text-gray-900 dark:text-white">Map View</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Map placeholder — integrate Google Maps or Leaflet here */}
        <div className="bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center h-64 flex-shrink-0">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-blue-400 mx-auto mb-2" />
            <p className="text-blue-600 dark:text-blue-400 text-sm">
              Map integration ready — add Google Maps or Leaflet
            </p>
            <p className="text-blue-500 dark:text-blue-500 text-xs mt-1">
              {products.length} products across {Object.keys(byLocation).length} locations
            </p>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          <h3 className="text-sm text-gray-700 dark:text-gray-300 mb-3">Products by Location</h3>
          {Object.entries(byLocation).map(([location, items]) => (
            <div key={location} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-red-500" />
                <span className="text-sm text-gray-900 dark:text-white">{location}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">({items.length})</span>
              </div>
              <div className="pl-6 space-y-1">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300 truncate">{item.productName}</span>
                    <span className="text-blue-600 ml-2 flex-shrink-0">{item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
