/**
 * MobileCollapsibleSection - Collapsible on mobile, expanded on desktop
 * 
 * Provides a dropdown-style section that:
 * - Collapses by default on mobile (sm breakpoint)
 * - Shows expanded by default on desktop
 * - Uses consistent styling across the Profile Hub
 */

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface MobileCollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  count?: number;
  children: React.ReactNode;
  defaultOpenDesktop?: boolean;
  defaultOpenMobile?: boolean;
  className?: string;
  variant?: 'default' | 'muted';
}

export function MobileCollapsibleSection({
  title,
  icon,
  count,
  children,
  defaultOpenDesktop = true,
  defaultOpenMobile = false,
  className,
  variant = 'default',
}: MobileCollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 640; // sm breakpoint
      setIsMobile(mobile);
      setIsOpen(mobile ? defaultOpenMobile : defaultOpenDesktop);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [defaultOpenDesktop, defaultOpenMobile]);

  // On desktop, just render the section normally
  if (!isMobile) {
    return (
      <section className={className}>
        <h3 className={cn(
          "text-lg font-display font-semibold mb-3 flex items-center gap-2",
          variant === 'muted' && "text-muted-foreground"
        )}>
          {icon}
          {title}
          {count !== undefined && ` (${count})`}
        </h3>
        {children}
      </section>
    );
  }

  // On mobile, render as collapsible
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <CollapsibleTrigger className="w-full">
        <div className={cn(
          "flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors",
          isOpen && "rounded-b-none border-b-0"
        )}>
          <div className="flex items-center gap-2">
            {icon}
            <span className={cn(
              "font-display font-semibold",
              variant === 'muted' && "text-muted-foreground"
            )}>
              {title}
            </span>
            {count !== undefined && (
              <span className="text-sm text-muted-foreground">({count})</span>
            )}
          </div>
          <ChevronDown 
            className={cn(
              "h-5 w-5 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )} 
          />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border border-t-0 rounded-b-lg p-3 bg-card">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
