/**
 * ListingApplicationsModal - View and manage applications to a listing
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Check, 
  X, 
  MessageSquare, 
  ExternalLink,
  Calendar,
  Loader2
} from 'lucide-react';
import { createNotification } from '@/lib/notifications';

interface Application {
  id: string;
  listing_id: string;
  creator_id: string;
  pitch_message: string;
  proposed_concept: string | null;
  availability: string | null;
  status: string;
  sponsor_notes: string | null;
  created_at: string;
  response_at: string | null;
}

interface CreatorProfile {
  id: string;
  user_id: string;
  display_name: string;
  photo_url: string | null;
  city: string | null;
  slug: string | null;
}

interface ListingApplicationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
}

export function ListingApplicationsModal({
  isOpen,
  onClose,
  listingId,
}: ListingApplicationsModalProps) {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  // Fetch applications
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['listing-applications', listingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listing_applications')
        .select('*')
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Application[];
    },
    enabled: isOpen,
  });

  // Fetch creator profiles for applications
  const creatorIds = applications.map(a => a.creator_id);
  const { data: creators = {} } = useQuery({
    queryKey: ['creator-profiles-by-user', creatorIds],
    queryFn: async () => {
      if (creatorIds.length === 0) return {};
      const { data } = await supabase
        .from('creator_profiles')
        .select('id, user_id, display_name, photo_url, city, slug')
        .in('user_id', creatorIds);
      
      const map: Record<string, CreatorProfile> = {};
      data?.forEach(c => { map[c.user_id] = c; });
      return map;
    },
    enabled: creatorIds.length > 0,
  });

  // Update application status
  const updateStatus = useMutation({
    mutationFn: async ({ 
      applicationId, 
      status, 
      sponsorNotes 
    }: { 
      applicationId: string; 
      status: string; 
      sponsorNotes?: string;
    }) => {
      const { error } = await supabase
        .from('listing_applications')
        .update({ 
          status, 
          sponsor_notes: sponsorNotes || null,
          response_at: new Date().toISOString(),
        })
        .eq('id', applicationId);
      if (error) throw error;

      // Get the application to notify creator
      const app = applications.find(a => a.id === applicationId);
      if (app) {
        const title = status === 'accepted' 
          ? 'Application Accepted! 🎉'
          : 'Application Update';
        const body = status === 'accepted'
          ? 'A sponsor has accepted your listing application!'
          : 'Your listing application status has been updated.';
        
        await createNotification({
          userId: app.creator_id,
          type: 'general',
          title,
          body,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing-applications', listingId] });
      queryClient.invalidateQueries({ queryKey: ['sponsor-listings'] });
      toast.success('Application updated');
    },
    onError: () => {
      toast.error('Failed to update application');
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'reviewing':
        return <Badge className="bg-amber-500/10 text-amber-600">Reviewing</Badge>;
      case 'accepted':
        return <Badge className="bg-green-500/10 text-green-600">Accepted</Badge>;
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Applications ({applications.length})</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : applications.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No applications yet
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const creator = creators[app.creator_id];
              const isExpanded = expandedId === app.id;

              return (
                <div 
                  key={app.id} 
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={creator?.photo_url || undefined} />
                        <AvatarFallback>
                          {creator?.display_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {creator?.display_name || 'Unknown Creator'}
                          </p>
                          {getStatusBadge(app.status)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {creator?.city && <span>{creator.city}</span>}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(app.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {creator?.slug && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/creators/${creator.slug}`} target="_blank">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </div>

                  {/* Pitch */}
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm font-medium mb-1">Pitch</p>
                    <p className="text-sm whitespace-pre-wrap">{app.pitch_message}</p>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <>
                      {app.proposed_concept && (
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <p className="text-sm font-medium mb-1">Proposed Concept</p>
                          <p className="text-sm whitespace-pre-wrap">{app.proposed_concept}</p>
                        </div>
                      )}

                      {app.availability && (
                        <div>
                          <p className="text-sm font-medium mb-1">Availability</p>
                          <p className="text-sm text-muted-foreground">{app.availability}</p>
                        </div>
                      )}

                      {app.status === 'pending' && (
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Add notes (optional, visible to creator if declined)"
                            value={notes[app.id] || ''}
                            onChange={(e) => setNotes(prev => ({ 
                              ...prev, 
                              [app.id]: e.target.value 
                            }))}
                            rows={2}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(isExpanded ? null : app.id)}
                    >
                      {isExpanded ? 'Show Less' : 'Show More'}
                    </Button>

                    {app.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatus.mutate({
                            applicationId: app.id,
                            status: 'declined',
                            sponsorNotes: notes[app.id],
                          })}
                          disabled={updateStatus.isPending}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateStatus.mutate({
                            applicationId: app.id,
                            status: 'accepted',
                            sponsorNotes: notes[app.id],
                          })}
                          disabled={updateStatus.isPending}
                        >
                          {updateStatus.isPending ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4 mr-1" />
                          )}
                          Accept
                        </Button>
                      </div>
                    )}

                    {app.status === 'accepted' && (
                      <Button size="sm" variant="secondary">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Start Chat
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
