import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useUserLevel } from '@/hooks/useUserLevel';
import { useUserTreeXP } from '@/hooks/useUserTreeXP';
import { useAwardXP } from '@/hooks/useUserXP';
import { useTutorial } from '@/components/tutorial/TutorialProvider';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import ShareQuestButton from '@/components/ShareQuestButton';
import { InstancePicker, QuestInstance } from '@/components/quests';
import { GetHelpButton } from '@/components/support';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Award,
  DollarSign,
  ArrowLeft,
  Loader2,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { format, differenceInDays, differenceInWeeks } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Quest = Tables<'quests'>;

const STATUS_CONFIG = {
  draft: { label: 'Coming Soon', color: 'bg-gray-100 text-gray-700', canJoin: false },
  open: { label: 'Open', color: 'bg-emerald-100 text-emerald-700', canJoin: true },
  closed: { label: 'Closed', color: 'bg-amber-100 text-amber-700', canJoin: false },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700', canJoin: false },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', canJoin: false },
};

const THEME_COLORS = {
  pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

export default function QuestDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { level } = useUserLevel();
  const { treeXP } = useUserTreeXP();
  const awardXP = useAwardXP();
  const { markActionComplete, completedActions } = useTutorial();
  
  const [quest, setQuest] = useState<Quest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [userSignup, setUserSignup] = useState<{ status: string } | null>(null);
  const [signupCount, setSignupCount] = useState(0);
  
  // Instance picker state
  const [showInstancePicker, setShowInstancePicker] = useState(false);
  const [upcomingInstances, setUpcomingInstances] = useState<QuestInstance[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  
  const referralCode = searchParams.get('ref');

  // Check if user meets level/XP requirements
  const meetsLevelRequirement = !quest?.min_level || level >= quest.min_level;
  const meetsTreeXPRequirement = !quest?.min_tree_xp || !quest?.progression_tree || 
    (treeXP[quest.progression_tree] ?? 0) >= quest.min_tree_xp;
  const meetsRequirements = meetsLevelRequirement && meetsTreeXPRequirement;
  
  // Check capacity
  const isAtCapacity = quest?.capacity_total ? signupCount >= quest.capacity_total : false;

  useEffect(() => {
    const fetchQuest = async () => {
      if (!slug) return;
      
      // Try to find by slug first
      let { data, error } = await supabase
        .from('quests')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      
      // If not found by slug, try by ID (UUID format)
      if (!data && !error) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(slug)) {
          const result = await supabase
            .from('quests')
            .select('*')
            .eq('id', slug)
            .maybeSingle();
          data = result.data;
          error = result.error;
        }
      }
      
      if (error || !data) {
        toast({ variant: 'destructive', title: 'Quest not found' });
        navigate('/quests');
        return;
      }
      
      setQuest(data);
      
      // Fetch signup count (pending + confirmed)
      const { count } = await supabase
        .from('quest_signups')
        .select('*', { count: 'exact', head: true })
        .eq('quest_id', data.id)
        .in('status', ['pending', 'confirmed']);
      
      setSignupCount(count ?? 0);
      setIsLoading(false);
      
      // Track referral click using database function (cast to any for new RPC)
      if (referralCode) {
        await (supabase.rpc as any)('track_referral_click', { p_referral_code: referralCode });
      }
      
      // Check if user is signed up
      if (user) {
        const { data: signup } = await supabase
          .from('quest_signups')
          .select('status')
          .eq('quest_id', data.id)
          .eq('user_id', user.id)
          .maybeSingle();
        
        setUserSignup(signup);
      }
    };
    
    fetchQuest();
  }, [slug, user, referralCode]);

  const handleJoin = async (instanceIdOverride?: string) => {
    if (!quest) return;
    
    if (!user) {
      navigate('/auth', { state: { from: `/quests/${slug}`, questId: quest.id } });
      return;
    }
    
    // Check requirements
    if (!meetsRequirements) {
      toast({
        variant: 'destructive',
        title: 'Requirements not met',
        description: !meetsLevelRequirement 
          ? `You need to be level ${quest.min_level} to join this quest.`
          : `You need ${quest.min_tree_xp} XP in the ${quest.progression_tree} path.`,
      });
      return;
    }
    
    // If quest is repeatable, check for instances
    if (quest.is_repeatable && !instanceIdOverride) {
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
      } else if (instanceResult && instanceResult[0]?.instance_id) {
        // Auto-assigned to single instance
        setSelectedInstanceId(instanceResult[0].instance_id);
      }
    }
    
    setIsJoining(true);
    
    try {
      // Check if already signed up
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
        setUserSignup({ status: existing.status || 'pending' });
        return;
      }
      
      // Determine signup status based on capacity
      const status = isAtCapacity ? 'standby' : 'pending';
      
      // Create signup with instance_id if available
      const instanceId = instanceIdOverride || selectedInstanceId;
      const { error } = await supabase.from('quest_signups').insert({
        user_id: user.id,
        quest_id: quest.id,
        status,
        instance_id: instanceId,
      });
      
      if (error) {
        // Handle unique constraint violation gracefully
        if (error.code === '23505') {
          toast({
            title: "Already signed up!",
            description: "You've already joined this quest.",
          });
          return;
        }
        throw error;
      }
      
      // Record referral signup if applicable (cast to any for new RPC)
      if (referralCode) {
        await (supabase.rpc as any)('record_referral_signup', { 
          p_referral_code: referralCode, 
          p_user_id: user.id 
        });
      }
      
      toast({
        title: isAtCapacity ? "Added to waitlist!" : "Quest joined!",
        description: isAtCapacity 
          ? "You've been added to the standby list. We'll notify you if a spot opens up."
          : "You've been added to the waitlist. We'll notify you when you're confirmed.",
      });
      
      // Mark tutorial action complete and award XP for first signup
      if (!completedActions.has('quest_signup')) {
        markActionComplete('quest_signup');
        
        try {
          await awardXP.mutateAsync({
            amount: 15,
            source: 'first_quest_signup',
            sourceId: quest.id,
          });
        } catch {
          // XP award is non-critical
        }
      }
      
      setUserSignup({ status });
      setShowInstancePicker(false);
      navigate('/profile?tab=quests');
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
    setSelectedInstanceId(instanceId);
    handleJoin(instanceId);
  };

  const getDuration = () => {
    if (!quest?.start_datetime) return null;
    if (!quest?.end_datetime) return 'Single day event';
    
    const start = new Date(quest.start_datetime);
    const end = new Date(quest.end_datetime);
    const days = differenceInDays(end, start);
    const weeks = differenceInWeeks(end, start);
    
    if (weeks >= 1) return `${weeks} week${weeks > 1 ? 's' : ''}`;
    if (days >= 1) return `${days} day${days > 1 ? 's' : ''}`;
    return 'Same day';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-4xl mx-auto px-4 py-12">
          <Skeleton className="h-64 w-full rounded-xl mb-6" />
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/2 mb-8" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!quest) {
    return null;
  }

  // Handle cancelled/revoked/paused quests - show friendly unavailable message
  const isUnavailable = ['cancelled', 'revoked', 'paused'].includes(quest.status || '');
  
  if (isUnavailable) {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <div className="max-w-md mx-auto">
            <span className="text-6xl mb-6 block">{quest.icon || '🚫'}</span>
            <h1 className="text-2xl font-display font-bold mb-4">Quest No Longer Available</h1>
            <p className="text-muted-foreground mb-6">
              {quest.status === 'cancelled' 
                ? "This quest has been cancelled." 
                : quest.status === 'paused'
                ? "This quest is temporarily paused. Check back later!"
                : "This quest is no longer available."}
            </p>
            <Button onClick={() => navigate('/quests')}>
              Browse Available Quests
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[quest.status || 'draft'];
  const themeColor = THEME_COLORS[quest.theme_color as keyof typeof THEME_COLORS] || THEME_COLORS.pink;

  // Determine CTA state
  const canJoin = statusConfig.canJoin && meetsRequirements;
  const spotsRemaining = quest.capacity_total ? quest.capacity_total - signupCount : null;

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar />
      
      <main className="container max-w-4xl mx-auto px-4 py-8 flex-1 pb-32 md:pb-8">
        {/* Back button */}
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate('/quests')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Quests
        </Button>
        
        {/* Hero image */}
        {quest.image_url && (
          <div className="relative h-64 md:h-80 rounded-xl overflow-hidden mb-6">
            <img 
              src={quest.image_url} 
              alt={quest.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4 flex gap-2">
              <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
              {quest.theme && (
                <Badge className={themeColor}>{quest.theme}</Badge>
              )}
            </div>
          </div>
        )}
        
        {/* Title and icon */}
        <div className="flex items-start gap-4 mb-6">
          <span className="text-5xl">{quest.icon}</span>
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              {quest.title}
            </h1>
            {quest.progression_tree && (
              <Badge variant="outline" className="mt-2">
                {quest.progression_tree === 'culture' && '🎶 '}
                {quest.progression_tree === 'wellness' && '🏃 '}
                {quest.progression_tree === 'connector' && '🤝 '}
                {quest.progression_tree} path
              </Badge>
            )}
          </div>
        </div>
        
        {/* Requirements Alert */}
        {user && !meetsRequirements && (
          <Alert className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <Lock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>Requirements not met:</strong>
              {!meetsLevelRequirement && (
                <span className="block">• You need to be level {quest.min_level} (currently level {level})</span>
              )}
              {!meetsTreeXPRequirement && (
                <span className="block">• You need {quest.min_tree_xp} XP in the {quest.progression_tree} path (currently {treeXP[quest.progression_tree!] ?? 0} XP)</span>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Capacity Warning */}
        {isAtCapacity && statusConfig.canJoin && (
          <Alert className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              This quest is at capacity. You can still join the standby list and we'll notify you if a spot opens up.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Metadata cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quest.start_datetime && (
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(quest.start_datetime), 'MMM d, yyyy')}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {getDuration() && (
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="font-medium">{getDuration()}</p>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Cost</p>
                <p className="font-medium">{quest.cost_description || 'Free'}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Capacity</p>
                <p className="font-medium">
                  {signupCount}/{quest.capacity_total} 
                  {spotsRemaining !== null && spotsRemaining > 0 && (
                    <span className="text-muted-foreground text-xs ml-1">
                      ({spotsRemaining} left)
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Location */}
        {quest.meeting_location_name && (
          <Card className="mb-8">
            <CardContent className="p-4 flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">{quest.meeting_location_name}</p>
                {quest.meeting_address && (
                  <p className="text-sm text-muted-foreground">{quest.meeting_address}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Description */}
        {quest.short_description && (
          <div className="mb-8">
            <h2 className="font-display text-xl font-semibold mb-3">About This Quest</h2>
            <p className="text-muted-foreground leading-relaxed">{quest.short_description}</p>
          </div>
        )}
        
        {/* Rewards */}
        {quest.rewards && (
          <Card className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
            <CardContent className="p-4 flex items-center gap-3">
              <Award className="h-6 w-6 text-amber-600" />
              <div>
                <p className="text-xs text-amber-700 dark:text-amber-300">Rewards</p>
                <p className="font-medium text-amber-900 dark:text-amber-100">{quest.rewards}</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Tags */}
        {quest.tags && quest.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {quest.tags.map(tag => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        )}
        
        {/* CTA Section - Fixed on mobile */}
        <div className="fixed bottom-0 inset-x-0 p-4 pb-safe bg-background/95 backdrop-blur-sm border-t shadow-lg md:relative md:bottom-auto md:inset-x-auto md:p-0 md:pb-0 md:bg-transparent md:backdrop-blur-none md:border-0 md:shadow-none md:mt-8 z-40">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 md:bg-background/95 md:backdrop-blur-sm md:p-4 md:rounded-xl md:border md:shadow-lg">
            <div className="text-center sm:text-left w-full sm:w-auto">
              {userSignup ? (
                <p className="text-sm text-muted-foreground">
                  You're <span className="font-medium text-foreground">{userSignup.status}</span> for this quest
                </p>
              ) : !meetsRequirements && user ? (
                <p className="text-sm text-muted-foreground">
                  <Lock className="inline h-3 w-3 mr-1" />
                  Complete more quests to unlock this one
                </p>
              ) : isAtCapacity && statusConfig.canJoin ? (
                <p className="text-sm text-muted-foreground">
                  Quest is full — join the standby list
                </p>
              ) : statusConfig.canJoin ? (
                <p className="text-sm text-muted-foreground">
                  Ready to join? {spotsRemaining !== null && `${spotsRemaining} spots left!`}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This quest is not currently accepting signups.
                </p>
              )}
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              {userSignup ? (
                <>
                  <ShareQuestButton quest={quest} />
                  <Button onClick={() => navigate('/my-quests')} className="flex-1 sm:flex-initial min-h-[48px]">
                    View My Quests
                  </Button>
                </>
              ) : canJoin ? (
                <Button size="lg" onClick={() => handleJoin()} disabled={isJoining} className="w-full sm:w-auto min-h-[48px]">
                  {isJoining ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining...
                    </>
                  ) : isAtCapacity ? (
                    'Join Standby List'
                  ) : (
                    'Join This Quest'
                  )}
                </Button>
              ) : !meetsRequirements && user ? (
                <Button size="lg" disabled variant="secondary" className="w-full sm:w-auto min-h-[48px]">
                  <Lock className="mr-2 h-4 w-4" />
                  Locked
                </Button>
              ) : !user && statusConfig.canJoin ? (
                <Button size="lg" onClick={() => handleJoin()} className="w-full sm:w-auto min-h-[48px]">
                  Sign In to Join
                </Button>
              ) : (
                <Button size="lg" disabled className="w-full sm:w-auto min-h-[48px]">
                  {statusConfig.label}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Contextual Help Button */}
      <GetHelpButton
        variant="floating"
        contextQuestId={quest.id}
        contextQuestTitle={quest.title}
      />
      
      {/* Instance Picker Modal */}
      <InstancePicker
        open={showInstancePicker}
        onOpenChange={setShowInstancePicker}
        instances={upcomingInstances}
        questTitle={quest.title}
        onSelectInstance={handleInstanceSelect}
        isLoading={isJoining}
      />
      
      <Footer />
    </div>
  );
}