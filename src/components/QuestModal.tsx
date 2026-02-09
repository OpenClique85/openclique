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
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Quest } from '@/hooks/useQuests';
import { useQuestRating } from '@/hooks/useQuestRatings';
import { useCreatorSlug } from '@/hooks/useCreatorSlugs';
import { useTogglePinQuest, useIsQuestPinned } from '@/hooks/usePinnedQuests';
import { useUserCliques } from '@/hooks/useUserCliques';
import { useQuestAffinity } from '@/hooks/useQuestAffinity';
import { InstancePicker, QuestInstance } from '@/components/quests';
import QuestProgressionSection from './progression/QuestProgressionSection';
import { 
  MapPin, Calendar, DollarSign, Users, Gift, Star, ChevronRight,
  Bookmark, BookmarkCheck, Send, Loader2, Sparkles, UserCheck,
  Clock, Package, Shirt, AlertTriangle, Target, CheckCircle2
} from 'lucide-react';

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

// Map trait keys to friendly labels
const TRAIT_LABELS: Record<string, string> = {
  'adventurous': 'Adventurous types',
  'creative': 'Creative minds',
  'social_butterfly': 'Social butterflies',
  'intellectual': 'Intellectual explorers',
  'wellness_focused': 'Wellness focused',
  'culture_seeker': 'Culture seekers',
  'connector': 'Natural connectors',
  'introvert_friendly': 'Introverts welcome',
  'extrovert_energy': 'High-energy folks',
  'foodie': 'Foodies',
  'active_lifestyle': 'Active lifestyles',
  'night_owl': 'Night owls',
  'early_bird': 'Early birds',
  'newcomer': 'Newcomers to Austin',
  'student': 'Students',
  'professional': 'Professionals',
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

  // Pin functionality
  const isPinned = useIsQuestPinned(quest?.id);
  const { toggle: togglePin, isPending: isPinPending } = useTogglePinQuest();

  // User's cliques for "suggest to clique"
  const { data: userCliques = [] } = useUserCliques();

  // Quest affinity for "who it's for"
  const { data: affinities = [] } = useQuestAffinity(quest?.id);

  if (!quest) return null;

  const statusConfig = QUEST_STATUS_CONFIG[quest.status];
  const statusStyles = statusColorStyles[statusConfig.color];
  const ctaStyles = ctaColorStyles[statusConfig.color];

  const handlePinClick = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save quests for later.",
      });
      return;
    }
    
    try {
      const nowPinned = await togglePin(quest.id);
      toast({
        title: nowPinned ? "Quest saved!" : "Quest removed",
        description: nowPinned 
          ? "Find it in your Hub → Quests tab under 'Saved for Later'."
          : "Quest removed from your saved list.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update saved quest.",
      });
    }
  };

  const handleSuggestToClique = async (cliqueId: string, cliqueName: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to suggest quests to your clique.",
      });
      return;
    }

    try {
      // Create a squad_quest_invite for the clique
      const { error } = await supabase
        .from('squad_quest_invites')
        .insert({
          squad_id: cliqueId,
          quest_id: quest.id,
          proposed_by: user.id,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: "Quest suggested!",
        description: `Your clique "${cliqueName}" will see this quest suggestion.`,
      });
    } catch (error: any) {
      console.error('Error suggesting quest:', error);
      toast({
        variant: "destructive",
        title: "Failed to suggest quest",
        description: error.message || "Please try again.",
      });
    }
  };

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
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
        {/* Hero Image */}
        {quest.image && quest.image !== '/placeholder.svg' && (
          <div className="relative h-32 sm:h-48 w-full overflow-hidden flex-shrink-0">
            <img 
              src={quest.image} 
              alt={quest.imageAlt}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            
            {/* Action buttons on image - positioned left to avoid dialog close button */}
            <div className="absolute top-3 left-3 flex gap-2">
              <Button
                size="icon"
                variant="secondary"
                className="h-9 w-9 bg-background/80 backdrop-blur-sm hover:bg-background"
                onClick={handlePinClick}
                disabled={isPinPending}
              >
                {isPinPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isPinned ? (
                  <BookmarkCheck className="h-4 w-4 text-primary" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </Button>
              
              {userCliques.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-9 w-9 bg-background/80 backdrop-blur-sm hover:bg-background"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      Suggest to Clique
                    </div>
                    {userCliques.map((clique) => (
                      <DropdownMenuItem
                        key={clique.id}
                        onClick={() => handleSuggestToClique(clique.id, clique.name)}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        {clique.name}
                        <span className="ml-auto text-xs text-muted-foreground">
                          {clique.member_count} members
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        )}
        
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-border flex-shrink-0">
          <div className="flex items-start gap-3 sm:gap-4">
            <span className="text-4xl sm:text-5xl" role="img" aria-hidden="true">
              {quest.icon}
            </span>
            <div className="flex-1 min-w-0">
              <DialogTitle className="font-display text-xl sm:text-2xl font-bold text-foreground mb-2">
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
                    <span className="text-muted-foreground text-xs">({reviewCount})</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 pb-28 sm:pb-6">
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
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4 shrink-0" />
                <span>{quest.metadata.duration}</span>
              </div>
              {quest.meetingLocation && (
                <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="truncate">{quest.meetingLocation.name}</span>
                </div>
              )}
            </div>

            {/* Duration Notes */}
            {quest.metadata.durationNotes && (
              <p className="text-sm text-muted-foreground italic">
                {quest.metadata.durationNotes}
              </p>
            )}

            {/* Who It's For - Personality Affinity */}
            {affinities.length > 0 && (
              <section className="space-y-3">
                <h4 className="font-display font-semibold text-foreground flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-primary" />
                  Who It's For
                </h4>
                <div className="flex flex-wrap gap-2">
                  {affinities.map((affinity) => (
                    <Badge 
                      key={affinity.trait_key} 
                      variant="secondary"
                      className="px-3 py-1.5 text-sm"
                    >
                      <Sparkles className="w-3 h-3 mr-1.5 text-primary" />
                      {TRAIT_LABELS[affinity.trait_key] || affinity.trait_key.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
                {affinities[0]?.explanation && (
                  <p className="text-sm text-muted-foreground italic">
                    "{affinities[0].explanation}"
                  </p>
                )}
              </section>
            )}

            {/* Description */}
            <section className="space-y-2">
              <h4 className="font-display font-semibold text-foreground">About This Quest</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {quest.shortDescription}
              </p>
              {quest.fullDescription && quest.fullDescription !== quest.shortDescription && (
                <p className="text-muted-foreground text-sm leading-relaxed mt-2">
                  {quest.fullDescription}
                </p>
              )}
            </section>

            {/* Highlights */}
            {quest.highlights && quest.highlights.length > 0 && (
              <section className="space-y-2">
                <h4 className="font-display font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Highlights
                </h4>
                <ul className="space-y-2">
                  {quest.highlights.map((highlight, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </section>
            )}


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

            {/* Practical Info Section */}
            {(quest.whatToBring || quest.dressCode || quest.physicalRequirements || quest.ageRestriction) && (
              <section className="space-y-3">
                <h4 className="font-display font-semibold text-foreground">Before You Go</h4>
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  {quest.whatToBring && (
                    <div className="flex items-start gap-3">
                      <Package className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">What to Bring</p>
                        <p className="text-muted-foreground text-sm">{quest.whatToBring}</p>
                      </div>
                    </div>
                  )}
                  {quest.dressCode && (
                    <div className="flex items-start gap-3">
                      <Shirt className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Dress Code</p>
                        <p className="text-muted-foreground text-sm">{quest.dressCode}</p>
                      </div>
                    </div>
                  )}
                  {quest.physicalRequirements && (
                    <div className="flex items-start gap-3">
                      <Users className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Physical Requirements</p>
                        <p className="text-muted-foreground text-sm">{quest.physicalRequirements}</p>
                      </div>
                    </div>
                  )}
                  {quest.ageRestriction && (
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Age Restriction</p>
                        <p className="text-muted-foreground text-sm">{quest.ageRestriction}</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Safety Notes */}
            {quest.safetyNotes && (
              <section className="space-y-2">
                <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-amber-800 dark:text-amber-300">Safety Note</p>
                    <p className="text-sm text-amber-700 dark:text-amber-400">{quest.safetyNotes}</p>
                  </div>
                </div>
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

            {/* Sections from database (legacy briefing_html) */}
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
          </div>
        </ScrollArea>
        
        {/* Fixed Mobile CTA - Always visible */}
        <div className="fixed bottom-0 inset-x-0 p-4 pb-safe bg-background/95 backdrop-blur-sm border-t shadow-lg sm:relative sm:bottom-auto sm:inset-x-auto sm:border-t sm:shadow-none sm:bg-transparent sm:backdrop-blur-none sm:p-4 sm:pb-4 z-10">
          <div className="flex gap-2">
            {/* Pin button for mobile (when no image) */}
            {(!quest.image || quest.image === '/placeholder.svg') && (
              <Button
                size="lg"
                variant="outline"
                className="min-h-[48px]"
                onClick={handlePinClick}
                disabled={isPinPending}
              >
                {isPinPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isPinned ? (
                  <BookmarkCheck className="h-5 w-5 text-primary" />
                ) : (
                  <Bookmark className="h-5 w-5" />
                )}
              </Button>
            )}
            <Button
              size="lg"
              className={`flex-1 ${ctaStyles} min-h-[48px]`}
              onClick={() => handleCTAClick()}
              disabled={statusConfig.ctaDisabled || isJoining}
            >
              {isJoining ? 'Joining...' : user ? statusConfig.ctaText : 'Sign in to Join'}
            </Button>
          </div>
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
