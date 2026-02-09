import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useTutorialQuest } from '@/hooks/useTutorialQuest';
import { useAuth } from '@/hooks/useAuth';
import buggsFace from '@/assets/buggs-face.png';

export function TutorialQuestBanner() {
  const { user } = useAuth();
  const { shouldShowBanner, isLoading, dismiss } = useTutorialQuest();

  if (!user || isLoading || !shouldShowBanner) return null;

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-3 sm:gap-4">
        <img src={buggsFace} alt="BUGGS" className="w-12 h-12 object-contain flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm sm:text-base">
            Complete your Training Quest!
          </p>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            Learn how quests work in a quick solo walkthrough and earn 50 XP.
          </p>
        </div>
        <Button asChild size="sm" className="flex-shrink-0">
          <Link to="/tutorial-quest">Start</Link>
        </Button>
        <button
          onClick={(e) => { e.stopPropagation(); dismiss.mutate(); }}
          className="text-muted-foreground hover:text-foreground p-1 flex-shrink-0"
          aria-label="Skip for now"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
