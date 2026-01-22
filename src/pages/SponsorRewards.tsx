import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SponsorPortalNav } from '@/components/sponsors/SponsorPortalNav';
import { RewardFormModal } from '@/components/sponsors/RewardFormModal';
import { RewardCard } from '@/components/sponsors/RewardCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Loader2, 
  Plus, 
  Gift,
  TrendingUp,
  Users,
  Percent
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Reward = Tables<'rewards'>;

export default function SponsorRewards() {
  const { user, isLoading: authLoading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const queryClient = useQueryClient();

  // Fetch sponsor profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['sponsor-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsor_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch rewards
  const { data: rewards, isLoading: rewardsLoading } = useQuery({
    queryKey: ['sponsor-rewards', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('sponsor_id', profile!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Reward[];
    },
    enabled: !!profile?.id,
  });

  // Calculate stats
  const stats = {
    total: rewards?.length || 0,
    active: rewards?.filter(r => r.status === 'active').length || 0,
    totalRedemptions: rewards?.reduce((sum, r) => sum + (r.redemptions_count || 0), 0) || 0,
    avgRedemptionRate: (() => {
      const rewardsWithMax = rewards?.filter(r => r.max_redemptions) || [];
      if (rewardsWithMax.length === 0) return 0;
      const rate = rewardsWithMax.reduce((sum, r) => {
        return sum + ((r.redemptions_count || 0) / (r.max_redemptions || 1)) * 100;
      }, 0) / rewardsWithMax.length;
      return Math.round(rate);
    })(),
  };

  const handleEdit = (reward: Reward) => {
    setEditingReward(reward);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingReward(null);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['sponsor-rewards'] });
    handleCloseModal();
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center">
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Please complete sponsor onboarding first.</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      <SponsorPortalNav />
      
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">Rewards</h1>
              <p className="text-muted-foreground">
                Create and manage rewards for quest participants
              </p>
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Reward
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Gift className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">Total Rewards</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.active}</p>
                    <p className="text-sm text-muted-foreground">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalRedemptions}</p>
                    <p className="text-sm text-muted-foreground">Redemptions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Percent className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.avgRedemptionRate}%</p>
                    <p className="text-sm text-muted-foreground">Avg. Redemption</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rewards Grid */}
          {rewardsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : rewards?.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No Rewards Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create rewards to offer perks to quest participants
                </p>
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Reward
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards?.map((reward) => (
                <RewardCard 
                  key={reward.id} 
                  reward={reward} 
                  onEdit={() => handleEdit(reward)}
                  onRefresh={() => queryClient.invalidateQueries({ queryKey: ['sponsor-rewards'] })}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      <RewardFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        sponsorId={profile.id}
        editingReward={editingReward}
      />
    </div>
  );
}
