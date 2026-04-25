import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../auth/AuthContext';
import { LogOut, User } from 'lucide-react';
import { Logo } from './Logo';

const navLinks = [
  { path: '/explore',    label: 'Explore'    },
  { path: '/plan',       label: 'Plan'       },
  { path: '/footprints', label: 'Footprints' },
  { path: '/recipes',    label: 'Recipes'    },
];

export function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/explore');
  };

  return (
    <nav className="flex-shrink-0 bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <Logo />

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ path, label }) => {
              const active = pathname === path || (path === '/explore' && pathname === '/');
              return (
                <Link
                  key={path}
                  to={path}
                  className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                    active ? 'text-gray-900 font-semibold' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {/* Sliding pill behind active link */}
                  {active && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-gray-100 rounded-lg"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </Link>
              );
            })}
          </div>

          {/* Auth section */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden sm:flex items-center gap-1.5 text-gray-500 text-sm">
                  <User className="w-3.5 h-3.5" />
                  <span className="max-w-[140px] truncate">{user.email}</span>
                </span>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </motion.button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-brand-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Login
                </Link>
                <motion.div whileTap={{ scale: 0.96 }}>
                  <Link
                    to="/register"
                    className="px-4 py-1.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
                  >
                    Register
                  </Link>
                </motion.div>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
