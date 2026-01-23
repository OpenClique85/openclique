import { CheckCircle, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface XPBreakdown {
  source: string;
  amount: number;
  label: string;
}

interface FeedbackCompleteProps {
  totalXPEarned: number;
  xpBreakdown: XPBreakdown[];
  questTitle: string;
}

export function FeedbackComplete({ totalXPEarned, xpBreakdown, questTitle }: FeedbackCompleteProps) {
  return (
    <div className="text-center space-y-8 py-8">
      {/* Success icon */}
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
      </div>

      {/* Thank you message */}
      <div className="space-y-2">
        <h2 className="text-2xl font-display font-bold text-foreground">
          Thanks for your feedback!
        </h2>
        <p className="text-muted-foreground">
          Your insights help us make OpenClique better for everyone.
        </p>
      </div>

      {/* XP earned */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 max-w-sm mx-auto">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Zap className="h-6 w-6 text-primary fill-primary" />
          <span className="text-3xl font-bold text-primary">+{totalXPEarned} XP</span>
        </div>
        
        {xpBreakdown.length > 0 && (
          <div className="space-y-2">
            {xpBreakdown.map((item, i) => (
              <div
                key={i}
                className={cn(
                  "flex justify-between text-sm",
                  "animate-in fade-in slide-in-from-bottom-2",
                )}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <span className="text-muted-foreground">{item.label}</span>
                <span className="text-foreground font-medium">+{item.amount} XP</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3 max-w-sm mx-auto">
        <Button asChild className="w-full" size="lg">
          <Link to="/quests">
            Explore More Quests
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full" size="lg">
          <Link to="/my-quests">
            View My Quests
          </Link>
        </Button>
      </div>

      {/* Fun footer */}
      <p className="text-xs text-muted-foreground">
        Quest completed: {questTitle}
      </p>
    </div>
  );
}
