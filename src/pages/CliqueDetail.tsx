import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { CliqueRolesManager } from '@/components/cliques/CliqueRolesManager';
import { CliqueSettingsModal } from '@/components/cliques/CliqueSettingsModal';
import { CliqueApplicationsInbox } from '@/components/cliques/CliqueApplicationsInbox';
import { GetHelpButton } from '@/components/support';
import { 
  Loader2, 
  ArrowLeft, 
  Users, 
  Crown, 
  Calendar,
  LogOut,
  CheckCircle2,
  Settings,
  MessageSquare,
  BookOpen,
  BarChart3,
  Copy,
  Archive
} from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
import { PUBLISHED_URL } from '@/lib/config';

interface CliqueMember {
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

interface Clique {
  id: string;
  name: string;
  created_at: string;
  origin_quest_id: string | null;
  origin_quest_title?: string;
  invite_code: string;
  theme_tags: string[];
  commitment_style: string;
  org_code: string | null;
  clique_rules: string | null;
  lfc_listing_enabled: boolean;
  role_rotation_mode: 'manual' | 'per_quest' | 'monthly';
  archived_at: string | null;
}

export default function CliqueDetail() {
  const { cliqueId } = useParams<{ cliqueId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [clique, setClique] = useState<Clique | null>(null);
  const [members, setMembers] = useState<CliqueMember[]>([]);
  const [questHistory, setQuestHistory] = useState<QuestHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [activeTab, setActiveTab] = useState('members');

  const currentMember = members.find(m => m.user_id === user?.id);
  const isLeader = currentMember?.role === 'leader';
  const isArchived = !!clique?.archived_at;

  useEffect(() => {
    const fetchCliqueDetails = async () => {
      if (!cliqueId || !user) return;

      // Fetch clique info
      const { data: cliqueData, error: cliqueError } = await supabase
        .from('squads')
        .select('id, name, created_at, origin_quest_id, invite_code, theme_tags, commitment_style, org_code, clique_rules, lfc_listing_enabled, role_rotation_mode, archived_at')
        .eq('id', cliqueId)
        .maybeSingle();

      if (cliqueError || !cliqueData) {
        navigate('/profile?tab=cliques');
        return;
      }

      let originQuestTitle: string | undefined;
      if (cliqueData.origin_quest_id) {
        const { data: questData } = await supabase
          .from('quests')
          .select('title')
          .eq('id', cliqueData.origin_quest_id)
          .maybeSingle();
        originQuestTitle = questData?.title;
      }

      setClique({ 
        ...cliqueData, 
        origin_quest_title: originQuestTitle,
        theme_tags: cliqueData.theme_tags || [],
        commitment_style: cliqueData.commitment_style || 'casual',
        role_rotation_mode: cliqueData.role_rotation_mode || 'manual',
        lfc_listing_enabled: cliqueData.lfc_listing_enabled || false,
      } as Clique);

      // Fetch members
      const { data: memberData } = await supabase
        .from('squad_members')
        .select('id, user_id, role, added_at')
        .eq('persistent_squad_id', cliqueId)
        .eq('status', 'active');

      if (memberData) {
        // Get profiles
        const userIds = memberData.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', userIds);

        const membersWithNames: CliqueMember[] = memberData.map(m => {
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
        .eq('squad_id', cliqueId)
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

    fetchCliqueDetails();
  }, [cliqueId, user, navigate]);

  const handleLeaveClique = async () => {
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
        title: 'Failed to leave clique',
        description: 'Please try again.'
      });
      setIsLeaving(false);
      return;
    }
    
    toast({
      title: 'Left clique',
      description: `You've left ${clique?.name}.`
    });
    
    navigate('/profile?tab=cliques');
  };

  const handleCopyInviteCode = () => {
    if (!clique?.invite_code) return;
    navigator.clipboard.writeText(clique.invite_code);
    sonnerToast.success('Invite code copied!');
  };

  const handleCopyInviteLink = () => {
    if (!clique?.invite_code) return;
    const link = `${PUBLISHED_URL}/join/${clique.invite_code}`;
    navigator.clipboard.writeText(link);
    sonnerToast.success('Invite link copied!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!clique) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-display font-bold mb-4">Clique not found</h1>
          <Button asChild>
            <Link to="/profile?tab=cliques">Back to My Cliques</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <Link 
          to="/profile?tab=cliques" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Cliques
        </Link>
        
        {/* Clique Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-display font-bold text-foreground">
                    {clique.name}
                  </h1>
                  {isArchived && (
                    <Badge variant="secondary" className="gap-1">
                      <Archive className="h-3 w-3" />
                      Archived
                    </Badge>
                  )}
                </div>
                {clique.origin_quest_title && (
                  <p className="text-sm text-muted-foreground">
                    Formed after: {clique.origin_quest_title}
                  </p>
                )}
              </div>
            </div>
            
            {isLeader && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowSettingsModal(true)}
              >
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
            )}
          </div>

          {/* Theme tags */}
          {clique.theme_tags && clique.theme_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {clique.theme_tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {members.length}/6 members
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Formed {new Date(clique.created_at).toLocaleDateString('en-US', { 
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

          {/* Invite code section */}
          {!isArchived && (
            <div className="flex items-center gap-2 mt-4 p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Invite Code:</span>
              <code className="font-mono font-medium">{clique.invite_code}</code>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCopyInviteCode}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button variant="link" className="text-sm p-0 h-auto" onClick={handleCopyInviteLink}>
                Copy link
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="members" className="gap-1">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Members</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-1">
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">Roles</span>
            </TabsTrigger>
            <TabsTrigger value="quests" className="gap-1">
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">Quests</span>
            </TabsTrigger>
            <TabsTrigger value="lore" className="gap-1">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Lore</span>
            </TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members">
            <div className="space-y-4">
              {/* Applications Inbox (Leader only) */}
              {isLeader && !isArchived && (
                <CliqueApplicationsInbox
                  cliqueId={cliqueId!}
                  currentUserId={user?.id || ''}
                  isLeader={isLeader}
                  onApplicationProcessed={() => {
                    // Refresh members
                    window.location.reload();
                  }}
                />
              )}
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-display">Members ({members.length}/6)</CardTitle>
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
                            <div className="p-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
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
                              <Badge variant="outline" className="ml-2 text-xs">Clique Leader</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles">
            <CliqueRolesManager
              cliqueId={cliqueId!}
              members={members}
              isLeader={isLeader}
              currentUserId={user?.id || ''}
            />
          </TabsContent>

          {/* Quests Tab */}
          <TabsContent value="quests">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display">Quest History</CardTitle>
              </CardHeader>
              <CardContent>
                {questHistory.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">
                    No quests completed together yet.
                  </p>
                ) : (
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lore Tab */}
          <TabsContent value="lore">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display">Clique Lore</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-6">
                  Lore entries coming soon! This will include photos, memories, and inside jokes.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Actions */}
        {!isArchived && (
          <div className="pt-4 border-t">
            <Button 
              variant="outline" 
              className="text-destructive hover:text-destructive"
              onClick={() => setShowLeaveDialog(true)}
              disabled={isLeader && members.length > 1}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Leave Clique
            </Button>
            {isLeader && members.length > 1 && (
              <p className="text-sm text-muted-foreground mt-2">
                Transfer leadership before leaving the clique.
              </p>
            )}
          </div>
        )}
      </main>
      
      <Footer />
      
      {/* Leave Confirmation Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave {clique.name}?</DialogTitle>
            <DialogDescription>
              You'll no longer be part of this clique's future quests. You can always be invited back by another member.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeaveDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleLeaveClique}
              disabled={isLeaving}
            >
              {isLeaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Leave Clique
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      {clique && (
        <CliqueSettingsModal
          open={showSettingsModal}
          onOpenChange={setShowSettingsModal}
          cliqueId={cliqueId!}
          settings={{
            name: clique.name,
            invite_code: clique.invite_code,
            theme_tags: clique.theme_tags,
            commitment_style: clique.commitment_style,
            org_code: clique.org_code,
            clique_rules: clique.clique_rules,
            lfc_listing_enabled: clique.lfc_listing_enabled,
            role_rotation_mode: clique.role_rotation_mode,
            archived_at: clique.archived_at,
          }}
          members={members}
          currentUserId={user?.id || ''}
        />
      )}

      {/* Contextual Help Button */}
      <GetHelpButton
        variant="floating"
        contextSquadId={cliqueId}
        contextSquadName={clique?.name}
      />
    </div>
  );
}
