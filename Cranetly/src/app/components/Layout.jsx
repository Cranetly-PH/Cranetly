import { Outlet, Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Home, LayoutDashboard, Package, Menu, X,
  TrendingUp, Moon, Sun, MessageCircle, ShoppingBag, ShoppingCart, Languages
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Chatbot } from './Chatbot';
import { CreateProductModal } from './CreateProductModal';
import { SearchButton } from './SearchButton';
import { ProfileDropdown } from './ProfileDropdown';
import { FilterModal } from './FilterModal';
import { OrdersModal } from './OrdersModal';

export function Layout() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showOrders, setShowOrders] = useState(false);

  function handleSearch(searchQuery, category) {
    navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}&category=${category}`);
  }

  const navigationItems = useMemo(() => {
    const baseItems = [
      { name: 'Home', path: '/home', icon: Home },
      { name: 'Marketplace', path: '/marketplace', icon: ShoppingBag },
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Messages', path: '/messages', icon: MessageCircle },
    ];

    // Show Inventory and Companies if we are still loading role (type === null)
    // or if we are confirmed business/supplier.
    // Only hide if we are confirmed 'guest'.
    if (user && user.type !== 'guest') {
      baseItems.splice(3, 0, { name: 'Companies', path: '/companies', icon: TrendingUp });
      baseItems.splice(4, 0, { name: 'Inventory', path: '/inventory', icon: Package });
    }

    return baseItems;
  }, [user]);

  function isActive(path) {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo + Nav */}
            <div className="flex">
              <Link
                to="/home"
                className="flex-shrink-0 flex items-center hover:opacity-80 transition-opacity"
              >
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl text-gray-900 dark:text-white hidden sm:block">EconoConnect</span>
              </Link>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
                {navigationItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-3 pt-1 text-sm transition-colors rounded-md my-3 ${
                      isActive(item.path)
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Controls */}
            <div className="hidden sm:flex sm:items-center gap-1">
              <SearchButton onSearch={handleSearch} selectedCategory={selectedCategory} />

              <button
                onClick={() => setShowOrders(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors relative"
                title="Orders"
              >
                <ShoppingCart className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>

              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title="Toggle theme"
              >
                {isDark
                  ? <Sun className="h-5 w-5 text-gray-300" />
                  : <Moon className="h-5 w-5 text-gray-700" />
                }
              </button>

              <ProfileDropdown />
            </div>

            {/* Mobile controls */}
            <div className="flex items-center sm:hidden gap-1">
              <SearchButton onSearch={handleSearch} selectedCategory={selectedCategory} />
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                {isDark
                  ? <Sun className="h-5 w-5 text-gray-300" />
                  : <Moon className="h-5 w-5 text-gray-700" />
                }
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="pt-2 pb-3 space-y-1">
              {navigationItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3 text-base transition-colors ${
                    isActive(item.path)
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700 px-4">
              <ProfileDropdown />
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <Chatbot />

      <CreateProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <OrdersModal
        isOpen={showOrders}
        onClose={() => setShowOrders(false)}
      />
    </div>
  );
}
