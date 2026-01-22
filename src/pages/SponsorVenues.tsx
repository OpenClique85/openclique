import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SponsorPortalNav } from '@/components/sponsors/SponsorPortalNav';
import { VenueFormModal } from '@/components/sponsors/VenueFormModal';
import { VenueCard } from '@/components/sponsors/VenueCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Loader2, 
  Plus, 
  MapPin,
  CheckCircle,
  Users,
  Calendar
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type VenueOffering = Tables<'venue_offerings'>;

export default function SponsorVenues() {
  const { user, isLoading: authLoading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<VenueOffering | null>(null);
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

  // Fetch venues
  const { data: venues, isLoading: venuesLoading } = useQuery({
    queryKey: ['sponsor-venues', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venue_offerings')
        .select('*')
        .eq('sponsor_id', profile!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as VenueOffering[];
    },
    enabled: !!profile?.id,
  });

  // Calculate stats
  const stats = {
    total: venues?.length || 0,
    available: venues?.filter(v => v.status === 'available').length || 0,
    totalCapacity: venues?.reduce((sum, v) => sum + (v.capacity || 0), 0) || 0,
    daysAvailable: (() => {
      const allDays = new Set<string>();
      venues?.forEach(v => {
        (v.available_days || []).forEach((d: string) => allDays.add(d));
      });
      return allDays.size;
    })(),
  };

  const handleEdit = (venue: VenueOffering) => {
    setEditingVenue(venue);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVenue(null);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['sponsor-venues'] });
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

  // Check if sponsor type allows venues
  const canHaveVenues = profile.sponsor_type === 'venue' || profile.sponsor_type === 'both';

  if (!canHaveVenues) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Navbar />
        <SponsorPortalNav />
        <main className="flex-1 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">Venue Features Not Available</h3>
                <p className="text-muted-foreground">
                  Venue management is available for venue-type sponsors. 
                  Contact us to update your sponsor type.
                </p>
              </CardContent>
            </Card>
          </div>
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
              <h1 className="text-3xl font-bold">Venues</h1>
              <p className="text-muted-foreground">
                Manage your venue spaces for quest hosts
              </p>
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Venue
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">Total Venues</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.available}</p>
                    <p className="text-sm text-muted-foreground">Available</p>
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
                    <p className="text-2xl font-bold">{stats.totalCapacity}</p>
                    <p className="text-sm text-muted-foreground">Total Capacity</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Calendar className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.daysAvailable}</p>
                    <p className="text-sm text-muted-foreground">Days Available</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Venues Grid */}
          {venuesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : venues?.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No Venues Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your venue spaces to offer them for quests
                </p>
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Venue
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {venues?.map((venue) => (
                <VenueCard 
                  key={venue.id} 
                  venue={venue} 
                  onEdit={() => handleEdit(venue)}
                  onRefresh={() => queryClient.invalidateQueries({ queryKey: ['sponsor-venues'] })}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      <VenueFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        sponsorId={profile.id}
        editingVenue={editingVenue}
      />
    </div>
  );
}
