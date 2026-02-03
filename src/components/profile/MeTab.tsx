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
    <div className="space-y-8">
      {/* Adventure Journal - Primary Focus */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-display font-semibold">Adventure Journal</h2>
        </div>
        <AdventureJournal />
      </section>

      <Separator />

      {/* Your Algorithm - Collapsed by default in accordion */}
      <section>
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
      </section>

      <Separator />

      {/* Quick Settings */}
      <section>
        <h3 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Quick Settings
        </h3>
        
        <Card>
          <CardContent className="divide-y">
            {/* Notifications */}
            <div className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Notifications</p>
                  <p className="text-sm text-muted-foreground">Email and in-app notification preferences</p>
                </div>
              </div>
              <Link to="/settings?tab=notifications">
                <Button variant="outline" size="sm">Manage</Button>
              </Link>
            </div>

            {/* Privacy */}
            <div className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Privacy</p>
                  <p className="text-sm text-muted-foreground">Control who sees your profile and activity</p>
                </div>
              </div>
              <Link to="/settings?tab=privacy">
                <Button variant="outline" size="sm">Manage</Button>
              </Link>
            </div>

            {/* Your Data */}
            <div className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Your Data</p>
                  <p className="text-sm text-muted-foreground">Export or manage your data</p>
                </div>
              </div>
              <Link to="/settings?tab=data">
                <Button variant="outline" size="sm">Manage</Button>
              </Link>
            </div>

            {/* Account */}
            <div className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trash2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Account</p>
                  <p className="text-sm text-muted-foreground">Delete account or manage account status</p>
                </div>
              </div>
              <Link to="/settings?tab=account">
                <Button variant="outline" size="sm">Manage</Button>
              </Link>
            </div>

            {/* Help & Support */}
            <div className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Help & Support</p>
                  <p className="text-sm text-muted-foreground">Get help or report an issue</p>
                </div>
              </div>
              <Link to="/support">
                <Button variant="outline" size="sm">Get Help</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
