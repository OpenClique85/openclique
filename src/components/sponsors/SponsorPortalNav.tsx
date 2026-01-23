import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Search, 
  MapPin, 
  Gift, 
  BarChart3,
  FileText,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/sponsor', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sponsor/discover', label: 'Discover', icon: Search },
  { href: '/sponsor/browse-creators', label: 'Creators', icon: User },
  { href: '/sponsor/browse-orgs', label: 'Organizations', icon: MapPin },
  { href: '/sponsor/org-requests', label: 'Org Requests', icon: FileText },
  { href: '/sponsor/venues', label: 'Venues', icon: MapPin },
  { href: '/sponsor/rewards', label: 'Rewards', icon: Gift },
  { href: '/sponsor/proposals', label: 'Proposals', icon: FileText },
  { href: '/sponsor/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/sponsor/profile', label: 'Profile', icon: User },
];

export function SponsorPortalNav() {
  const location = useLocation();

  return (
    <nav className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
