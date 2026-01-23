import { useState, useEffect } from 'react';
import { CheckCircle, Zap, ArrowRight, Compass, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FeedbackMediaUpload } from './FeedbackMediaUpload';

interface XPBreakdown {
  source: string;
  amount: number;
  label: string;
}

interface SuggestedQuest {
  id: string;
  slug: string;
  title: string;
  icon: string;
  short_description: string | null;
  progression_tree: string | null;
}

interface FeedbackCompleteProps {
  totalXPEarned: number;
  xpBreakdown: XPBreakdown[];
  questTitle: string;
  questId?: string;
}

export function FeedbackComplete({ totalXPEarned, xpBreakdown, questTitle, questId }: FeedbackCompleteProps) {
  const { user } = useAuth();
  const [suggestedQuests, setSuggestedQuests] = useState<SuggestedQuest[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  useEffect(() => {
    const fetchSuggestedQuests = async () => {
      if (!questId) return;
      
      setIsLoadingSuggestions(true);
      try {
        // Get the completed quest's progression tree and theme
        const { data: completedQuest } = await supabase
          .from('quests')
          .select('progression_tree, theme')
          .eq('id', questId)
          .single();

        if (!completedQuest) return;

        // Find similar quests based on progression_tree or theme
        let query = supabase
          .from('quests')
          .select('id, slug, title, icon, short_description, progression_tree')
          .neq('id', questId)
          .eq('status', 'open')
          .limit(3);

        // Prefer same progression tree
        if (completedQuest.progression_tree) {
          query = query.eq('progression_tree', completedQuest.progression_tree);
        } else if (completedQuest.theme) {
          query = query.eq('theme', completedQuest.theme);
        }

        const { data: similarQuests } = await query;

        if (similarQuests && similarQuests.length > 0) {
          setSuggestedQuests(similarQuests.slice(0, 2));
        } else {
          // Fallback: get any open quests
          const { data: anyQuests } = await supabase
            .from('quests')
            .select('id, slug, title, icon, short_description, progression_tree')
            .neq('id', questId)
            .eq('status', 'open')
            .limit(2);

          if (anyQuests) {
            setSuggestedQuests(anyQuests);
          }
        }
      } catch (error) {
        console.error('Failed to fetch suggested quests:', error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    fetchSuggestedQuests();
  }, [questId]);

  const getTreeLabel = (tree: string | null): string => {
    switch (tree) {
      case 'culture': return '🎶 Culture Path';
      case 'wellness': return '🌿 Wellness Path';
      case 'connector': return '🤝 Connector Path';
      default: return '';
    }
  };

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

      {/* Media Upload Section */}
      {user && (
        <div className="max-w-sm mx-auto">
          <Card className="p-4">
            <FeedbackMediaUpload
              questId={questId}
              userId={user.id}
            />
          </Card>
        </div>
      )}

      {/* Suggested Next Quests */}
      {isLoadingSuggestions ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : suggestedQuests.length > 0 && (
        <div className="space-y-4 max-w-sm mx-auto">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Compass className="h-5 w-5" />
            <span className="font-medium">Find Your Next Quest</span>
          </div>
          
          <div className="space-y-3">
            {suggestedQuests.map((quest) => (
              <Link key={quest.id} to={`/quests#${quest.slug}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="py-4 px-4">
                    <div className="flex items-start gap-3 text-left">
                      <span className="text-2xl flex-shrink-0">{quest.icon || '🎯'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{quest.title}</p>
                        {quest.short_description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {quest.short_description}
                          </p>
                        )}
                        {quest.progression_tree && (
                          <Badge variant="outline" className="mt-1.5 text-xs">
                            {getTreeLabel(quest.progression_tree)}
                          </Badge>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3 max-w-sm mx-auto">
        <Button asChild className="w-full" size="lg">
          <Link to="/quests">
            Explore All Quests
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
