import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, CalendarDays, MapPin, Utensils } from 'lucide-react';

const tabs = [
  { path: '/explore',    label: 'Explore',    Icon: Compass      },
  { path: '/plan',       label: 'Plan',       Icon: CalendarDays },
  { path: '/footprints', label: 'Footprints', Icon: MapPin       },
  { path: '/recipes',    label: 'Recipes',    Icon: Utensils     },
];

export function BottomTabBar() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-100 shadow-[0_-1px_8px_rgba(0,0,0,0.06)]">
      <div className="flex h-16">
        {tabs.map(({ path, label, Icon }) => {
          const active = pathname === path || (path === '/explore' && pathname === '/');
          return (
            <Link
              key={path}
              to={path}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
                active ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {/* Animated active pill */}
              {active && (
                <motion.div
                  layoutId="tab-pill"
                  className="absolute top-1 inset-x-3 h-0.5 bg-brand-600 rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
