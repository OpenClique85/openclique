import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  ArrowLeft, 
  Users, 
  Crown, 
  Calendar,
  LogOut,
  CheckCircle2
} from 'lucide-react';

interface SquadMember {
  id: string;
  user_id: string;
  display_name: string;
  role: 'leader' | 'member';
  joined_at: string;
}

interface QuestHistory {
  id: string;
  title: string;
  icon: string;
  start_datetime: string;
  status: string;
}

interface Squad {
  id: string;
  name: string;
  created_at: string;
  origin_quest_id: string | null;
  origin_quest_title?: string;
}

export default function SquadDetail() {
  const { squadId } = useParams<{ squadId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [squad, setSquad] = useState<Squad | null>(null);
  const [members, setMembers] = useState<SquadMember[]>([]);
  const [questHistory, setQuestHistory] = useState<QuestHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const currentMember = members.find(m => m.user_id === user?.id);
  const isLeader = currentMember?.role === 'leader';

  useEffect(() => {
    const fetchSquadDetails = async () => {
      if (!squadId || !user) return;

      // Fetch squad info
      const { data: squadData, error: squadError } = await supabase
        .from('squads')
        .select('id, name, created_at, origin_quest_id')
        .eq('id', squadId)
        .maybeSingle();

      if (squadError || !squadData) {
        navigate('/my-quests');
        return;
      }

      let originQuestTitle: string | undefined;
      if (squadData.origin_quest_id) {
        const { data: questData } = await supabase
          .from('quests')
          .select('title')
          .eq('id', squadData.origin_quest_id)
          .maybeSingle();
        originQuestTitle = questData?.title;
      }

      setSquad({ ...squadData, origin_quest_title: originQuestTitle });

      // Fetch members
      const { data: memberData } = await supabase
        .from('squad_members')
        .select('id, user_id, role, added_at')
        .eq('persistent_squad_id', squadId)
        .eq('status', 'active');

      if (memberData) {
        // Get profiles
        const userIds = memberData.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', userIds);

        const membersWithNames: SquadMember[] = memberData.map(m => {
          const profile = profiles?.find(p => p.id === m.user_id);
          return {
            id: m.id,
            user_id: m.user_id,
            display_name: profile?.display_name || 'Unknown',
            role: (m.role as 'leader' | 'member') || 'member',
            joined_at: m.added_at
          };
        });

        // Sort: leader first, then alphabetically
        membersWithNames.sort((a, b) => {
          if (a.role === 'leader') return -1;
          if (b.role === 'leader') return 1;
          return a.display_name.localeCompare(b.display_name);
        });

        setMembers(membersWithNames);
      }

      // Fetch quest history (from completed squad_quest_invites)
      const { data: invites } = await supabase
        .from('squad_quest_invites')
        .select('quest_id')
        .eq('squad_id', squadId)
        .eq('status', 'accepted');

      if (invites && invites.length > 0) {
        const questIds = invites.map(i => i.quest_id);
        const { data: quests } = await supabase
          .from('quests')
          .select('id, title, icon, start_datetime, status')
          .in('id', questIds)
          .order('start_datetime', { ascending: false });

        if (quests) {
          setQuestHistory(quests.map(q => ({
            id: q.id,
            title: q.title,
            icon: q.icon || '🎯',
            start_datetime: q.start_datetime || '',
            status: q.status || ''
          })));
        }
      }

      setIsLoading(false);
    };

    fetchSquadDetails();
  }, [squadId, user, navigate]);

  const handleLeaveSquad = async () => {
    if (!currentMember || !user) return;
    
    setIsLeaving(true);
    
    const { error } = await supabase
      .from('squad_members')
      .update({ status: 'left' })
      .eq('id', currentMember.id)
      .eq('user_id', user.id);
    
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to leave squad',
        description: 'Please try again.'
      });
      setIsLeaving(false);
      return;
    }
    
    toast({
      title: 'Left squad',
      description: `You've left ${squad?.name}.`
    });
    
    navigate('/my-quests');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!squad) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-display font-bold mb-4">Squad not found</h1>
          <Button asChild>
            <Link to="/my-quests">Back to My Quests</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <Link 
          to="/my-quests" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Quests
        </Link>
        
        {/* Squad Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">
                {squad.name}
              </h1>
              {squad.origin_quest_title && (
                <p className="text-sm text-muted-foreground">
                  Formed after: {squad.origin_quest_title}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {members.length} members
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Formed {new Date(squad.created_at).toLocaleDateString('en-US', { 
                month: 'short', 
                year: 'numeric' 
              })}
            </span>
            {questHistory.length > 0 && (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                {questHistory.length} quest{questHistory.length !== 1 ? 's' : ''} completed
              </span>
            )}
          </div>
        </div>
        
        {/* Members */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-display">Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {members.map((member) => (
                <div 
                  key={member.id} 
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {member.role === 'leader' ? (
                      <div className="p-1.5 rounded-full bg-amber-100 text-amber-600">
                        <Crown className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {member.display_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">
                        {member.user_id === user?.id ? 'You' : member.display_name}
                      </span>
                      {member.role === 'leader' && (
                        <Badge variant="outline" className="ml-2 text-xs">Leader</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Quest History */}
        {questHistory.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-display">Quest History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {questHistory.map((quest) => (
                  <div 
                    key={quest.id} 
                    className="flex items-center gap-3 py-2 border-b last:border-0"
                  >
                    <span className="text-2xl">{quest.icon}</span>
                    <div>
                      <p className="font-medium">{quest.title}</p>
                      {quest.start_datetime && (
                        <p className="text-sm text-muted-foreground">
                          {new Date(quest.start_datetime).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="ml-auto">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Actions */}
        <div className="pt-4 border-t">
          <Button 
            variant="outline" 
            className="text-destructive hover:text-destructive"
            onClick={() => setShowLeaveDialog(true)}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Leave Squad
          </Button>
        </div>
      </main>
      
      <Footer />
      
      {/* Leave Confirmation Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave {squad.name}?</DialogTitle>
            <DialogDescription>
              You'll no longer be part of this squad's future quests. You can always be invited back by another member.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeaveDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleLeaveSquad}
              disabled={isLeaving}
            >
              {isLeaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Leave Squad
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
