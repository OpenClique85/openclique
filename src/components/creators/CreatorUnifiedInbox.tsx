/**
 * CreatorUnifiedInbox - Combines sponsor proposals, org requests, and applications
 * into a single inbox view for creators
 */

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText, Building2, Send } from 'lucide-react';
import { CreatorProposalInbox } from './CreatorProposalInbox';
import { CreatorOrgRequestsInbox } from './CreatorOrgRequestsInbox';
import { CreatorApplicationsInbox } from './CreatorApplicationsInbox';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CreatorUnifiedInboxProps {
  creatorProfileId?: string;
}

export function CreatorUnifiedInbox({ creatorProfileId }: CreatorUnifiedInboxProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('sponsors');

  // Count pending sponsor proposals
  const { data: sponsorCount = 0 } = useQuery({
    queryKey: ['creator-proposals-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      // Direct proposals
      const { count: directCount } = await supabase
        .from('sponsorship_proposals')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user.id)
        .eq('status', 'sent');

      // Get quest IDs for this creator
      const { data: quests } = await supabase
        .from('quests')
        .select('id')
        .eq('creator_id', user.id);

      const questIds = quests?.map(q => q.id) || [];
      
      let questCount = 0;
      if (questIds.length > 0) {
        const { count } = await supabase
          .from('sponsorship_proposals')
          .select('*', { count: 'exact', head: true })
          .in('quest_id', questIds)
          .is('creator_id', null)
          .eq('status', 'sent');
        questCount = count || 0;
      }

      return (directCount || 0) + questCount;
    },
    enabled: !!user,
  });

  // Count pending org requests
  const { data: orgCount = 0 } = useQuery({
    queryKey: ['creator-org-requests-count', creatorProfileId],
    queryFn: async () => {
      if (!creatorProfileId) return 0;
      const { count } = await supabase
        .from('org_creator_requests')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creatorProfileId)
        .eq('status', 'pending');
      return count || 0;
    },
    enabled: !!creatorProfileId,
  });

  // Count pending applications
  const { data: applicationsCount = 0 } = useQuery({
    queryKey: ['creator-applications-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from('listing_applications')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user.id)
        .eq('status', 'pending');
      return count || 0;
    },
    enabled: !!user,
  });

  const totalPending = sponsorCount + orgCount;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-semibold mb-1 flex items-center gap-2">
          Inbox
          {totalPending > 0 && (
            <Badge className="bg-primary">{totalPending} pending</Badge>
          )}
        </h2>
        <p className="text-muted-foreground text-sm">
          Manage partnership requests and track your applications
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="sponsors" className="gap-2">
            <FileText className="h-4 w-4" />
            Proposals
            {sponsorCount > 0 && (
              <Badge variant="secondary" className="ml-1">{sponsorCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="orgs" className="gap-2">
            <Building2 className="h-4 w-4" />
            Org Requests
            {orgCount > 0 && (
              <Badge variant="secondary" className="ml-1">{orgCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="applications" className="gap-2">
            <Send className="h-4 w-4" />
            My Applications
            {applicationsCount > 0 && (
              <Badge variant="secondary" className="ml-1">{applicationsCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sponsors" className="mt-6">
          <CreatorProposalInbox />
        </TabsContent>

        <TabsContent value="orgs" className="mt-6">
          <CreatorOrgRequestsInbox creatorProfileId={creatorProfileId} />
        </TabsContent>

        <TabsContent value="applications" className="mt-6">
          <CreatorApplicationsInbox />
        </TabsContent>
      </Tabs>
    </div>
  );
}
