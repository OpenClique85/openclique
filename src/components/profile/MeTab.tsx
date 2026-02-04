/**
 * =============================================================================
 * MeTab - Personal hub with Adventure Journal and Algorithm
 * =============================================================================
 * 
 * Reorganized to prioritize:
 * 1. Adventure Journal (Level, Achievements, Badges, Meta Quests)
 * 2. Your Algorithm (Social energy, group roles, traits)
 * 3. Quick Settings
 */

import { AdventureJournal } from '@/components/journal/AdventureJournal';
import { YourAlgorithmDashboard } from '@/components/profile/YourAlgorithmDashboard';
import { MobileCollapsibleSection } from './MobileCollapsibleSection';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Bell, Shield, HelpCircle, Database, Trash2, BookOpen, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface MeTabProps {
  userId: string;
}

export function MeTab({ userId }: MeTabProps) {
  return (
    <div className="space-y-6">
      {/* Adventure Journal - Collapsible on mobile */}
      <MobileCollapsibleSection
        title="Adventure Journal"
        icon={<BookOpen className="h-5 w-5 text-primary" />}
        defaultOpenMobile={true}
        defaultOpenDesktop={true}
      >
        <AdventureJournal />
      </MobileCollapsibleSection>

      <Separator className="hidden sm:block" />

      {/* Your Algorithm - Collapsed by default */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="algorithm" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <span className="font-medium">Your Algorithm</span>
                <p className="text-xs text-muted-foreground font-normal">
                  How you show up, group roles, and matching preferences
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <YourAlgorithmDashboard />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Separator className="hidden sm:block" />

      {/* Quick Settings - Collapsible on mobile */}
      <MobileCollapsibleSection
        title="Quick Settings"
        icon={<Settings className="h-5 w-5" />}
        defaultOpenMobile={false}
        defaultOpenDesktop={true}
      >
        <Card>
          <CardContent className="divide-y">
            {/* Notifications */}
            <div className="py-3 sm:py-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <Bell className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">Notifications</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Email and in-app preferences</p>
                </div>
              </div>
              <Link to="/settings?tab=notifications">
                <Button variant="outline" size="sm" className="shrink-0">Manage</Button>
              </Link>
            </div>

            {/* Privacy */}
            <div className="py-3 sm:py-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <Shield className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">Privacy</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Profile visibility</p>
                </div>
              </div>
              <Link to="/settings?tab=privacy">
                <Button variant="outline" size="sm" className="shrink-0">Manage</Button>
              </Link>
            </div>

            {/* Your Data */}
            <div className="py-3 sm:py-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <Database className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">Your Data</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Export or manage</p>
                </div>
              </div>
              <Link to="/settings?tab=data">
                <Button variant="outline" size="sm" className="shrink-0">Manage</Button>
              </Link>
            </div>

            {/* Account */}
            <div className="py-3 sm:py-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <Trash2 className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">Account</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Delete or manage</p>
                </div>
              </div>
              <Link to="/settings?tab=account">
                <Button variant="outline" size="sm" className="shrink-0">Manage</Button>
              </Link>
            </div>

            {/* Help & Support */}
            <div className="py-3 sm:py-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <HelpCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">Help & Support</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Get help or report issue</p>
                </div>
              </div>
              <Link to="/support">
                <Button variant="outline" size="sm" className="shrink-0">Get Help</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </MobileCollapsibleSection>
    </div>
  );
}
