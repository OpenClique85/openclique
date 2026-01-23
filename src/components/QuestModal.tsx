import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Quest } from '@/hooks/useQuests';
import { useQuestRating } from '@/hooks/useQuestRatings';
import { useCreatorSlug } from '@/hooks/useCreatorSlugs';
import { InstancePicker, QuestInstance } from '@/components/quests';
import QuestProgressionSection from './progression/QuestProgressionSection';
import { MapPin, Calendar, DollarSign, Users, Gift, Star, ChevronRight } from 'lucide-react';

interface QuestModalProps {
  quest: Quest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QUEST_STATUS_CONFIG: Record<Quest['status'], { label: string; color: string; ctaText: string; ctaDisabled?: boolean }> = {
  'open': { label: 'Open', color: 'green', ctaText: 'Join This Quest' },
  'closed': { label: 'Full', color: 'yellow', ctaText: 'Join Waitlist' },
  'coming-soon': { label: 'Coming Soon', color: 'gray', ctaText: 'Get Notified', ctaDisabled: true },
  'completed': { label: 'Completed', color: 'muted', ctaText: 'Quest Complete', ctaDisabled: true },
};

const statusColorStyles: Record<string, string> = {
  green: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
  yellow: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
  gray: 'bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-600',
  muted: 'bg-muted text-muted-foreground border-border',
};

const ctaColorStyles: Record<string, string> = {
  green: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  yellow: 'bg-amber-500 hover:bg-amber-600 text-white',
  gray: 'bg-gray-400 text-white cursor-not-allowed opacity-60',
  muted: 'bg-primary hover:bg-primary/90 text-primary-foreground opacity-60 cursor-not-allowed',
};

const QuestModal = ({ quest, open, onOpenChange }: QuestModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = useState(false);
  
  // Instance picker state
  const [showInstancePicker, setShowInstancePicker] = useState(false);
  const [upcomingInstances, setUpcomingInstances] = useState<QuestInstance[]>([]);
  
  // Fetch rating for this quest
  const { rating, reviewCount } = useQuestRating(quest?.id);
  
  // Fetch creator info for community quests
  const { data: creatorInfo } = useCreatorSlug(
    quest?.creatorType === 'community' ? quest?.creatorId : undefined
  );

  if (!quest) return null;

  const statusConfig = QUEST_STATUS_CONFIG[quest.status];
  const statusStyles = statusColorStyles[statusConfig.color];
  const ctaStyles = ctaColorStyles[statusConfig.color];

  const handleCTAClick = async (instanceIdOverride?: string) => {
    if (statusConfig.ctaDisabled) return;

    // If not logged in, redirect to auth
    if (!user) {
      onOpenChange(false);
      navigate('/auth', { state: { from: `/quests`, questId: quest.id } });
      return;
    }

    // Check if quest is repeatable and needs instance picker
    if (quest.isRepeatable && !instanceIdOverride) {
      // Fetch upcoming instances via RPC
      const { data: instanceResult } = await supabase.rpc('get_or_create_instance', {
        p_quest_id: quest.id
      }) as { data: { instance_id: string | null; needs_picker: boolean; instance_count: number }[] | null };
      
      if (instanceResult && instanceResult[0]?.needs_picker) {
        // Fetch the full list of instances for the picker
        const { data: instances } = await supabase.rpc('get_upcoming_instances', {
          p_quest_id: quest.id
        }) as { data: QuestInstance[] | null };
        
        if (instances && instances.length > 1) {
          setUpcomingInstances(instances);
          setShowInstancePicker(true);
          return;
        }
      }
    }

    // Join the quest
    setIsJoining(true);
    try {
      // First check if already signed up
      const { data: existing } = await supabase
        .from('quest_signups')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('quest_id', quest.id)
        .maybeSingle();

      if (existing) {
        toast({
          title: "Already signed up!",
          description: `You're ${existing.status} for this quest.`,
        });
        onOpenChange(false);
        navigate('/my-quests');
        return;
      }

      // Create signup with instance_id if available
      const { error } = await supabase.from('quest_signups').insert({
        user_id: user.id,
        quest_id: quest.id,
        status: 'pending',
        instance_id: instanceIdOverride || null,
      });

      if (error) throw error;

      toast({
        title: "Quest joined!",
        description: "You've been added to the waitlist. We'll notify you when you're confirmed.",
      });
      setShowInstancePicker(false);
      onOpenChange(false);
      navigate('/my-quests');
    } catch (error: any) {
      console.error('Error joining quest:', error);
      toast({
        variant: "destructive",
        title: "Failed to join quest",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsJoining(false);
    }
  };

  // Handle instance selection from picker
  const handleInstanceSelect = (instanceId: string) => {
    handleCTAClick(instanceId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0">
        {/* Hero Image */}
        {quest.image && quest.image !== '/placeholder.svg' && (
          <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
            <img 
              src={quest.image} 
              alt={quest.imageAlt}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>
        )}
        
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-start gap-4">
            <span className="text-5xl" role="img" aria-hidden="true">
              {quest.icon}
            </span>
            <div className="flex-1 min-w-0">
              <DialogTitle className="font-display text-2xl font-bold text-foreground mb-2">
                {quest.title}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusStyles}`}>
                  {statusConfig.label}
                </span>
                {quest.theme && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                    {quest.theme}
                  </span>
                )}
                {/* Star Rating */}
                {reviewCount > 0 && rating !== null && (
                  <div className="flex items-center gap-1 text-sm ml-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
                    <span className="text-muted-foreground text-xs">({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[60vh]">
          <div className="p-6 space-y-6">
            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4 shrink-0" />
                <span>{quest.metadata.date}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="w-4 h-4 shrink-0" />
                <span>{quest.metadata.cost}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4 shrink-0" />
                <span>{quest.metadata.squadSize}</span>
              </div>
              {quest.meetingLocation && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="truncate">{quest.meetingLocation.name}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <section className="space-y-2">
              <h4 className="font-display font-semibold text-foreground">About This Quest</h4>
              <p className="text-muted-foreground text-sm">
                {quest.shortDescription}
              </p>
            </section>

            {/* Rewards */}
            {quest.rewards && (
              <section className="space-y-2">
                <h4 className="font-display font-semibold text-foreground flex items-center gap-2">
                  <Gift className="w-4 h-4 text-primary" />
                  What You'll Earn
                </h4>
                <p className="text-muted-foreground text-sm bg-primary/5 rounded-lg p-3">
                  {quest.rewards}
                </p>
              </section>
            )}

            {/* Quest Creator Section */}
            {quest.creatorType === 'community' && quest.creatorId && creatorInfo && (
              <section className="space-y-2">
                <h4 className="font-display font-semibold text-foreground">Quest Creator</h4>
                <Link
                  to={`/creators/${creatorInfo.slug}`}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={creatorInfo.photo_url || undefined} />
                    <AvatarFallback className="bg-creator/20 text-creator">
                      {creatorInfo.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {creatorInfo.display_name}
                    </p>
                    {creatorInfo.city && (
                      <p className="text-sm text-muted-foreground">{creatorInfo.city}</p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              </section>
            )}

            {/* Sections from database */}
            {quest.sections?.map((section, index) => (
              <section key={index} className="space-y-2">
                <h4 className="font-display font-semibold text-foreground">
                  {section.title}
                </h4>
                
                {section.type === 'timeline' && Array.isArray(section.content) && (
                  <div className="space-y-2 pl-4 border-l-2 border-primary/30">
                    {section.content.map((item, i) => (
                      <p key={i} className="text-muted-foreground text-sm">
                        {item}
                      </p>
                    ))}
                  </div>
                )}

                {section.type === 'list' && Array.isArray(section.content) && (
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                    {section.content.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                )}

                {(section.type === 'text' || !section.type) && typeof section.content === 'string' && (
                  <p className="text-muted-foreground text-sm">
                    {section.content}
                  </p>
                )}
              </section>
            ))}

            {/* Meeting Location Details */}
            {quest.meetingLocation?.address && (
              <section className="space-y-2">
                <h4 className="font-display font-semibold text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Meeting Location
                </h4>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="font-medium text-sm">{quest.meetingLocation.name}</p>
                  <p className="text-muted-foreground text-sm">{quest.meetingLocation.address}</p>
                </div>
              </section>
            )}

            {/* Progression Section */}
            <QuestProgressionSection treeId={quest.progressionTree} />

            {/* CTA Section */}
            <div className="pt-4 border-t border-border">
              <Button
                size="lg"
                className={`w-full ${ctaStyles}`}
                onClick={() => handleCTAClick()}
                disabled={statusConfig.ctaDisabled || isJoining}
              >
                {isJoining ? 'Joining...' : user ? statusConfig.ctaText : 'Sign in to Join'}
              </Button>
              {quest.status === 'open' && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Spots available for the Austin pilot
                </p>
              )}
              {quest.status === 'closed' && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Join the waitlist to be notified of openings
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
      
      {/* Instance Picker Modal */}
      <InstancePicker
        open={showInstancePicker}
        onOpenChange={setShowInstancePicker}
        instances={upcomingInstances}
        questTitle={quest.title}
        onSelectInstance={handleInstanceSelect}
        isLoading={isJoining}
      />
    </Dialog>
  );
};

export default QuestModal;
