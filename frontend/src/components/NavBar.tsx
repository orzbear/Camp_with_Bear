import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Logo } from './Logo';

export function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    // Removed 'py-4' from here to have tighter control over height if needed, 
    // or keep it for a taller bar. I reduced it to py-2 for a cleaner look with the large logo.
    <nav className="bg-white shadow-md border-b border-gray-200 py-6">
      {/* CHANGED: 
          1. Removed 'max-w-7xl' (which constrained width)
          2. Removed 'mx-auto' (which centered it)
          3. Added 'w-full' (to span full width)
      */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Left: Logo */}
          {/* Removed 'py-4' wrapper to allow logo to be full height */}
          <div className="flex-shrink-0 flex items-center">
            <Logo />
          </div>

          {/* Middle: Navigation links */}
          <div className="hidden md:flex space-x-8">
            <Link
              to="/"
              className="text-gray-700 hover:text-green-700 px-3 py-2 rounded-md text-xl font-medium transition-colors"
            >
              Search Trips
            </Link>
            <Link
              to="/plan"
              className="text-gray-700 hover:text-green-700 px-3 py-2 rounded-md text-xl font-medium transition-colors"
            >
              Plan Your Trip
            </Link>
            <Link
              to="/recipes"
              className="text-gray-700 hover:text-green-700 px-3 py-2 rounded-md text-xl font-medium transition-colors"
            >
              Camp Recipes
            </Link>
          </div>

          {/* Right: Auth buttons or user info */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-lg text-gray-600">
                  Hi, <span className="font-medium">{user.email}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-green-700 px-3 py-2 rounded-md text-lg font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden border-t border-gray-200">
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link
            to="/"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-700 hover:bg-gray-50"
          >
            Search Trips
          </Link>
          <Link
            to="/plan"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-700 hover:bg-gray-50"
          >
            Plan Your Trip
          </Link>
          <Link
            to="/recipes"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-700 hover:bg-gray-50"
          >
            Camp Recipes
          </Link>
        </div>
      </div>
    </nav>
  );
}