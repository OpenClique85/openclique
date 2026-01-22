import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, Enums } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import {
  Loader2,
  Plus,
  Search,
  Edit,
  Eye,
  Calendar,
  Users,
  MapPin,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

type Quest = Tables<'quests'>;

interface QuestWithStats extends Quest {
  signup_count?: number;
}

type FilterStatus = 'all' | 'draft' | 'pending_review' | 'needs_changes' | 'approved' | 'published';

interface CreatorQuestsPreviewProps {
  previewUserId: string;
}

export function CreatorQuestsPreview({ previewUserId }: CreatorQuestsPreviewProps) {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch creator's quests
  const { data: quests, isLoading: questsLoading } = useQuery({
    queryKey: ['creator-quests-preview', previewUserId, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('quests')
        .select('*')
        .eq('creator_id', previewUserId)
        .order('updated_at', { ascending: false });
      
      // Apply status filter
      if (statusFilter === 'published') {
        query = query.in('status', ['open', 'closed', 'completed']);
      } else if (statusFilter !== 'all') {
        query = query.eq('review_status', statusFilter);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching quests:', error);
        return [];
      }

      // Fetch signup counts for each quest
      const questsWithStats: QuestWithStats[] = await Promise.all(
        (data || []).map(async (quest) => {
          const { count } = await supabase
            .from('quest_signups')
            .select('*', { count: 'exact', head: true })
            .eq('quest_id', quest.id)
            .in('status', ['pending', 'confirmed', 'standby']);
          
          return {
            ...quest,
            signup_count: count || 0
          };
        })
      );

      return questsWithStats;
    },
    enabled: !!previewUserId,
  });

  // Filter quests by search query
  const filteredQuests = (quests || []).filter(quest => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      quest.title.toLowerCase().includes(query) ||
      quest.short_description?.toLowerCase().includes(query) ||
      quest.theme?.toLowerCase().includes(query)
    );
  });

  function getReviewStatusBadge(quest: Quest) {
    if (['open', 'closed', 'completed'].includes(quest.status || '')) {
      if (quest.status === 'open') {
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Live</Badge>;
      }
      if (quest.status === 'closed') {
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Closed</Badge>;
      }
      return <Badge variant="secondary">Completed</Badge>;
    }

    switch (quest.review_status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Approved</Badge>;
      case 'pending_review':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Pending Review</Badge>;
      case 'needs_changes':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Needs Changes</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  }

  function getStatusIcon(quest: Quest) {
    if (['open', 'closed', 'completed'].includes(quest.status || '')) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    switch (quest.review_status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending_review':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'needs_changes':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  }

  if (questsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">My Quests</h2>
            <p className="text-muted-foreground text-sm">
              {filteredQuests.length} quest{filteredQuests.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button className="gap-2" disabled>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Quest</span>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search quests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilterStatus)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Quests</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
              <SelectItem value="pending_review">Pending Review</SelectItem>
              <SelectItem value="needs_changes">Needs Changes</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quest List */}
      {filteredQuests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">
              {statusFilter === 'all' && !searchQuery
                ? "No quests yet"
                : "No quests match your filters"}
            </h3>
            <p className="text-muted-foreground">
              {statusFilter === 'all' && !searchQuery
                ? "This creator hasn't created any quests."
                : "Try adjusting your search or filter criteria."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredQuests.map((quest) => (
            <Card key={quest.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {/* Image */}
                <div className="w-full md:w-48 h-32 md:h-auto flex-shrink-0">
                  {quest.image_url ? (
                    <img
                      src={quest.image_url}
                      alt={quest.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-4xl">{quest.icon || '🎯'}</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <CardContent className="flex-1 p-4 md:p-6">
                  <div className="flex flex-col h-full">
                    {/* Top Row: Title + Status */}
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(quest)}
                        <h3 className="font-semibold text-lg line-clamp-1">{quest.title}</h3>
                      </div>
                      {getReviewStatusBadge(quest)}
                    </div>

                    {/* Description */}
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                      {quest.short_description || 'No description yet'}
                    </p>

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                      {quest.start_datetime && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(quest.start_datetime), 'MMM d, yyyy')}
                        </span>
                      )}
                      {quest.meeting_location_name && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {quest.meeting_location_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {quest.signup_count || 0} / {quest.capacity_total || 6} signups
                      </span>
                    </div>

                    {/* Admin Notes (if needs changes) */}
                    {quest.review_status === 'needs_changes' && quest.admin_notes && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4">
                        <p className="text-sm font-medium text-amber-400 mb-1">Feedback from reviewer:</p>
                        <p className="text-sm text-muted-foreground">{quest.admin_notes}</p>
                      </div>
                    )}

                    {/* Actions (disabled in preview) */}
                    <div className="flex flex-wrap gap-2 mt-auto">
                      <Button size="sm" variant="outline" disabled>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      {['open', 'closed', 'completed'].includes(quest.status || '') && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={`/quests/${quest.slug}`} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4 mr-1" />
                            View Live
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
