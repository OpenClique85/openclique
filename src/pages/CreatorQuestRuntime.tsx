import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CreatorPortalNav } from '@/components/creators/CreatorPortalNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import {
  Loader2,
  ArrowLeft,
  Users,
  MessageSquare,
  Settings,
  Calendar,
  MapPin,
  CheckCircle,
  Clock,
  AlertTriangle,
  UserPlus,
  Megaphone,
  Flag,
} from 'lucide-react';

import { CreatorSignupsTab } from '@/components/creators/runtime/CreatorSignupsTab';
import { CreatorSquadsTab } from '@/components/creators/runtime/CreatorSquadsTab';
import { CreatorSquadApproval } from '@/components/creators/runtime/CreatorSquadApproval';
import { CreatorMemberAssignment } from '@/components/creators/runtime/CreatorMemberAssignment';
import { IcebreakerPromptPicker } from '@/components/creators/runtime/IcebreakerPromptPicker';
import { CreatorCommsTab } from '@/components/creators/runtime/CreatorCommsTab';
import { CreatorLogisticsTab } from '@/components/creators/runtime/CreatorLogisticsTab';
import { EscalateToAdmin } from '@/components/creators/EscalateToAdmin';

export default function CreatorQuestRuntime() {
  const { questId } = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('signups');

  // Fetch quest details
  const { data: quest, isLoading: questLoading } = useQuery({
    queryKey: ['creator-quest-runtime', questId],
    queryFn: async () => {
      if (!questId || !user) return null;
      const { data, error } = await supabase
        .from('quests')
        .select('*')
        .eq('id', questId)
        .eq('creator_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!questId && !!user,
  });

  // Fetch signup stats
  const { data: signupStats } = useQuery({
    queryKey: ['quest-signup-stats', questId],
    queryFn: async () => {
      if (!questId) return null;
      const { data, error } = await supabase
        .from('quest_signups')
        .select('status')
        .eq('quest_id', questId);
      
      if (error) throw error;
      
      const stats = {
        total: data?.length || 0,
        confirmed: data?.filter(s => s.status === 'confirmed').length || 0,
        pending: data?.filter(s => s.status === 'pending').length || 0,
        standby: data?.filter(s => s.status === 'standby').length || 0,
      };
      return stats;
    },
    enabled: !!questId,
  });

  // Fetch squad count
  const { data: squadCount } = useQuery({
    queryKey: ['quest-squad-count', questId],
    queryFn: async () => {
      if (!questId) return 0;
      const { count, error } = await supabase
        .from('quest_squads')
        .select('*', { count: 'exact', head: true })
        .eq('quest_id', questId);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!questId,
  });

  if (authLoading || questLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold mb-4">Quest Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This quest doesn't exist or you don't have permission to manage it.
          </p>
          <Button asChild>
            <Link to="/creator/quests">Back to My Quests</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (quest.status) {
      case 'open':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Live</Badge>;
      case 'closed':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Closed</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <CreatorPortalNav />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/creator/quests">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl">{quest.icon || '🎯'}</span>
                <h1 className="text-xl md:text-2xl font-display font-bold text-foreground truncate">
                  {quest.title}
                </h1>
                {getStatusBadge()}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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
              </div>
            </div>
            <EscalateToAdmin questId={questId!} questTitle={quest.title} />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{signupStats?.confirmed || 0}</p>
                    <p className="text-xs text-muted-foreground">Confirmed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Clock className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{signupStats?.pending || 0}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <UserPlus className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{signupStats?.standby || 0}</p>
                    <p className="text-xs text-muted-foreground">Standby</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Users className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{squadCount || 0}</p>
                    <p className="text-xs text-muted-foreground">Squads</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full grid grid-cols-5 h-auto p-1">
            <TabsTrigger value="signups" className="flex items-center gap-2 py-2.5">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Signups</span>
            </TabsTrigger>
            <TabsTrigger value="squads" className="flex items-center gap-2 py-2.5">
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Squads</span>
            </TabsTrigger>
            <TabsTrigger value="approval" className="flex items-center gap-2 py-2.5">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Approval</span>
            </TabsTrigger>
            <TabsTrigger value="comms" className="flex items-center gap-2 py-2.5">
              <Megaphone className="h-4 w-4" />
              <span className="hidden sm:inline">Comms</span>
            </TabsTrigger>
            <TabsTrigger value="logistics" className="flex items-center gap-2 py-2.5">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Logistics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signups">
            <CreatorSignupsTab questId={questId!} capacity={quest.capacity_total || 24} />
          </TabsContent>

          <TabsContent value="squads">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                <CreatorSquadsTab questId={questId!} />
              </div>
              <div className="space-y-6">
                <CreatorMemberAssignment questId={questId!} />
                <IcebreakerPromptPicker questId={questId!} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="approval">
            <CreatorSquadApproval questId={questId!} />
          </TabsContent>

          <TabsContent value="comms">
            <CreatorCommsTab questId={questId!} questTitle={quest.title} />
          </TabsContent>

          <TabsContent value="logistics">
            <CreatorLogisticsTab quest={quest} />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
