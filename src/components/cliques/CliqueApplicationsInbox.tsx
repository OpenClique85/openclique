/**
 * =============================================================================
 * CliqueApplicationsInbox - For leaders to review and manage applications
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserPlus, Check, X, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Application {
  id: string;
  user_id: string;
  display_name: string;
  intro_message: string | null;
  created_at: string;
  status: string;
}

interface CliqueApplicationsInboxProps {
  cliqueId: string;
  currentUserId: string;
  isLeader: boolean;
  onApplicationProcessed?: () => void;
}

export function CliqueApplicationsInbox({ 
  cliqueId, 
  currentUserId, 
  isLeader,
  onApplicationProcessed 
}: CliqueApplicationsInboxProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, [cliqueId]);

  const fetchApplications = async () => {
    setIsLoading(true);
    
    const { data: apps } = await supabase
      .from('clique_applications')
      .select('id, user_id, intro_message, created_at, status')
      .eq('squad_id', cliqueId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!apps || apps.length === 0) {
      setApplications([]);
      setIsLoading(false);
      return;
    }

    // Get applicant profiles
    const userIds = apps.map(a => a.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds);

    const appsWithNames: Application[] = apps.map(app => {
      const profile = profiles?.find(p => p.id === app.user_id);
      return {
        ...app,
        display_name: profile?.display_name || 'Unknown'
      };
    });

    setApplications(appsWithNames);
    setIsLoading(false);
  };

  const handleAccept = async (applicationId: string, userId: string) => {
    setProcessingId(applicationId);
    
    try {
      // Update application status
      const { error: updateError } = await supabase
        .from('clique_applications')
        .update({ 
          status: 'accepted',
          reviewed_at: new Date().toISOString(),
          reviewed_by: currentUserId
        })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      // Add user as member
      const { error: memberError } = await supabase
        .from('squad_members')
        .insert({
          user_id: userId,
          persistent_squad_id: cliqueId,
          squad_id: cliqueId, // Required field
          role: 'member',
          status: 'active'
        });

      if (memberError) throw memberError;

      toast.success('Application accepted! New member added.');
      
      // Remove from list
      setApplications(prev => prev.filter(a => a.id !== applicationId));
      onApplicationProcessed?.();
    } catch (error) {
      console.error('Failed to accept:', error);
      toast.error('Failed to accept application');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (applicationId: string) => {
    setProcessingId(applicationId);
    
    try {
      const { error } = await supabase
        .from('clique_applications')
        .update({ 
          status: 'declined',
          reviewed_at: new Date().toISOString(),
          reviewed_by: currentUserId
        })
        .eq('id', applicationId);

      if (error) throw error;

      toast.success('Application declined');
      setApplications(prev => prev.filter(a => a.id !== applicationId));
    } catch (error) {
      console.error('Failed to decline:', error);
      toast.error('Failed to decline application');
    } finally {
      setProcessingId(null);
    }
  };

  if (!isLeader) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (applications.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-center">
          <UserPlus className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            No pending applications
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Applications
          <Badge variant="secondary" className="ml-1">
            {applications.length}
          </Badge>
        </CardTitle>
        <CardDescription>
          Review and accept new members
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {applications.map((app) => (
          <div 
            key={app.id} 
            className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {app.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium truncate">{app.display_name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(app.created_at), 'MMM d, yyyy')}
                </p>
                {app.intro_message && (
                  <p className="text-sm text-muted-foreground mt-1 truncate">
                    "{app.intro_message}"
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDecline(app.id)}
                disabled={processingId === app.id}
              >
                {processingId === app.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="sm"
                onClick={() => handleAccept(app.id, app.user_id)}
                disabled={processingId === app.id}
              >
                {processingId === app.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}