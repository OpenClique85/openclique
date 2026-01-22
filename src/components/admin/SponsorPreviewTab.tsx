import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Loader2, 
  Eye, 
  Copy, 
  ExternalLink, 
  LayoutDashboard, 
  Gift, 
  MapPin, 
  Search,
  AlertTriangle,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Import the preview-able components
import { SponsorDashboardPreview } from './previews/SponsorDashboardPreview';
import { SponsorRewardsPreview } from './previews/SponsorRewardsPreview';
import { SponsorVenuesPreview } from './previews/SponsorVenuesPreview';

type SponsorProfile = Tables<'sponsor_profiles'>;

interface SponsorWithEmail extends SponsorProfile {
  email?: string;
}

export function SponsorPreviewTab() {
  const [selectedSponsorId, setSelectedSponsorId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Fetch all sponsors
  const { data: sponsors, isLoading: sponsorsLoading } = useQuery({
    queryKey: ['admin-all-sponsors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsor_profiles')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as SponsorProfile[];
    },
  });

  // Fetch selected sponsor details (including email from profiles)
  const { data: selectedSponsor, isLoading: sponsorLoading } = useQuery({
    queryKey: ['admin-sponsor-detail', selectedSponsorId],
    queryFn: async () => {
      if (!selectedSponsorId) return null;

      const { data: sponsor, error } = await supabase
        .from('sponsor_profiles')
        .select('*')
        .eq('user_id', selectedSponsorId)
        .single();
      
      if (error) throw error;

      // Also fetch email from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', selectedSponsorId)
        .maybeSingle();

      return {
        ...sponsor,
        email: profile?.email,
      } as SponsorWithEmail;
    },
    enabled: !!selectedSponsorId,
  });

  const handleCopyUserId = () => {
    if (selectedSponsorId) {
      navigator.clipboard.writeText(selectedSponsorId);
      toast.success('User ID copied to clipboard');
    }
  };

  if (sponsorsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sponsor Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Sponsor Preview Mode
          </CardTitle>
          <CardDescription>
            View the sponsor portal exactly as a specific sponsor would see it
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Select
              value={selectedSponsorId || ''}
              onValueChange={(value) => setSelectedSponsorId(value || null)}
            >
              <SelectTrigger className="w-full md:w-96">
                <SelectValue placeholder="Select a sponsor to preview..." />
              </SelectTrigger>
              <SelectContent>
                {sponsors?.map((sponsor) => (
                  <SelectItem key={sponsor.user_id} value={sponsor.user_id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{sponsor.name}</span>
                      <Badge variant="outline" className="text-xs ml-2">
                        {sponsor.status}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedSponsorId && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyUserId}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy User ID
                </Button>
                {selectedSponsor?.slug && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/sponsors/${selectedSponsor.slug}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Public Profile
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Content */}
      {selectedSponsorId && (
        <>
          {/* Preview Mode Banner */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-amber-400">Preview Mode Active</p>
              <p className="text-sm text-muted-foreground">
                Viewing as: <span className="font-medium">{selectedSponsor?.name}</span>
                {selectedSponsor?.email && (
                  <span className="ml-2 text-muted-foreground">({selectedSponsor.email})</span>
                )}
              </p>
            </div>
          </div>

          {/* Sponsor Debug Info */}
          {selectedSponsor && (
            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge variant={selectedSponsor.status === 'approved' ? 'default' : 'secondary'}>
                      {selectedSponsor.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="capitalize">{selectedSponsor.sponsor_type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Slug</p>
                    <p className="font-mono text-xs">{selectedSponsor.slug || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">City</p>
                    <p>{selectedSponsor.city || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p>{format(new Date(selectedSponsor.created_at), 'MMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">User ID</p>
                    <p className="font-mono text-xs truncate" title={selectedSponsor.user_id}>
                      {selectedSponsor.user_id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Portal Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="discover" className="gap-2">
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Discover</span>
              </TabsTrigger>
              <TabsTrigger value="venues" className="gap-2">
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">Venues</span>
              </TabsTrigger>
              <TabsTrigger value="rewards" className="gap-2">
                <Gift className="h-4 w-4" />
                <span className="hidden sm:inline">Rewards</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-6 border border-dashed border-amber-500/30 rounded-lg p-4 bg-card">
              <TabsContent value="dashboard" className="mt-0">
                <SponsorDashboardPreview previewUserId={selectedSponsorId} />
              </TabsContent>

              <TabsContent value="discover" className="mt-0">
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Discover page preview - shows quest and creator search</p>
                </div>
              </TabsContent>

              <TabsContent value="venues" className="mt-0">
                <SponsorVenuesPreview previewUserId={selectedSponsorId} />
              </TabsContent>

              <TabsContent value="rewards" className="mt-0">
                <SponsorRewardsPreview previewUserId={selectedSponsorId} />
              </TabsContent>
            </div>
          </Tabs>
        </>
      )}

      {/* Empty State */}
      {!selectedSponsorId && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Select a Sponsor</h3>
            <p className="text-muted-foreground">
              Choose a sponsor from the dropdown above to preview their portal experience
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
