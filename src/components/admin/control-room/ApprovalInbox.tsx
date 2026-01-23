/**
 * Approval Inbox
 * 
 * Central inbox showing all quests requiring admin attention.
 * Filters: pending review, needs changes, paused, revoked, priority flagged.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Flag, AlertTriangle, Clock, Pause, XOctagon, FileEdit } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { QuestStatusBadge } from '@/components/QuestStatusBadge';
import { QuestLifecycleModal } from './QuestLifecycleModal';
import type { Enums, Tables } from '@/integrations/supabase/types';

type Quest = Tables<'quests'>;
type QuestStatus = Enums<'quest_status'>;
type ReviewStatus = Enums<'review_status'>;

interface QuestWithCreator extends Quest {
  creator_profile?: {
    display_name: string;
  } | null;
  sponsor_profiles?: {
    name: string;
  } | null;
}

type FilterTab = 'all' | 'pending_review' | 'needs_changes' | 'paused' | 'revoked' | 'priority';

const TAB_CONFIG: Record<FilterTab, { label: string; icon: React.ReactNode; count?: (quests: QuestWithCreator[]) => number }> = {
  all: { 
    label: 'All Attention', 
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  pending_review: { 
    label: 'Pending Review', 
    icon: <Clock className="h-4 w-4" />,
    count: (q) => q.filter(x => x.review_status === 'pending_review').length,
  },
  needs_changes: { 
    label: 'Needs Changes', 
    icon: <FileEdit className="h-4 w-4" />,
    count: (q) => q.filter(x => x.review_status === 'needs_changes').length,
  },
  paused: { 
    label: 'Paused', 
    icon: <Pause className="h-4 w-4" />,
    count: (q) => q.filter(x => x.status === 'paused').length,
  },
  revoked: { 
    label: 'Revoked', 
    icon: <XOctagon className="h-4 w-4" />,
    count: (q) => q.filter(x => x.status === 'revoked').length,
  },
  priority: { 
    label: 'Priority', 
    icon: <Flag className="h-4 w-4" />,
    count: (q) => q.filter(x => x.priority_flag).length,
  },
};

export function ApprovalInbox() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedQuest, setSelectedQuest] = useState<QuestWithCreator | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch quests requiring attention
  const { data: quests, isLoading, refetch } = useQuery({
    queryKey: ['admin-approval-inbox'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quests')
        .select(`
          *,
          creator_profile:profiles!quests_creator_id_fkey(display_name),
          sponsor_profiles(name)
        `)
        .is('deleted_at', null)
        .or(`review_status.eq.pending_review,review_status.eq.needs_changes,status.eq.paused,status.eq.revoked,priority_flag.eq.true`)
        .order('priority_flag', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as QuestWithCreator[];
    },
  });

  // Filter quests based on active tab
  const filteredQuests = quests?.filter((quest) => {
    switch (activeTab) {
      case 'pending_review':
        return quest.review_status === 'pending_review';
      case 'needs_changes':
        return quest.review_status === 'needs_changes';
      case 'paused':
        return quest.status === 'paused';
      case 'revoked':
        return quest.status === 'revoked';
      case 'priority':
        return quest.priority_flag;
      default:
        return true;
    }
  }) || [];

  const handleQuestClick = (quest: QuestWithCreator) => {
    setSelectedQuest(quest);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedQuest(null);
    refetch();
  };

  const getQuestType = (quest: QuestWithCreator): string => {
    if (quest.sponsor_id) return 'Sponsored';
    // Check if quest has is_private in metadata or defaults to public
    return 'Public';
  };

  const getCreatorName = (quest: QuestWithCreator): string => {
    return quest.creator_profile?.display_name || 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Approval & Ops Inbox
          </CardTitle>
          <CardDescription>
            Quests requiring admin review or intervention. {quests?.length || 0} items need attention.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
            <TabsList className="mb-4">
              {Object.entries(TAB_CONFIG).map(([key, config]) => {
                const count = config.count ? config.count(quests || []) : undefined;
                return (
                  <TabsTrigger key={key} value={key} className="gap-1.5">
                    {config.icon}
                    {config.label}
                    {count !== undefined && count > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                        {count}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {filteredQuests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No quests in this category</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Quest</TableHead>
                        <TableHead>Creator</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Review</TableHead>
                        <TableHead>Submitted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredQuests.map((quest) => (
                        <TableRow
                          key={quest.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleQuestClick(quest)}
                        >
                          <TableCell>
                            {quest.priority_flag && (
                              <Flag className="h-4 w-4 text-destructive fill-destructive" />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{quest.icon || '🎯'}</span>
                              <span className="font-medium">{quest.title}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getCreatorName(quest)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {getQuestType(quest)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {quest.city || '—'}
                          </TableCell>
                          <TableCell>
                            <QuestStatusBadge status={quest.status} type="quest" size="sm" />
                          </TableCell>
                          <TableCell>
                            <QuestStatusBadge status={quest.review_status} type="review" size="sm" />
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDistanceToNow(new Date(quest.created_at), { addSuffix: true })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quest Lifecycle Modal */}
      <QuestLifecycleModal
        quest={selectedQuest}
        open={modalOpen}
        onOpenChange={handleModalClose}
      />
    </div>
  );
}
