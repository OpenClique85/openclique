/**
 * Instance Notification Panel
 * 
 * Displays actionable alerts for quest instances that need admin attention.
 * Shows warnings for signup thresholds, underfilling, unassigned users, etc.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, Users, Clock, UserX, CheckCircle2, 
  ChevronDown, ChevronUp, Info, AlertCircle
} from 'lucide-react';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { Tables } from '@/integrations/supabase/types';

type QuestInstance = Tables<'quest_instances'>;

interface InstanceNotification {
  id: string;
  type: 'signup_threshold' | 'underfilled' | 'unassigned' | 'squad_incomplete' | 'ready_to_go';
  severity: 'info' | 'warning' | 'error' | 'success';
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface InstanceNotificationPanelProps {
  instance: QuestInstance;
  onFormSquads?: () => void;
  onOpenSquadTab?: () => void;
}

export function InstanceNotificationPanel({ 
  instance, 
  onFormSquads,
  onOpenSquadTab 
}: InstanceNotificationPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Fetch signup and squad data for notifications
  const { data: stats } = useQuery({
    queryKey: ['instance-notification-stats', instance.id],
    queryFn: async () => {
      // Get signup counts
      const { data: signups } = await supabase
        .from('quest_signups')
        .select('id, status')
        .eq('instance_id', instance.id)
        .in('status', ['pending', 'confirmed']);

      // Get squad counts
      const { data: squads } = await supabase
        .from('quest_squads')
        .select('id, squad_name')
        .eq('quest_id', instance.id);

      // Get squad member counts
      const squadIds = (squads || []).map(s => s.id);
      const { data: squadMembers } = squadIds.length > 0 
        ? await supabase
            .from('squad_members')
            .select('squad_id, user_id')
            .in('squad_id', squadIds)
        : { data: [] };

      const confirmedCount = (signups || []).filter(s => s.status === 'confirmed').length;
      const pendingCount = (signups || []).filter(s => s.status === 'pending').length;
      const squadCount = squads?.length || 0;
      
      // Get assigned user IDs from squad members
      const assignedUserIds = new Set((squadMembers || []).map(m => m.user_id));
      
      // Count members per squad
      const squadMemberCounts = new Map<string, number>();
      (squadMembers || []).forEach(m => {
        const count = squadMemberCounts.get(m.squad_id) || 0;
        squadMemberCounts.set(m.squad_id, count + 1);
      });

      const incompleteSquads = (squads || []).filter(squad => {
        const memberCount = squadMemberCounts.get(squad.id) || 0;
        return memberCount < (instance.target_squad_size || 6);
      });

      // Count unassigned as confirmed users not in any squad
      const unassignedCount = squadCount > 0 
        ? confirmedCount - assignedUserIds.size 
        : 0;

      return {
        confirmedCount,
        pendingCount,
        unassignedCount: Math.max(0, unassignedCount),
        squadCount,
        incompleteSquads,
        totalSignups: confirmedCount + pendingCount,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Calculate time until start
  const getHoursUntilStart = (): number => {
    const eventDate = new Date(`${instance.scheduled_date}T${instance.start_time}`);
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();
    return diff / (1000 * 60 * 60);
  };

  // Generate notifications based on instance state
  const notifications: InstanceNotification[] = [];

  if (stats) {
    const threshold = Math.ceil((instance.target_squad_size || 6) * 0.8);
    const hoursUntilStart = getHoursUntilStart();

    // Ready to form squad
    if (
      stats.confirmedCount >= threshold &&
      stats.squadCount === 0 &&
      instance.status === 'recruiting'
    ) {
      notifications.push({
        id: 'ready-for-squad',
        type: 'signup_threshold',
        severity: 'warning',
        title: 'Ready to Form Squads',
        description: `${stats.confirmedCount} users signed up — you can now form squads.`,
        action: onFormSquads
          ? { label: 'Form Squads', onClick: onFormSquads }
          : undefined,
      });
    }

    // Underfilled near start time
    if (
      hoursUntilStart > 0 &&
      hoursUntilStart < 2 &&
      stats.confirmedCount < 3 &&
      instance.status === 'recruiting'
    ) {
      notifications.push({
        id: 'underfilled',
        type: 'underfilled',
        severity: 'error',
        title: 'Underfilled Instance',
        description: `Only ${stats.confirmedCount} users confirmed, starts in ${Math.round(hoursUntilStart * 60)} minutes. Consider pausing or boosting recruitment.`,
      });
    }

    // Unassigned users after squads formed
    if (
      stats.unassignedCount > 0 &&
      stats.squadCount > 0 &&
      instance.status === 'locked'
    ) {
      notifications.push({
        id: 'unassigned',
        type: 'unassigned',
        severity: 'warning',
        title: 'Unassigned Users',
        description: `${stats.unassignedCount} confirmed user${stats.unassignedCount > 1 ? 's are' : ' is'} not assigned to any squad.`,
        action: onOpenSquadTab
          ? { label: 'Manage Squads', onClick: onOpenSquadTab }
          : undefined,
      });
    }

    // Incomplete squads
    if (stats.incompleteSquads.length > 0 && instance.status === 'locked') {
      notifications.push({
        id: 'incomplete-squads',
        type: 'squad_incomplete',
        severity: 'info',
        title: 'Incomplete Squads',
        description: `${stats.incompleteSquads.length} squad${stats.incompleteSquads.length > 1 ? 's have' : ' has'} fewer than ${instance.target_squad_size || 6} members.`,
        action: onOpenSquadTab
          ? { label: 'View Squads', onClick: onOpenSquadTab }
          : undefined,
      });
    }

    // All good - ready to go live
    if (
      instance.status === 'locked' &&
      stats.unassignedCount === 0 &&
      stats.squadCount > 0 &&
      stats.incompleteSquads.length === 0
    ) {
      notifications.push({
        id: 'ready-to-go',
        type: 'ready_to_go',
        severity: 'success',
        title: 'Ready to Go Live',
        description: `All ${stats.confirmedCount} users are assigned to ${stats.squadCount} complete squads.`,
      });
    }
  }

  if (notifications.length === 0) {
    return null;
  }

  const getSeverityIcon = (severity: InstanceNotification['severity']) => {
    switch (severity) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityBorder = (severity: InstanceNotification['severity']) => {
    switch (severity) {
      case 'error':
        return 'border-destructive/50 bg-destructive/5';
      case 'warning':
        return 'border-orange-500/50 bg-orange-50 dark:bg-orange-900/10';
      case 'success':
        return 'border-green-500/50 bg-green-50 dark:bg-green-900/10';
      default:
        return 'border-blue-500/50 bg-blue-50 dark:bg-blue-900/10';
    }
  };

  const errorCount = notifications.filter(n => n.severity === 'error').length;
  const warningCount = notifications.filter(n => n.severity === 'warning').length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-6">
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {errorCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {errorCount} urgent
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge className="text-xs bg-orange-500 text-white">
                  {warningCount} warning{warningCount > 1 ? 's' : ''}
                </Badge>
              )}
              {errorCount === 0 && warningCount === 0 && (
                <Badge className="text-xs bg-green-500 text-white">
                  All good
                </Badge>
              )}
            </div>
            <span className="text-sm font-medium">
              {notifications.length} notification{notifications.length > 1 ? 's' : ''}
            </span>
          </div>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="pt-3 space-y-2">
        {notifications.map((notification) => (
          <Alert 
            key={notification.id} 
            className={getSeverityBorder(notification.severity)}
          >
            <div className="flex items-start gap-3">
              {getSeverityIcon(notification.severity)}
              <div className="flex-1">
                <AlertTitle className="text-sm font-medium mb-1">
                  {notification.title}
                </AlertTitle>
                <AlertDescription className="text-xs text-muted-foreground">
                  {notification.description}
                </AlertDescription>
              </div>
              {notification.action && (
                <Button size="sm" variant="outline" onClick={notification.action.onClick}>
                  {notification.action.label}
                </Button>
              )}
            </div>
          </Alert>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
