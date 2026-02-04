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
  AlertTriangle, Users, Clock, CheckCircle2, 
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
  instanceId?: string;
  instanceTitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface InstanceNotificationPanelProps {
  instance?: QuestInstance;
  instances?: QuestInstance[];
  onFormSquads?: (instanceId: string) => void;
  onOpenSquadTab?: (instanceId: string) => void;
  onNavigateToInstance?: (instanceId: string) => void;
}

export function InstanceNotificationPanel({ 
  instance, 
  instances,
  onFormSquads,
  onOpenSquadTab,
  onNavigateToInstance,
}: InstanceNotificationPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Determine which instances to check
  const instancesToCheck = instances || (instance ? [instance] : []);
  const instanceIds = instancesToCheck.map(i => i.id);

  // Fetch signup and squad data for notifications
  const { data: stats } = useQuery({
    queryKey: ['instance-notification-stats', instanceIds],
    queryFn: async () => {
      if (instanceIds.length === 0) return [];

      // Get all signups for these instances
      const { data: signups } = await supabase
        .from('quest_signups')
        .select('id, status, instance_id')
        .in('instance_id', instanceIds)
        .in('status', ['pending', 'confirmed']);

       // Get all cliques (quest_squads) for these instances
       const { data: squads } = await supabase
         .from('quest_squads')
         .select('id, squad_name, instance_id')
         .in('instance_id', instanceIds);

      // Get squad member counts
      const squadIds = (squads || []).map(s => s.id);
      const { data: squadMembers } = squadIds.length > 0 
        ? await supabase
            .from('squad_members')
            .select('squad_id, user_id')
            .in('squad_id', squadIds)
        : { data: [] };

      // Build stats per instance
      return instancesToCheck.map(inst => {
        const instanceSignups = (signups || []).filter(s => s.instance_id === inst.id);
         const instanceSquads = (squads || []).filter((s: any) => s.instance_id === inst.id);
        const instanceSquadIds = instanceSquads.map(s => s.id);
        const instanceMembers = (squadMembers || []).filter(m => instanceSquadIds.includes(m.squad_id));

        const confirmedCount = instanceSignups.filter(s => s.status === 'confirmed').length;
        const squadCount = instanceSquads.length;
        
        const assignedUserIds = new Set(instanceMembers.map(m => m.user_id));
        
        const squadMemberCounts = new Map<string, number>();
        instanceMembers.forEach(m => {
          const count = squadMemberCounts.get(m.squad_id) || 0;
          squadMemberCounts.set(m.squad_id, count + 1);
        });

        const incompleteSquads = instanceSquads.filter(squad => {
          const memberCount = squadMemberCounts.get(squad.id) || 0;
          return memberCount < (inst.target_squad_size || 6);
        });

        const unassignedCount = squadCount > 0 
          ? Math.max(0, confirmedCount - assignedUserIds.size)
          : 0;

        return {
          instanceId: inst.id,
          instanceTitle: inst.title,
          instanceStatus: inst.status,
          instanceDate: inst.scheduled_date,
          instanceTime: inst.start_time,
          targetSquadSize: inst.target_squad_size || 6,
          confirmedCount,
          squadCount,
          unassignedCount,
          incompleteSquads,
        };
      });
    },
    refetchInterval: 30000,
    enabled: instanceIds.length > 0,
  });

  // Calculate time until start
  const getHoursUntilStart = (date: string, time: string): number => {
    const eventDate = new Date(`${date}T${time}`);
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();
    return diff / (1000 * 60 * 60);
  };

  // Generate notifications based on instance states
  const notifications: InstanceNotification[] = [];

  if (stats) {
    stats.forEach(stat => {
      const threshold = Math.ceil(stat.targetSquadSize * 0.8);
      const hoursUntilStart = getHoursUntilStart(stat.instanceDate, stat.instanceTime);

      // Ready to form squad
      if (
        stat.confirmedCount >= threshold &&
        stat.squadCount === 0 &&
        stat.instanceStatus === 'recruiting'
      ) {
        notifications.push({
          id: `ready-for-squad-${stat.instanceId}`,
          type: 'signup_threshold',
          severity: 'warning',
          title: 'Ready to Form Squads',
          description: `${stat.confirmedCount} users signed up — you can now form squads.`,
          instanceId: stat.instanceId,
          instanceTitle: stat.instanceTitle,
          action: onFormSquads
            ? { label: 'Form Squads', onClick: () => onFormSquads(stat.instanceId) }
            : onNavigateToInstance
            ? { label: 'View Instance', onClick: () => onNavigateToInstance(stat.instanceId) }
            : undefined,
        });
      }

      // Underfilled near start time
      if (
        hoursUntilStart > 0 &&
        hoursUntilStart < 2 &&
        stat.confirmedCount < 3 &&
        stat.instanceStatus === 'recruiting'
      ) {
        notifications.push({
          id: `underfilled-${stat.instanceId}`,
          type: 'underfilled',
          severity: 'error',
          title: 'Underfilled Instance',
          description: `Only ${stat.confirmedCount} users confirmed, starts in ${Math.round(hoursUntilStart * 60)} minutes. Consider pausing or boosting recruitment.`,
          instanceId: stat.instanceId,
          instanceTitle: stat.instanceTitle,
          action: onNavigateToInstance
            ? { label: 'View Instance', onClick: () => onNavigateToInstance(stat.instanceId) }
            : undefined,
        });
      }

      // Unassigned users after squads formed
      if (
        stat.unassignedCount > 0 &&
        stat.squadCount > 0 &&
        stat.instanceStatus === 'locked'
      ) {
        notifications.push({
          id: `unassigned-${stat.instanceId}`,
          type: 'unassigned',
          severity: 'warning',
          title: 'Unassigned Users',
          description: `${stat.unassignedCount} confirmed user${stat.unassignedCount > 1 ? 's are' : ' is'} not assigned to any squad.`,
          instanceId: stat.instanceId,
          instanceTitle: stat.instanceTitle,
          action: onOpenSquadTab
            ? { label: 'Manage Squads', onClick: () => onOpenSquadTab(stat.instanceId) }
            : onNavigateToInstance
            ? { label: 'View Instance', onClick: () => onNavigateToInstance(stat.instanceId) }
            : undefined,
        });
      }

      // Incomplete squads
      if (stat.incompleteSquads.length > 0 && stat.instanceStatus === 'locked') {
        notifications.push({
          id: `incomplete-squads-${stat.instanceId}`,
          type: 'squad_incomplete',
          severity: 'info',
          title: 'Incomplete Squads',
          description: `${stat.incompleteSquads.length} squad${stat.incompleteSquads.length > 1 ? 's have' : ' has'} fewer than ${stat.targetSquadSize} members.`,
          instanceId: stat.instanceId,
          instanceTitle: stat.instanceTitle,
          action: onOpenSquadTab
            ? { label: 'View Squads', onClick: () => onOpenSquadTab(stat.instanceId) }
            : onNavigateToInstance
            ? { label: 'View Instance', onClick: () => onNavigateToInstance(stat.instanceId) }
            : undefined,
        });
      }

      // All good - ready to go live (only show for single instance view)
      if (
        !instances &&
        stat.instanceStatus === 'locked' &&
        stat.unassignedCount === 0 &&
        stat.squadCount > 0 &&
        stat.incompleteSquads.length === 0
      ) {
        notifications.push({
          id: `ready-to-go-${stat.instanceId}`,
          type: 'ready_to_go',
          severity: 'success',
          title: 'Ready to Go Live',
          description: `All ${stat.confirmedCount} users are assigned to ${stat.squadCount} complete squads.`,
          instanceId: stat.instanceId,
          instanceTitle: stat.instanceTitle,
        });
      }
    });
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
                <AlertTitle className="text-sm font-medium mb-1 flex items-center gap-2">
                  {notification.title}
                  {instances && notification.instanceTitle && (
                    <Badge variant="outline" className="text-xs font-normal">
                      {notification.instanceTitle}
                    </Badge>
                  )}
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
