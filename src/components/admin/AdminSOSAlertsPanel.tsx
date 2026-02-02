/**
 * =============================================================================
 * Admin SOS Alerts Panel
 * =============================================================================
 * Shows all SOS emergency alerts with high priority for active ones.
 * Allows admin to resolve alerts and add notes.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Loader2, 
  MapPin,
  Phone,
  Shield,
  XCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';

interface SOSAlert {
  id: string;
  user_id: string;
  quest_id: string | null;
  squad_id: string | null;
  location_lat: number | null;
  location_lng: number | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  false_alarm: boolean;
  user_profile?: {
    display_name: string | null;
    email: string | null;
  };
  quest?: {
    title: string | null;
  };
}

export function AdminSOSAlertsPanel() {
  const [selectedAlert, setSelectedAlert] = useState<SOSAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['admin-sos-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sos_alerts')
        .select(`
          *,
          user_profile:profiles!sos_alerts_user_id_fkey(display_name, email),
          quest:quests(title)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as SOSAlert[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ alertId, falseAlarm }: { alertId: string; falseAlarm: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('sos_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
          resolution_notes: resolutionNotes.trim() || null,
          false_alarm: falseAlarm,
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Alert resolved',
        description: 'The SOS alert has been marked as resolved.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-sos-alerts'] });
      setSelectedAlert(null);
      setResolutionNotes('');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to resolve alert',
        description: error.message,
      });
    },
  });

  const activeAlerts = alerts?.filter(a => a.status === 'active') || [];
  const resolvedAlerts = alerts?.filter(a => a.status !== 'active') || [];

  const getGoogleMapsUrl = (lat: number, lng: number) => {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Alerts - High Priority */}
      {activeAlerts.length > 0 && (
        <Card className="border-destructive">
          <CardHeader className="bg-destructive/10">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Active Emergency Alerts ({activeAlerts.length})
            </CardTitle>
            <CardDescription>
              These require immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {activeAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onResolve={() => setSelectedAlert(alert)}
                  getGoogleMapsUrl={getGoogleMapsUrl}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            SOS Alert History
          </CardTitle>
          <CardDescription>
            All emergency alerts submitted by users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!alerts?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No SOS alerts recorded</p>
            </div>
          ) : (
            <div className="space-y-4">
              {resolvedAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  getGoogleMapsUrl={getGoogleMapsUrl}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolution Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve SOS Alert</DialogTitle>
            <DialogDescription>
              Add notes about how this alert was handled
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Resolution notes (optional)"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (selectedAlert) {
                  resolveMutation.mutate({ alertId: selectedAlert.id, falseAlarm: true });
                }
              }}
              disabled={resolveMutation.isPending}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Mark as False Alarm
            </Button>
            <Button
              onClick={() => {
                if (selectedAlert) {
                  resolveMutation.mutate({ alertId: selectedAlert.id, falseAlarm: false });
                }
              }}
              disabled={resolveMutation.isPending}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {resolveMutation.isPending ? 'Resolving...' : 'Mark as Resolved'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface AlertCardProps {
  alert: SOSAlert;
  onResolve?: () => void;
  getGoogleMapsUrl: (lat: number, lng: number) => string;
}

function AlertCard({ alert, onResolve, getGoogleMapsUrl }: AlertCardProps) {
  const isActive = alert.status === 'active';

  return (
    <div className={`p-4 rounded-lg border ${isActive ? 'border-destructive bg-destructive/5' : 'bg-card'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={isActive ? 'destructive' : alert.false_alarm ? 'secondary' : 'default'}>
              {isActive ? 'ACTIVE' : alert.false_alarm ? 'False Alarm' : 'Resolved'}
            </Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(alert.created_at), 'MMM d, yyyy h:mm a')}
            </span>
          </div>

          <div>
            <p className="font-medium">
              {alert.user_profile?.display_name || 'Unknown User'}
            </p>
            {alert.user_profile?.email && (
              <p className="text-sm text-muted-foreground">{alert.user_profile.email}</p>
            )}
          </div>

          {alert.quest?.title && (
            <p className="text-sm">
              <span className="text-muted-foreground">Quest:</span> {alert.quest.title}
            </p>
          )}

          {alert.location_lat && alert.location_lng && (
            <a
              href={getGoogleMapsUrl(alert.location_lat, alert.location_lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <MapPin className="h-3 w-3" />
              View on Map
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {alert.resolution_notes && (
            <p className="text-sm text-muted-foreground mt-2">
              <span className="font-medium">Notes:</span> {alert.resolution_notes}
            </p>
          )}
        </div>

        {isActive && onResolve && (
          <Button variant="outline" size="sm" onClick={onResolve}>
            Resolve
          </Button>
        )}
      </div>
    </div>
  );
}
