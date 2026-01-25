/**
 * =============================================================================
 * ADMIN SECTION NAVIGATION - Organized tab groupings for admin console
 * =============================================================================
 */

import { cn } from '@/lib/utils';
import { 
  Target, Users, MessageSquare, BarChart3, Gamepad2,
  ChevronDown, ChevronRight, Wrench, FileText,
  Shield, Library, CheckSquare, HeadphonesIcon, Image, Ticket, Brain
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
    id: 'mission-control',
    label: 'Mission Control',
    icon: <Target className="h-4 w-4" />,
    tabs: [
      { id: 'pilot-instances', label: 'Active Instances' },
      { id: 'ops-alerts', label: 'Ops Alerts' },
    ],
  },
  {
    id: 'approvals',
    label: 'Approvals',
    icon: <CheckSquare className="h-4 w-4" />,
    tabs: [
      { id: 'approval-inbox', label: 'Quest Approvals' },
      { id: 'audit-log', label: 'Audit Log' },
    ],
  },
  {
    id: 'catalog',
    label: 'Quest Catalog',
    icon: <Library className="h-4 w-4" />,
    tabs: [
      { id: 'quests', label: 'Quest Templates' },
      { id: 'quest-archives', label: 'Quest Archives' },
      { id: 'orgs', label: 'Organizations' },
      { id: 'squads-directory', label: 'Squad Directory' },
      { id: 'squad-comparison', label: 'Squad Comparison' },
      { id: 'squad-health', label: 'Squad Health' },
      { id: 'squad-archival', label: 'Archival' },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    icon: <HeadphonesIcon className="h-4 w-4" />,
    tabs: [
      { id: 'support-inbox', label: 'Ticket Inbox' },
      { id: 'support-dm', label: 'Direct Messages' },
      { id: 'support-analytics', label: 'Analytics' },
      { id: 'support-categories', label: 'Issue Categories' },
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
    id: 'content',
    label: 'Content',
    icon: <Image className="h-4 w-4" />,
    tabs: [
      { id: 'ugc-manager', label: 'UGC Gallery' },
      { id: 'testimonials', label: 'Testimonials' },
    ],
  },
  {
    id: 'comms',
    label: 'Communications',
    icon: <MessageSquare className="h-4 w-4" />,
    tabs: [
      { id: 'messaging', label: 'Messaging' },
      { id: 'notification-console', label: 'Notification Console' },
      { id: 'whatsapp', label: 'WhatsApp' },
      { id: 'links', label: 'Signup Links' },
    ],
  },
  {
    id: 'growth',
    label: 'Growth',
    icon: <Ticket className="h-4 w-4" />,
    tabs: [
      { id: 'invite-codes', label: 'Invite Codes' },
      { id: 'onboarding-feedback', label: 'Onboarding Feedback' },
      { id: 'analytics', label: 'Analytics' },
    ],
  },
  {
    id: 'identity',
    label: 'Identity System',
    icon: <Brain className="h-4 w-4" />,
    tabs: [
      { id: 'trait-library', label: 'Trait Library' },
      { id: 'emerging-traits', label: 'Emerging Traits' },
      { id: 'user-inspector', label: 'User Inspector' },
      { id: 'ai-logs', label: 'AI Inference Logs' },
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
  {
    id: 'ops-dev',
    label: 'Ops & Dev',
    icon: <Wrench className="h-4 w-4" />,
    tabs: [
      { id: 'shadow-mode', label: 'Shadow Mode' },
      { id: 'event-timeline', label: 'Event Timeline' },
      { id: 'flow-debugger', label: 'Flow Debugger' },
      { id: 'manual-overrides', label: 'Manual Overrides' },
      { id: 'feature-flags', label: 'Feature Flags' },
      { id: 'security-tools', label: 'Security Tools' },
      { id: 'devtools', label: 'Dev Tools' },
    ],
  },
  {
    id: 'documentation',
    label: 'Documentation',
    icon: <FileText className="h-4 w-4" />,
    tabs: [
      { id: 'docs-manager', label: 'System Docs' },
      { id: 'docs-playbooks', label: 'Operations Playbooks' },
      { id: 'docs-export', label: 'Export Handoff Pack' },
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
    return activeSection ? [activeSection.id] : ['mission-control'];
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
