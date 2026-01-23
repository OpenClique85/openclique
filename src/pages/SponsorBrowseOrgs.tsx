import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SponsorPortalNav } from '@/components/sponsors/SponsorPortalNav';
import { SponsorOrgProposalModal } from '@/components/collaboration/SponsorOrgProposalModal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Users,
  Search,
  GraduationCap,
  Building2,
  Handshake,
  ExternalLink,
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  type: string;
  school_affiliation: string | null;
  website_url: string | null;
  seeking: string[] | null;
}

const ORG_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'fraternity', label: 'Fraternity' },
  { value: 'sorority', label: 'Sorority' },
  { value: 'club', label: 'Club' },
  { value: 'organization', label: 'Organization' },
  { value: 'university', label: 'University' },
];

export default function SponsorBrowseOrgs() {
  const { user, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);

  // Fetch sponsor profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['sponsor-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsor_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user,
  });

  // Fetch organizations
  const { data: organizations, isLoading: orgsLoading } = useQuery({
    queryKey: ['verified-organizations', searchQuery, typeFilter],
    queryFn: async () => {
      let query = supabase
        .from('organizations')
        .select('id, name, slug, logo_url, description, type, school_affiliation, website_url, seeking')
        .eq('is_active', true)
        .eq('is_verified', true)
        .order('name');

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter as 'club' | 'fraternity' | 'sorority' | 'university' | 'nonprofit' | 'company' | 'other');
      }

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,school_affiliation.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data as Organization[];
    },
    enabled: !!profile,
  });

  const handleProposePartnership = (org: Organization) => {
    setSelectedOrg(org);
    setIsProposalModalOpen(true);
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Sponsor Portal</CardTitle>
              <CardDescription>You need to be a sponsor to access this page.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/sponsors/onboard">Become a Sponsor</Link>
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
      <SponsorPortalNav />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Browse Organizations</h1>
          <p className="text-muted-foreground">
            Discover organizations to partner with for your sponsorship opportunities
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or school..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              {ORG_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Organizations Grid */}
        {orgsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : organizations?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No organizations found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {organizations?.map((org) => (
              <Card key={org.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14 flex-shrink-0">
                      <AvatarImage src={org.logo_url || undefined} />
                      <AvatarFallback>
                        <Users className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{org.name}</h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="secondary" className="text-xs capitalize">
                          <Building2 className="h-3 w-3 mr-1" />
                          {org.type}
                        </Badge>
                        {org.school_affiliation && (
                          <Badge variant="outline" className="text-xs">
                            <GraduationCap className="h-3 w-3 mr-1" />
                            {org.school_affiliation}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {org.description && (
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                      {org.description}
                    </p>
                  )}

                  {org.seeking && org.seeking.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Looking for:</p>
                      <div className="flex flex-wrap gap-1">
                        {org.seeking.slice(0, 3).map((item) => (
                          <Badge key={item} variant="outline" className="text-xs capitalize">
                            {item.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-4">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleProposePartnership(org)}
                    >
                      <Handshake className="h-4 w-4 mr-2" />
                      Propose Partnership
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/org/${org.slug}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Proposal Modal */}
      {profile && (
        <SponsorOrgProposalModal
          isOpen={isProposalModalOpen}
          onClose={() => {
            setIsProposalModalOpen(false);
            setSelectedOrg(null);
          }}
          sponsorId={profile.id}
          sponsorName={profile.name}
          org={selectedOrg}
        />
      )}

      <Footer />
    </div>
  );
}
