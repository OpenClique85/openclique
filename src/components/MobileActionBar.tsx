/**
 * =============================================================================
 * MOBILE ACTION BAR - Floating bottom navigation for mobile users
 * =============================================================================
 * 
 * A fixed bottom navigation bar that appears only on mobile devices for
 * logged-in users. Provides quick access to core navigation items.
 */

import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Users, User, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  icon: typeof Home;
  label: string;
  matchPaths?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { 
    href: '/', 
    icon: Home, 
    label: 'Home',
    matchPaths: ['/']
  },
  { 
    href: '/quests', 
    icon: Compass, 
    label: 'Quests',
    matchPaths: ['/quests']
  },
  { 
    href: '/profile?tab=cliques', 
    icon: Users, 
    label: 'Cliques',
    matchPaths: ['/profile', '/cliques']
  },
  { 
    href: '/notifications', 
    icon: Bell, 
    label: 'Alerts',
    matchPaths: ['/notifications']
  },
  { 
    href: '/profile?tab=me', 
    icon: User, 
    label: 'Me',
    matchPaths: ['/profile']
  },
];

export function MobileActionBar() {
  const { user } = useAuth();
  const location = useLocation();

  // Only show for logged-in users on mobile
  if (!user) return null;

  const isActive = (item: NavItem) => {
    // Special handling for profile tabs
    if (item.href.includes('tab=cliques')) {
      return location.pathname === '/profile' && location.search.includes('tab=cliques');
    }
    if (item.href.includes('tab=me')) {
      return location.pathname === '/profile' && location.search.includes('tab=me');
    }
    
    // Check if any match paths are active
    return item.matchPaths?.some(path => {
      if (path === '/') return location.pathname === '/';
      return location.pathname.startsWith(path);
    }) ?? false;
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-2 px-1 transition-colors",
                active 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "scale-110")} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
