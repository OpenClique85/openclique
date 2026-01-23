import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, ClipboardList, BarChart3, User, FileText, Inbox } from 'lucide-react';

const navItems = [
  { href: '/creator', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/creator/quests', label: 'My Quests', icon: ClipboardList },
  { href: '/creator/proposals', label: 'Sponsor Proposals', icon: FileText },
  { href: '/creator/org-requests', label: 'Org Requests', icon: Inbox },
  { href: '/creator/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/creator/profile', label: 'Profile', icon: User },
];

export function CreatorPortalNav() {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/creator') {
      return location.pathname === '/creator';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-16 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
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
