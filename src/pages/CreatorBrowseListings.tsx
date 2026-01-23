/**
 * CreatorBrowseListings - Browse sponsor opportunities and apply
 */

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link, useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CreatorPortalNav } from '@/components/creators/CreatorPortalNav';
import { ListingApplicationModal } from '@/components/creators/ListingApplicationModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Sparkles, 
  DollarSign, 
  Users, 
  MapPin,
  Gift,
  Building2,
  ExternalLink,
  Calendar
} from 'lucide-react';

const QUEST_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'culture', label: 'Culture & Arts' },
  { value: 'wellness', label: 'Wellness & Fitness' },
  { value: 'connector', label: 'Social & Connector' },
  { value: 'adventure', label: 'Adventure & Outdoors' },
  { value: 'food', label: 'Food & Drink' },
  { value: 'civic', label: 'Civic & Volunteer' },
];

const BUDGET_RANGES = [
  { value: 'all', label: 'Any Budget' },
  { value: 'under_500', label: 'Under $500' },
  { value: '500_1000', label: '$500 - $1,000' },
  { value: '1000_2500', label: '$1,000 - $2,500' },
  { value: '2500_5000', label: '$2,500 - $5,000' },
  { value: 'over_5000', label: '$5,000+' },
];

interface Listing {
  id: string;
  sponsor_id: string;
  title: string;
  description: string | null;
  quest_type: string | null;
  budget_range: string | null;
  rewards_offered: string[];
  venue_offered: string | null;
  includes_branding: boolean;
  target_audience: { age_ranges?: string[]; interests?: string[] } | null;
  preferred_dates: string | null;
  expected_attendance: string | null;
  creator_requirements: string | null;
  applications_count: number;
  created_at: string;
}

interface SponsorProfile {
  id: string;
  business_name: string;
  logo_url: string | null;
  city: string | null;
  slug: string | null;
}

export default function CreatorBrowseListings() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const highlightedListingId = searchParams.get('listing');
  
  const [search, setSearch] = useState('');
  const [questType, setQuestType] = useState('all');
  const [budgetRange, setBudgetRange] = useState('all');
  const [applyingTo, setApplyingTo] = useState<Listing | null>(null);

  // Fetch open listings
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['open-listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsor_listings')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Listing[];
    },
  });

  // Fetch sponsor profiles
  const sponsorIds = [...new Set(listings.map(l => l.sponsor_id))];
  const { data: sponsors = {} } = useQuery({
    queryKey: ['sponsor-profiles-map', sponsorIds],
    queryFn: async () => {
      if (sponsorIds.length === 0) return {};
      const { data } = await supabase
        .from('sponsor_profiles')
        .select('id, name, logo_url, city, slug')
        .in('id', sponsorIds);
      
      const map: Record<string, SponsorProfile> = {};
      data?.forEach(s => { map[s.id] = { ...s, business_name: s.name } as SponsorProfile; });
      return map;
    },
    enabled: sponsorIds.length > 0,
  });

  // Fetch user's applications
  const { data: myApplications = [] } = useQuery({
    queryKey: ['my-listing-applications', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('listing_applications')
        .select('listing_id, status')
        .eq('creator_id', user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const appliedListingIds = new Set(myApplications.map(a => a.listing_id));

  // Filter listings
  const filteredListings = listings.filter((listing) => {
    const matchesSearch = !search || 
      listing.title.toLowerCase().includes(search.toLowerCase()) ||
      listing.description?.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = questType === 'all' || listing.quest_type === questType;
    const matchesBudget = budgetRange === 'all' || listing.budget_range === budgetRange;

    return matchesSearch && matchesType && matchesBudget;
  });

  // Sort highlighted listing to top
  if (highlightedListingId) {
    const idx = filteredListings.findIndex(l => l.id === highlightedListingId);
    if (idx > 0) {
      const [listing] = filteredListings.splice(idx, 1);
      filteredListings.unshift(listing);
    }
  }

  const getBudgetLabel = (value: string | null) => {
    return BUDGET_RANGES.find(b => b.value === value)?.label || value;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container max-w-6xl mx-auto px-4 py-8">
        <CreatorPortalNav />

        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold mb-1">Browse Opportunities</h1>
          <p className="text-muted-foreground">
            Find sponsors looking for creators like you
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search listings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={questType} onValueChange={setQuestType}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUEST_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={budgetRange} onValueChange={setBudgetRange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BUDGET_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Listings */}
        {isLoading ? (
          <div className="grid gap-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : filteredListings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No listings found</h3>
              <p className="text-muted-foreground">
                {search || questType !== 'all' || budgetRange !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Check back soon for new opportunities'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredListings.map((listing) => {
              const sponsor = sponsors[listing.sponsor_id];
              const hasApplied = appliedListingIds.has(listing.id);
              const isHighlighted = listing.id === highlightedListingId;

              return (
                <Card 
                  key={listing.id} 
                  className={`hover:shadow-md transition-shadow ${
                    isHighlighted ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      {/* Sponsor info */}
                      <div className="flex items-center gap-3 md:w-48 shrink-0">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={sponsor?.logo_url || undefined} />
                          <AvatarFallback>
                            <Building2 className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          {sponsor?.slug ? (
                            <Link 
                              to={`/sponsors/${sponsor.slug}`}
                              className="font-medium hover:text-primary flex items-center gap-1"
                            >
                              {sponsor?.business_name || 'Sponsor'}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          ) : (
                            <p className="font-medium">{sponsor?.business_name || 'Sponsor'}</p>
                          )}
                          {sponsor?.city && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {sponsor.city}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Listing details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1">{listing.title}</h3>
                        
                        {listing.description && (
                          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                            {listing.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 mb-3">
                          {listing.quest_type && (
                            <Badge variant="outline">
                              <Sparkles className="h-3 w-3 mr-1" />
                              {listing.quest_type}
                            </Badge>
                          )}
                          {listing.budget_range && (
                            <Badge variant="secondary">
                              <DollarSign className="h-3 w-3 mr-1" />
                              {getBudgetLabel(listing.budget_range)}
                            </Badge>
                          )}
                          {listing.expected_attendance && (
                            <Badge variant="outline">
                              <Users className="h-3 w-3 mr-1" />
                              {listing.expected_attendance}
                            </Badge>
                          )}
                          {listing.rewards_offered?.length > 0 && (
                            <Badge variant="outline">
                              <Gift className="h-3 w-3 mr-1" />
                              {listing.rewards_offered.length} reward(s)
                            </Badge>
                          )}
                          {listing.includes_branding && (
                            <Badge>Branding included</Badge>
                          )}
                        </div>

                        {listing.preferred_dates && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {listing.preferred_dates}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {hasApplied ? (
                          <Badge variant="secondary">Applied</Badge>
                        ) : (
                          <Button onClick={() => setApplyingTo(listing)}>
                            Apply
                          </Button>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {listing.applications_count} applied
                        </span>
                      </div>
                    </div>

                    {/* Requirements */}
                    {listing.creator_requirements && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium mb-1">Requirements</p>
                        <p className="text-sm text-muted-foreground">
                          {listing.creator_requirements}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />

      {applyingTo && (
        <ListingApplicationModal
          isOpen={!!applyingTo}
          onClose={() => setApplyingTo(null)}
          listing={applyingTo}
          sponsorName={sponsors[applyingTo.sponsor_id]?.business_name || 'Sponsor'}
        />
      )}
    </div>
  );
}
