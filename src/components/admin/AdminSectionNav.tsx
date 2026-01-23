/**
 * =============================================================================
 * ADMIN SECTION NAVIGATION - Organized tab groupings for admin console
 * =============================================================================
 */

import { cn } from '@/lib/utils';
import { 
  Map, Users, MessageSquare, BarChart3, Gamepad2,
  ChevronDown, ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export interface AdminSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  tabs: { id: string; label: string }[];
}

export const ADMIN_SECTIONS: AdminSection[] = [
  {
    id: 'operations',
    label: 'Operations',
    icon: <Map className="h-4 w-4" />,
    tabs: [
      { id: 'quests', label: 'Quests' },
      { id: 'signups', label: 'Signups' },
      { id: 'squads', label: 'Squads' },
    ],
  },
  {
    id: 'partners',
    label: 'Partners',
    icon: <Users className="h-4 w-4" />,
    tabs: [
      { id: 'creators', label: 'Creators' },
      { id: 'sponsors', label: 'Sponsors' },
      { id: 'testimonials', label: 'Testimonials' },
      { id: 'creator-preview', label: 'Creator View' },
      { id: 'sponsor-preview', label: 'Sponsor View' },
    ],
  },
  {
    id: 'comms',
    label: 'Communications',
    icon: <MessageSquare className="h-4 w-4" />,
    tabs: [
      { id: 'messaging', label: 'Messaging' },
      { id: 'whatsapp', label: 'WhatsApp' },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: <BarChart3 className="h-4 w-4" />,
    tabs: [
      { id: 'analytics', label: 'Analytics' },
      { id: 'devtools', label: 'Dev Tools' },
    ],
  },
  {
    id: 'gamification',
    label: 'Gamification',
    icon: <Gamepad2 className="h-4 w-4" />,
    tabs: [
      { id: 'xp-levels', label: 'XP & Levels' },
      { id: 'achievements', label: 'Achievements' },
      { id: 'badges', label: 'Badges' },
      { id: 'streaks', label: 'Streaks' },
    ],
  },
];

interface AdminSectionNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AdminSectionNav({ activeTab, onTabChange }: AdminSectionNavProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(() => {
    // Find which section contains the active tab and expand it
    const activeSection = ADMIN_SECTIONS.find(section => 
      section.tabs.some(tab => tab.id === activeTab)
    );
    return activeSection ? [activeSection.id] : ['operations'];
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleTabClick = (tabId: string, sectionId: string) => {
    onTabChange(tabId);
    // Ensure section is expanded when clicking a tab
    if (!expandedSections.includes(sectionId)) {
      setExpandedSections(prev => [...prev, sectionId]);
    }
  };

  return (
    <nav className="space-y-1">
      {ADMIN_SECTIONS.map((section) => {
        const isExpanded = expandedSections.includes(section.id);
        const hasActiveTab = section.tabs.some(tab => tab.id === activeTab);

        return (
          <Collapsible
            key={section.id}
            open={isExpanded}
            onOpenChange={() => toggleSection(section.id)}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-between font-medium',
                  hasActiveTab && 'bg-muted'
                )}
              >
                <span className="flex items-center gap-2">
                  {section.icon}
                  {section.label}
                </span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-6 space-y-1 pt-1">
              {section.tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'w-full justify-start text-sm',
                    activeTab === tab.id && 'bg-primary/10 text-primary font-medium'
                  )}
                  onClick={() => handleTabClick(tab.id, section.id)}
                >
                  {tab.label}
                </Button>
              ))}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </nav>
  );
}

// Flat tabs component for mobile/compact view
interface AdminTabsBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AdminTabsBar({ activeTab, onTabChange }: AdminTabsBarProps) {
  return (
    <div className="flex flex-wrap gap-1 p-1 bg-muted rounded-lg">
      {ADMIN_SECTIONS.map((section) => (
        <div key={section.id} className="flex gap-1">
          {section.tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              size="sm"
              className="text-xs"
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
          <div className="w-px bg-border mx-1" />
        </div>
      ))}
    </div>
  );
}
