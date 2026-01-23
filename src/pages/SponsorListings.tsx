/**
 * SponsorListings - Management page for sponsor's "Seeking Creators" listings
 */

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SponsorPortalNav } from '@/components/sponsors/SponsorPortalNav';
import { SponsorListingFormModal } from '@/components/sponsors/SponsorListingFormModal';
import { ListingApplicationsModal } from '@/components/sponsors/ListingApplicationsModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { 
  Plus, 
  Loader2, 
  Sparkles, 
  MoreVertical,
  Pencil,
  Eye,
  EyeOff,
  Trash2,
  Users,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Listing {
  id: string;
  title: string;
  description: string | null;
  quest_type: string | null;
  budget_range: string | null;
  status: string;
  applications_count: number;
  created_at: string;
  expires_at: string | null;
}

export default function SponsorListings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [viewingApplications, setViewingApplications] = useState<string | null>(null);

  // Fetch sponsor profile
  const { data: sponsorProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ['sponsor-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsor_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch listings
  const { data: listings = [], isLoading: loadingListings } = useQuery({
    queryKey: ['sponsor-listings', sponsorProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsor_listings')
        .select('*')
        .eq('sponsor_id', sponsorProfile!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Listing[];
    },
    enabled: !!sponsorProfile?.id,
  });

  // Update listing status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('sponsor_listings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsor-listings'] });
      toast.success('Listing updated');
    },
    onError: () => {
      toast.error('Failed to update listing');
    },
  });

  // Delete listing
  const deleteListing = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sponsor_listings')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsor-listings'] });
      toast.success('Listing deleted');
    },
    onError: () => {
      toast.error('Failed to delete listing');
    },
  });

  const handleEdit = (listing: Listing) => {
    setEditingListing(listing);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingListing(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'closed': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'filled': return 'bg-primary/10 text-primary border-primary/20';
      default: return '';
    }
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container max-w-6xl mx-auto px-4 py-8">
          <Skeleton className="h-12 w-48 mb-6" />
          <div className="grid gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!sponsorProfile) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container max-w-6xl mx-auto px-4 py-8">
          <Card className="text-center py-12">
            <CardContent>
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Become a Sponsor</h2>
              <p className="text-muted-foreground mb-4">
                Apply to become a sponsor to create listings
              </p>
              <Button asChild>
                <Link to="/partners">Apply Now</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container max-w-6xl mx-auto px-4 py-8">
        <SponsorPortalNav />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold">Seeking Creators</h1>
            <p className="text-muted-foreground">
              Post opportunities for creators to apply
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Listing
          </Button>
        </div>

        {loadingListings ? (
          <div className="grid gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : listings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No listings yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first listing to attract creators
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Listing
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {listings.map((listing) => (
              <Card key={listing.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg truncate">{listing.title}</h3>
                        <Badge className={getStatusColor(listing.status)}>
                          {listing.status}
                        </Badge>
                      </div>
                      
                      {listing.description && (
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                          {listing.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-3 text-sm">
                        {listing.quest_type && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Sparkles className="h-4 w-4" />
                            {listing.quest_type}
                          </span>
                        )}
                        {listing.budget_range && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <DollarSign className="h-4 w-4" />
                            {listing.budget_range}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(listing.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setViewingApplications(listing.id)}
                      >
                        <Users className="h-4 w-4 mr-1" />
                        {listing.applications_count} Applications
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(listing)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {listing.status === 'draft' && (
                            <DropdownMenuItem 
                              onClick={() => updateStatus.mutate({ id: listing.id, status: 'open' })}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Publish
                            </DropdownMenuItem>
                          )}
                          {listing.status === 'open' && (
                            <DropdownMenuItem 
                              onClick={() => updateStatus.mutate({ id: listing.id, status: 'closed' })}
                            >
                              <EyeOff className="h-4 w-4 mr-2" />
                              Close
                            </DropdownMenuItem>
                          )}
                          {listing.status === 'closed' && (
                            <DropdownMenuItem 
                              onClick={() => updateStatus.mutate({ id: listing.id, status: 'open' })}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Reopen
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => deleteListing.mutate(listing.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />

      <SponsorListingFormModal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        sponsorId={sponsorProfile.id}
        editingListing={editingListing}
      />

      {viewingApplications && (
        <ListingApplicationsModal
          isOpen={!!viewingApplications}
          onClose={() => setViewingApplications(null)}
          listingId={viewingApplications}
        />
      )}
    </div>
  );
}
