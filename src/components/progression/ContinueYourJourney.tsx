/**
 * =============================================================================
 * BEGIN YOUR ADVENTURE COMPONENT
 * =============================================================================
 * 
 * Shows an encouragement card ONLY when user has no active quests.
 * Simplified from the original tree progress display.
 * 
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Compass } from 'lucide-react';

interface ContinueYourJourneyProps {
  userId: string;
}

export function ContinueYourJourney({ userId }: ContinueYourJourneyProps) {
  const [hasActiveQuests, setHasActiveQuests] = useState<boolean | null>(null);

  useEffect(() => {
    if (userId) {
      checkActiveQuests();
    }
  }, [userId]);

  const checkActiveQuests = async () => {
    try {
      const { count } = await supabase
        .from('quest_signups')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('status', ['confirmed', 'pending']);

      setHasActiveQuests((count ?? 0) > 0);
    } catch (error) {
      console.error('Error checking active quests:', error);
      setHasActiveQuests(false);
    }
  };

  // Don't render anything if loading or user has active quests
  if (hasActiveQuests === null || hasActiveQuests) {
    return null;
  }

  return (
    <section className="mb-8">
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Compass className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center sm:text-left">
            <p className="font-medium text-foreground">Begin Your Adventure</p>
            <p className="text-sm text-muted-foreground">
              Join a quest to meet new people and unlock unique experiences!
            </p>
          </div>
          <Button asChild className="sm:ml-auto shrink-0">
            <Link to="/quests">Browse Quests</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
