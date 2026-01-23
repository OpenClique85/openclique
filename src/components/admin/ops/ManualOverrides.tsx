import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { logOpsEvent } from '@/lib/opsEvents';
import { auditLog } from '@/lib/auditLog';
import { toast } from 'sonner';
import { 
  AlertTriangle, Settings, Target, Users, Trophy, 
  Bell, RefreshCw, Shield, Loader2
} from 'lucide-react';

const SIGNUP_STATUSES = ['pending', 'confirmed', 'standby', 'dropped', 'no_show', 'completed'] as const;

export function ManualOverrides() {
  return (
    <div className="space-y-6">
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Manual Overrides
          </CardTitle>
          <CardDescription>
            Force state changes with full audit logging. All actions require a reason and are logged to the event timeline.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid gap-6 md:grid-cols-2">
        <ForceSignupStatusCard />
        <MoveUserToSquadCard />
        <RerunXPAwardCard />
        <ResendNotificationCard />
        <GrantRoleCard />
      </div>
    </div>
  );
}

function ForceSignupStatusCard() {
  const [signupId, setSignupId] = useState('');
  const [newStatus, setNewStatus] = useState<string>('');
  const [reason, setReason] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async () => {
    if (!signupId || !newStatus || !reason) {
      toast.error('All fields are required');
      return;
    }
    
    setIsLoading(true);
    try {
      // Get current state
      const { data: currentSignup, error: fetchError } = await supabase
        .from('quest_signups')
        .select('*')
        .eq('id', signupId)
        .single();
      
      if (fetchError || !currentSignup) {
        toast.error('Signup not found');
        return;
      }
      
      // Update status
      const { error: updateError } = await supabase
        .from('quest_signups')
        .update({ status: newStatus as 'pending' | 'confirmed' | 'standby' | 'dropped' | 'no_show' | 'completed' })
        .eq('id', signupId);
      if (updateError) throw updateError;
      
      // Log to ops_events
      await logOpsEvent({
        eventType: 'manual_override',
        signupId,
        userId: currentSignup.user_id,
        questId: currentSignup.quest_id,
        beforeState: { status: currentSignup.status },
        afterState: { status: newStatus },
        metadata: { reason, action: 'force_signup_status' },
      });
      
      // Log to admin audit
      await auditLog({
        action: 'force_signup_status',
        targetTable: 'quest_signups',
        targetId: signupId,
        oldValues: { status: currentSignup.status },
        newValues: { status: newStatus },
      });
      
      toast.success('Signup status updated');
      setIsOpen(false);
      setSignupId('');
      setNewStatus('');
      setReason('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update signup status');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <OverrideCard
      icon={<Target className="h-4 w-4" />}
      title="Force Signup Status"
      description="Change a signup's status bypassing normal flow"
    >
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">Execute</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Force Signup Status Change</DialogTitle>
            <DialogDescription>
              This bypasses normal validation. Provide a reason for audit purposes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Signup ID</Label>
              <Input
                placeholder="UUID of the signup..."
                value={signupId}
                onChange={(e) => setSignupId(e.target.value)}
              />
            </div>
            <div>
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  {SIGNUP_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason (Required)</Label>
              <Textarea
                placeholder="Why is this override necessary?"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isLoading} className="bg-amber-600 hover:bg-amber-700">
              {isLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Confirm Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OverrideCard>
  );
}

function MoveUserToSquadCard() {
  const [memberId, setMemberId] = useState('');
  const [newSquadId, setNewSquadId] = useState('');
  const [reason, setReason] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async () => {
    if (!memberId || !newSquadId || !reason) {
      toast.error('All fields are required');
      return;
    }
    
    setIsLoading(true);
    try {
      // Get current membership
      const { data: currentMember, error: fetchError } = await supabase
        .from('squad_members')
        .select('*')
        .eq('id', memberId)
        .single();
      
      if (fetchError || !currentMember) {
        toast.error('Squad member not found');
        return;
      }
      
      const oldSquadId = currentMember.squad_id;
      
      // Update squad membership
      const { error: updateError } = await supabase
        .from('squad_members')
        .update({ squad_id: newSquadId })
        .eq('id', memberId);
      
      if (updateError) throw updateError;
      
      // Log to ops_events
      await logOpsEvent({
        eventType: 'manual_override',
        userId: currentMember.user_id,
        squadId: newSquadId,
        beforeState: { squad_id: oldSquadId },
        afterState: { squad_id: newSquadId },
        metadata: { reason, action: 'move_user_to_squad', oldSquadId },
      });
      
      toast.success('User moved to new squad');
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to move user');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <OverrideCard
      icon={<Users className="h-4 w-4" />}
      title="Move User to Squad"
      description="Reassign a user to a different squad"
    >
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">Execute</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move User to Different Squad</DialogTitle>
            <DialogDescription>
              This will change the user's squad assignment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Squad Member ID</Label>
              <Input
                placeholder="UUID of the squad_members record..."
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
              />
            </div>
            <div>
              <Label>New Squad ID</Label>
              <Input
                placeholder="UUID of the target squad..."
                value={newSquadId}
                onChange={(e) => setNewSquadId(e.target.value)}
              />
            </div>
            <div>
              <Label>Reason (Required)</Label>
              <Textarea
                placeholder="Why is this move necessary?"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isLoading} className="bg-amber-600 hover:bg-amber-700">
              {isLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Confirm Move
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OverrideCard>
  );
}

function RerunXPAwardCard() {
  const [signupId, setSignupId] = useState('');
  const [reason, setReason] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async () => {
    if (!signupId || !reason) {
      toast.error('All fields are required');
      return;
    }
    
    setIsLoading(true);
    try {
      // Check if XP already awarded
      const { data: existingXp } = await supabase
        .from('xp_transactions')
        .select('id')
        .eq('source_id', signupId)
        .eq('source', 'quest_completion')
        .maybeSingle();
      
      if (existingXp) {
        toast.error('XP already awarded for this signup (idempotent check passed)');
        setIsLoading(false);
        return;
      }
      
      // Get signup and quest info
      const { data: signup, error: signupError } = await supabase
        .from('quest_signups')
        .select('*, quests(id, base_xp)')
        .eq('id', signupId)
        .single();
      
      if (signupError || !signup) {
        toast.error('Signup not found');
        return;
      }
      
      // Call the award XP RPC
      const { data: xpAwarded, error: xpError } = await supabase.rpc('award_quest_xp', {
        p_quest_id: signup.quest_id,
        p_user_id: signup.user_id,
      });
      
      if (xpError) throw xpError;
      
      // Log to ops_events
      await logOpsEvent({
        eventType: 'manual_override',
        signupId,
        userId: signup.user_id,
        questId: signup.quest_id,
        afterState: { xp_awarded: xpAwarded },
        metadata: { reason, action: 'rerun_xp_award' },
      });
      
      toast.success(`Awarded ${xpAwarded} XP`);
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to award XP');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <OverrideCard
      icon={<Trophy className="h-4 w-4" />}
      title="Rerun XP Award"
      description="Idempotently award XP for a completed signup"
    >
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">Execute</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rerun XP Award</DialogTitle>
            <DialogDescription>
              This will check if XP was already awarded and skip if so (idempotent).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Signup ID</Label>
              <Input
                placeholder="UUID of the completed signup..."
                value={signupId}
                onChange={(e) => setSignupId(e.target.value)}
              />
            </div>
            <div>
              <Label>Reason (Required)</Label>
              <Textarea
                placeholder="Why is this rerun necessary?"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isLoading} className="bg-amber-600 hover:bg-amber-700">
              {isLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Award XP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OverrideCard>
  );
}

function ResendNotificationCard() {
  const [userId, setUserId] = useState('');
  const [notificationType, setNotificationType] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [reason, setReason] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async () => {
    if (!userId || !notificationType || !title || !reason) {
      toast.error('All fields except body are required');
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: notificationType as 'general' | 'quest_recommendation' | 'quest_reminder' | 'signup_confirmed',
          title,
          body: body || null,
        });
      if (error) throw error;
      
      // Log to ops_events
      await logOpsEvent({
        eventType: 'manual_override',
        userId,
        afterState: { type: notificationType, title },
        metadata: { reason, action: 'resend_notification' },
      });
      
      toast.success('Notification sent');
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to send notification');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <OverrideCard
      icon={<Bell className="h-4 w-4" />}
      title="Resend Notification"
      description="Send a notification to a specific user"
    >
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">Execute</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>User ID</Label>
              <Input
                placeholder="UUID of the user..."
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={notificationType} onValueChange={setNotificationType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="quest_recommendation">Quest Recommendation</SelectItem>
                  <SelectItem value="quest_reminder">Quest Reminder</SelectItem>
                  <SelectItem value="signup_confirmed">Signup Confirmed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title</Label>
              <Input
                placeholder="Notification title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <Label>Body (Optional)</Label>
              <Textarea
                placeholder="Notification body..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
            <div>
              <Label>Reason (Required)</Label>
              <Textarea
                placeholder="Why is this notification being sent?"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isLoading} className="bg-amber-600 hover:bg-amber-700">
              {isLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OverrideCard>
  );
}

function GrantRoleCard() {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('');
  const [action, setAction] = useState<'grant' | 'revoke'>('grant');
  const [reason, setReason] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async () => {
    if (!userId || !role || !reason) {
      toast.error('All fields are required');
      return;
    }
    
    setIsLoading(true);
    try {
      const typedRole = role as 'admin' | 'quest_creator' | 'sponsor' | 'user';
      
      if (action === 'grant') {
        const { error } = await supabase
          .from('user_roles')
          .upsert({ user_id: userId, role: typedRole }, { onConflict: 'user_id,role' });
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', typedRole);
        
        if (error) throw error;
      }
      
      // Log to ops_events
      await logOpsEvent({
        eventType: 'manual_override',
        userId,
        afterState: { role, action },
        metadata: { reason, action: `${action}_role` },
      });
      
      toast.success(`Role ${action === 'grant' ? 'granted' : 'revoked'}`);
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to ${action} role`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <OverrideCard
      icon={<Shield className="h-4 w-4" />}
      title="Grant/Revoke Role"
      description="Manage user roles and permissions"
    >
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">Execute</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage User Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>User ID</Label>
              <Input
                placeholder="UUID of the user..."
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>
            <div>
              <Label>Action</Label>
              <Select value={action} onValueChange={(v) => setAction(v as 'grant' | 'revoke')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grant">Grant</SelectItem>
                  <SelectItem value="revoke">Revoke</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="quest_creator">Quest Creator</SelectItem>
                  <SelectItem value="sponsor">Sponsor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason (Required)</Label>
              <Textarea
                placeholder="Why is this role change needed?"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isLoading} className="bg-amber-600 hover:bg-amber-700">
              {isLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OverrideCard>
  );
}

function OverrideCard({ 
  icon, 
  title, 
  description, 
  children 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        {children}
      </CardContent>
    </Card>
  );
}
