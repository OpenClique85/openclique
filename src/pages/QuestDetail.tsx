import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import ShareQuestButton from '@/components/ShareQuestButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Award,
  DollarSign,
  ArrowLeft,
  Loader2
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
  
  const [quest, setQuest] = useState<Quest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [userSignup, setUserSignup] = useState<{ status: string } | null>(null);
  
  const referralCode = searchParams.get('ref');

  useEffect(() => {
    const fetchQuest = async () => {
      if (!slug) return;
      
      const { data, error } = await supabase
        .from('quests')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      
      if (error || !data) {
        toast({ variant: 'destructive', title: 'Quest not found' });
        navigate('/quests');
        return;
      }
      
      setQuest(data);
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

  const handleJoin = async () => {
    if (!quest) return;
    
    if (!user) {
      navigate('/auth', { state: { from: `/quests/${slug}`, questId: quest.id } });
      return;
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
      
      // Create signup
      const { error } = await supabase.from('quest_signups').insert({
        user_id: user.id,
        quest_id: quest.id,
        status: 'pending',
      });
      
      if (error) throw error;
      
      // Record referral signup if applicable (cast to any for new RPC)
      if (referralCode) {
        await (supabase.rpc as any)('record_referral_signup', { 
          p_referral_code: referralCode, 
          p_user_id: user.id 
        });
      }
      
      toast({
        title: "Quest joined!",
        description: "You've been added to the waitlist. We'll notify you when you're confirmed.",
      });
      
      setUserSignup({ status: 'pending' });
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

  const statusConfig = STATUS_CONFIG[quest.status || 'draft'];
  const themeColor = THEME_COLORS[quest.theme_color as keyof typeof THEME_COLORS] || THEME_COLORS.pink;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container max-w-4xl mx-auto px-4 py-8">
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
                <p className="text-xs text-muted-foreground">Squad Size</p>
                <p className="font-medium">{quest.capacity_total} people</p>
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
        
        {/* CTA Section */}
        <div className="sticky bottom-4 bg-background/95 backdrop-blur-sm p-4 rounded-xl border shadow-lg">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              {userSignup ? (
                <p className="text-sm text-muted-foreground">
                  You're <span className="font-medium text-foreground">{userSignup.status}</span> for this quest
                </p>
              ) : statusConfig.canJoin ? (
                <p className="text-sm text-muted-foreground">
                  Ready to join? Spots are limited!
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This quest is not currently accepting signups.
                </p>
              )}
            </div>
            
            <div className="flex gap-2">
              {userSignup ? (
                <>
                  <ShareQuestButton quest={quest} />
                  <Button onClick={() => navigate('/my-quests')}>
                    View My Quests
                  </Button>
                </>
              ) : statusConfig.canJoin ? (
                <Button size="lg" onClick={handleJoin} disabled={isJoining}>
                  {isJoining ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    'Join This Quest'
                  )}
                </Button>
              ) : (
                <Button size="lg" disabled>
                  {statusConfig.label}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
