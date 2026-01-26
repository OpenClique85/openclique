/**
 * =============================================================================
 * JOIN CLIQUE PAGE - Handle invite code/link redemption
 * =============================================================================
 * 
 * Route: /join/:code
 * 
 * Validates the invite code, shows clique preview, and allows user to join.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Users, 
  Loader2, 
  AlertCircle, 
  Check,
  Crown,
  ArrowRight
} from 'lucide-react';

// Theme tag display helper
const THEME_TAG_EMOJIS: Record<string, string> = {
  movies: '🎬',
  outdoors: '🥾',
  food: '🍕',
  music: '🎵',
  fitness: '💪',
  gaming: '🎮',
  arts: '🎨',
  sports: '⚽',
  books: '📚',
  travel: '✈️',
  coffee: '☕',
  wellness: '🧘',
  tech: '💻',
  nature: '🌿',
  pets: '🐕',
  nightlife: '🌙',
};

interface CliquePreview {
  id: string;
  name: string;
  theme_tags: string[];
  commitment_style: string;
  org_code: string | null;
  max_members: number;
  member_count: number;
  members: Array<{
    user_id: string;
    display_name: string;
    role: string;
  }>;
}

export default function JoinClique() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clique, setClique] = useState<CliquePreview | null>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);

  useEffect(() => {
    const fetchClique = async () => {
      if (!code) {
        setError('Invalid invite code');
        setIsLoading(false);
        return;
      }

      try {
        // Find clique by invite code
        const { data: cliqueData, error: cliqueError } = await supabase
          .from('squads')
          .select('id, name, theme_tags, commitment_style, org_code, max_members')
          .eq('invite_code', code.toUpperCase())
          .single();

        if (cliqueError || !cliqueData) {
          setError('Invalid or expired invite code');
          setIsLoading(false);
          return;
        }

        // Get members
        const { data: members } = await supabase
          .from('squad_members')
          .select('user_id, role')
          .eq('persistent_squad_id', cliqueData.id)
          .eq('status', 'active');

        const memberUserIds = members?.map(m => m.user_id) || [];
        
        // Get member profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', memberUserIds);

        const membersWithNames = (members || []).map(m => {
          const profile = profiles?.find(p => p.id === m.user_id);
          return {
            user_id: m.user_id,
            display_name: profile?.display_name || 'Unknown',
            role: m.role || 'member',
          };
        });

        // Check if current user is already a member
        if (user && memberUserIds.includes(user.id)) {
          setAlreadyMember(true);
        }

        setClique({
          ...cliqueData,
          theme_tags: cliqueData.theme_tags || [],
          member_count: membersWithNames.length,
          members: membersWithNames,
        });
      } catch (err) {
        console.error('Error fetching clique:', err);
        setError('Something went wrong');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClique();
  }, [code, user]);

  const handleJoin = async () => {
    if (!user) {
      // Store the join code and redirect to auth
      sessionStorage.setItem('pendingJoinCode', code || '');
      navigate('/auth');
      return;
    }

    if (!clique) return;

    // Check if clique is full
    if (clique.member_count >= clique.max_members) {
      toast.error('This clique is full');
      return;
    }

    setIsJoining(true);

    try {
      const { error: joinError } = await supabase
        .from('squad_members')
        .insert({
          squad_id: clique.id,
          persistent_squad_id: clique.id,
          user_id: user.id,
          role: 'member',
          status: 'active',
        });

      if (joinError) {
        if (joinError.code === '23505') {
          toast.error('You are already a member of this clique');
        } else {
          throw joinError;
        }
        return;
      }

      toast.success(`Welcome to ${clique.name}! 🎉`);
      navigate(`/cliques/${clique.id}`);
    } catch (err: any) {
      console.error('Error joining clique:', err);
      toast.error(err.message || 'Failed to join clique');
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !clique) {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <h2 className="text-xl font-display font-bold mb-2">
                Invalid Invite
              </h2>
              <p className="text-muted-foreground mb-6">
                {error || 'This invite code is invalid or has expired.'}
              </p>
              <Button onClick={() => navigate('/profile?tab=cliques')}>
                Go to My Cliques
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const leader = clique.members.find(m => m.role === 'leader');
  const isFull = clique.member_count >= clique.max_members;

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-display">
                {clique.name}
              </CardTitle>
              <CardDescription>
                You've been invited to join this clique
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Theme Tags */}
              {clique.theme_tags.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {clique.theme_tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {THEME_TAG_EMOJIS[tag] || '🏷️'} {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Commitment Style */}
              <div className="text-center">
                <Badge variant="outline" className="capitalize">
                  {clique.commitment_style?.replace('-', ' ') || 'Casual'}
                </Badge>
                {clique.org_code && (
                  <Badge variant="outline" className="ml-2">
                    {clique.org_code}
                  </Badge>
                )}
              </div>

              {/* Members */}
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  {clique.member_count}/{clique.max_members} members
                </p>
                <div className="flex justify-center gap-2">
                  {clique.members.slice(0, 6).map((member) => (
                    <div key={member.user_id} className="flex flex-col items-center">
                      <Avatar className="h-10 w-10 border-2 border-background">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {member.display_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground mt-1 max-w-[60px] truncate">
                        {member.display_name}
                      </span>
                      {member.role === 'leader' && (
                        <Crown className="h-3 w-3 text-amber-500" />
                      )}
                    </div>
                  ))}
                </div>
                {leader && (
                  <p className="text-sm text-center text-muted-foreground">
                    Led by <span className="font-medium">{leader.display_name}</span>
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="pt-4 space-y-3">
                {alreadyMember ? (
                  <>
                    <div className="flex items-center justify-center gap-2 text-primary">
                      <Check className="h-5 w-5" />
                      <span className="font-medium">You're already a member</span>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => navigate(`/cliques/${clique.id}`)}
                    >
                      Go to Clique
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </>
                ) : isFull ? (
                  <div className="text-center">
                    <p className="text-destructive font-medium mb-4">
                      This clique is full
                    </p>
                    <Button 
                      variant="outline"
                      onClick={() => navigate('/profile?tab=cliques')}
                    >
                      Browse Other Cliques
                    </Button>
                  </div>
                ) : (
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleJoin}
                    disabled={isJoining}
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Joining...
                      </>
                    ) : user ? (
                      <>
                        <Users className="h-4 w-4 mr-2" />
                        Join {clique.name}
                      </>
                    ) : (
                      <>
                        Sign In to Join
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
