/**
 * =============================================================================
 * SIGNUPS MANAGER - Admin tool for managing quest signups and attendance
 * =============================================================================
 * 
 * Purpose: View and manage user signups for quests. Key admin operations:
 *   - View all signups filtered by status
 *   - Update signup status (pending → confirmed → completed)
 *   - Generate squad recommendations for group quests
 *   - Send feedback reminder notifications
 * 
 * XP Award Flow:
 *   When status is changed to 'completed', the updateStatus() function:
 *   1. Updates quest_signups.status to 'completed'
 *   2. Calls award_quest_xp(user_id, quest_id) RPC
 *   3. award_quest_xp() internally calls:
 *      - award_xp() for global XP
 *      - award_tree_xp() for tree-specific XP
 *      - check_and_unlock_achievements() for auto-unlocks
 *   4. Shows toast with XP awarded and new total
 * 
 * Database Dependencies:
 *   - quest_signups: User signup records with status
 *   - quests: Quest metadata including base_xp
 *   - profiles: User display names and emails
 *   - notifications: For feedback reminder creation
 * 
 * Location: Admin Console → Operations → Signups
 * 
 * @component SignupsManager
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MoreHorizontal, Eye, EyeOff, Users, Mail, Trophy, Flame } from 'lucide-react';
import { format } from 'date-fns';
import type { Tables, Enums } from '@/integrations/supabase/types';
import { SquadRecommendationModal } from './SquadRecommendationModal';
import { showAchievementToast, showStreakToast } from '@/components/AchievementUnlockToast';
import { auditLog } from '@/lib/auditLog';

type Quest = Tables<'quests'>;
type QuestSignup = Tables<'quest_signups'>;
type Profile = Tables<'profiles'>;
type SignupStatus = Enums<'signup_status'>;

interface SignupWithProfile extends QuestSignup {
  profile: Profile | null;
}

const STATUS_COLORS: Record<SignupStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  standby: 'bg-blue-100 text-blue-700',
  dropped: 'bg-red-100 text-red-700',
  no_show: 'bg-orange-100 text-orange-700',
  completed: 'bg-purple-100 text-purple-700',
};

export function SignupsManager() {
  const { toast } = useToast();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [selectedQuestId, setSelectedQuestId] = useState<string>('');
  const [signups, setSignups] = useState<SignupWithProfile[]>([]);
  const [feedbackCounts, setFeedbackCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [showEmails, setShowEmails] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showSquadModal, setShowSquadModal] = useState(false);

  const selectedQuest = quests.find(q => q.id === selectedQuestId);

  useEffect(() => {
    const fetchQuests = async () => {
      const { data } = await supabase
        .from('quests')
        .select('*')
        .order('start_datetime', { ascending: false });
      
      if (data && data.length > 0) {
        setQuests(data);
        setSelectedQuestId(data[0].id);
      }
      setIsLoading(false);
    };
    
    fetchQuests();
  }, []);

  useEffect(() => {
    if (selectedQuestId) {
      fetchSignups();
    }
  }, [selectedQuestId]);

  const fetchSignups = async () => {
    if (!selectedQuestId) return;
    
    const { data: signupsData } = await supabase
      .from('quest_signups')
      .select('*')
      .eq('quest_id', selectedQuestId)
      .order('signed_up_at', { ascending: true });
    
    if (signupsData) {
      const userIds = signupsData.map(s => s.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);
      
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      const merged = signupsData.map(s => ({
        ...s,
        profile: profilesMap.get(s.user_id) || null
      }));
      setSignups(merged);
      
      // Fetch feedback count for this quest
      const { count } = await supabase
        .from('feedback')
        .select('*', { count: 'exact', head: true })
        .eq('quest_id', selectedQuestId);
      
      setFeedbackCounts(prev => ({ ...prev, [selectedQuestId]: count || 0 }));
    }
  };

  const sendFeedbackReminder = async () => {
    if (!selectedQuest) return;
    
    setIsSendingReminder(true);
    
    // Get users who completed/confirmed but haven't given feedback
    const confirmedUserIds = signups
      .filter(s => ['confirmed', 'completed'].includes(s.status || ''))
      .map(s => s.user_id);
    
    // Get users who already submitted feedback
    const { data: feedbackData } = await supabase
      .from('feedback')
      .select('user_id')
      .eq('quest_id', selectedQuestId);
    
    const usersWithFeedback = new Set(feedbackData?.map(f => f.user_id) || []);
    const usersNeedingReminder = confirmedUserIds.filter(id => !usersWithFeedback.has(id));
    
    if (usersNeedingReminder.length === 0) {
      toast({ title: 'All attendees have already submitted feedback!' });
      setIsSendingReminder(false);
      return;
    }
    
    // Create notifications for each user
    // Using 'general' type since feedback_request was just added to enum
    const notifications = usersNeedingReminder.map(userId => ({
      user_id: userId,
      type: 'general' as const,
      title: `How was ${selectedQuest.title}?`,
      body: `We'd love your feedback! Takes just 60 seconds.`,
      quest_id: selectedQuestId,
    }));
    
    const { error } = await supabase.from('notifications').insert(notifications);
    
    if (error) {
      toast({ variant: 'destructive', title: 'Failed to send reminders' });
    } else {
      toast({ title: `Sent ${usersNeedingReminder.length} feedback reminder(s)` });
    }
    
    setIsSendingReminder(false);
  };

  const updateStatus = async (signupId: string, newStatus: SignupStatus) => {
    // Find the signup to get user_id
    const signup = signups.find(s => s.id === signupId);
    if (!signup) {
      toast({ variant: 'destructive', title: 'Signup not found' });
      return;
    }
    
    // Check if already completed (prevent double XP)
    const wasAlreadyCompleted = signup.status === 'completed';
    
    const { error } = await supabase
      .from('quest_signups')
      .update({ status: newStatus })
      .eq('id', signupId);
    
    if (error) {
      toast({ variant: 'destructive', title: 'Failed to update status' });
      return;
    }
    
    // Audit log the status change
    await auditLog({
      action: 'status_change',
      targetTable: 'quest_signups',
      targetId: signupId,
      oldValues: { status: signup.status, user_id: signup.user_id },
      newValues: { status: newStatus },
    });
    
    // Award XP when marking as completed (and wasn't already completed)
    if (newStatus === 'completed' && !wasAlreadyCompleted) {
      // Get achievements before awarding XP to compare after
      const { data: achievementsBefore } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', signup.user_id);
      
      const beforeIds = new Set(achievementsBefore?.map(a => a.achievement_id) || []);
      
      // Award XP (this also triggers streak updates and achievement checks)
      const { data: xpAwarded, error: xpError } = await supabase
        .rpc('award_quest_xp', {
          p_user_id: signup.user_id,
          p_quest_id: selectedQuestId
        });
      
      if (xpError) {
        console.error('Failed to award XP:', xpError);
        toast({ 
          variant: 'destructive', 
          title: 'Status updated but XP award failed',
          description: xpError.message
        });
      } else {
        toast({ 
          title: `Completed! +${selectedQuest?.base_xp || 50} XP awarded`,
          description: `${signup.profile?.display_name || 'User'} now has ${xpAwarded} total XP`
        });
        
        // Check for newly unlocked achievements
        const { data: achievementsAfter } = await supabase
          .from('user_achievements')
          .select('achievement_id, achievement:achievement_templates(name, icon, xp_reward)')
          .eq('user_id', signup.user_id);
        
        const newAchievements = achievementsAfter
          ?.filter(a => !beforeIds.has(a.achievement_id))
          .map(a => ({
            name: (a.achievement as any)?.name || 'Achievement',
            icon: (a.achievement as any)?.icon || null,
            xp_reward: (a.achievement as any)?.xp_reward || 0,
          })) || [];
        
        if (newAchievements.length > 0) {
          // Show achievement toast (will be visible to admin, but demonstrates the feature)
          showAchievementToast(newAchievements);
          
          // Also create in-app notifications for the user
          const notifications = newAchievements.map(achievement => ({
            user_id: signup.user_id,
            type: 'general' as const,
            title: `🏆 Achievement Unlocked: ${achievement.name}`,
            body: `You earned +${achievement.xp_reward} XP bonus!`,
          }));
          
          await supabase.from('notifications').insert(notifications);
        }
      }
    } else {
      toast({ title: `Status updated to ${newStatus}` });
    }
    
    fetchSignups();
  };

  const filteredSignups = signups.filter(s => 
    statusFilter === 'all' || s.status === statusFilter
  );

  const counts = {
    all: signups.length,
    pending: signups.filter(s => s.status === 'pending').length,
    confirmed: signups.filter(s => s.status === 'confirmed').length,
    standby: signups.filter(s => s.status === 'standby').length,
    dropped: signups.filter(s => s.status === 'dropped').length,
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (quests.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No quests yet. Create one first!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quest Selector */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-sm">
          <Select value={selectedQuestId} onValueChange={setSelectedQuestId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a quest" />
            </SelectTrigger>
            <SelectContent>
              {quests.map((quest) => (
                <SelectItem key={quest.id} value={quest.id}>
                  {quest.icon} {quest.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowEmails(!showEmails)}
        >
          {showEmails ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
          {showEmails ? 'Hide Emails' : 'Show Emails'}
        </Button>
        
        {/* Generate Squads button - show when there are pending signups */}
        {counts.pending >= 3 && (
          <Button
            onClick={() => setShowSquadModal(true)}
          >
            <Users className="mr-2 h-4 w-4" />
            Generate Squads ({counts.pending} pending)
          </Button>
        )}
        
        {/* Feedback Reminder button - show for past quests */}
        {selectedQuest?.start_datetime && new Date(selectedQuest.start_datetime) < new Date() && (
          <Button
            variant="outline"
            onClick={sendFeedbackReminder}
            disabled={isSendingReminder}
          >
            {isSendingReminder ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            Send Feedback Reminder
          </Button>
        )}
      </div>
      
      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'confirmed', 'standby', 'dropped'] as const).map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({counts[status]})
          </Button>
        ))}
      </div>
      
      {/* Signups Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Signups ({filteredSignups.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSignups.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No signups {statusFilter !== 'all' ? `with status "${statusFilter}"` : 'yet'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  {showEmails && <TableHead>Email</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Signed Up</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSignups.map((signup) => (
                  <TableRow key={signup.id}>
                    <TableCell className="font-medium">
                      {signup.profile?.display_name || 'Unknown'}
                    </TableCell>
                    {showEmails && (
                      <TableCell className="text-muted-foreground">
                        {signup.profile?.email || '—'}
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge className={STATUS_COLORS[signup.status || 'pending']}>
                        {signup.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(signup.signed_up_at), 'MMM d, h:mm a')}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                      {signup.cancellation_reason || '—'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => updateStatus(signup.id, 'confirmed')}>
                            Confirm
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(signup.id, 'standby')}>
                            Move to Standby
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(signup.id, 'dropped')}>
                            Mark Dropped
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(signup.id, 'no_show')}>
                            Mark No-Show
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(signup.id, 'completed')}>
                            Mark Completed
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Squad Recommendation Modal */}
      <SquadRecommendationModal
        open={showSquadModal}
        onOpenChange={setShowSquadModal}
        questId={selectedQuestId}
        questTitle={selectedQuest?.title || ''}
        onSquadsConfirmed={fetchSignups}
      />
    </div>
  );
}
