/**
 * =============================================================================
 * EnterpriseOrgsManager - Umbrella organization analytics and management
 * =============================================================================
 * 
 * Features:
 * - List all umbrella organizations (is_umbrella = true)
 * - Child clubs count and list
 * - Aggregate stats: total members, active quests, clique formation
 * - Drill-down to individual club stats
 * - Verified domains management
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Building2, 
  Users, 
  Calendar, 
  Target,
  ChevronRight,
  Search,
  Loader2,
  GraduationCap,
  Globe,
  BarChart3,
  TrendingUp,
  Shield,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';

interface ChildClub {
  id: string;
  name: string;
  slug: string;
  type: string;
  member_count: number;
  quest_count: number;
  created_at: string;
}

interface UmbrellaOrg {
  id: string;
  name: string;
  slug: string;
  school_affiliation: string | null;
  verified_domains: string[] | null;
  primary_color: string | null;
  is_verified: boolean;
  created_at: string;
  // Aggregated stats
  child_clubs_count: number;
  total_members: number;
  active_quests: number;
  child_clubs: ChildClub[];
}

export function EnterpriseOrgsManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<UmbrellaOrg | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch umbrella organizations with aggregated stats
  const { data: umbrellaOrgs, isLoading } = useQuery({
    queryKey: ['enterprise-orgs'],
    queryFn: async () => {
      // Get all umbrella orgs
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('is_umbrella', true)
        .order('name');

      if (error) throw error;
      if (!orgs) return [];

      // Get aggregated stats for each umbrella
      const orgsWithStats: UmbrellaOrg[] = await Promise.all(
        orgs.map(async (org) => {
          // Get child clubs
          const { data: childClubs } = await supabase
            .from('organizations')
            .select('id, name, slug, type, created_at')
            .eq('parent_org_id', org.id);

          const childClubIds = childClubs?.map(c => c.id) || [];

          // Get member counts for child clubs
          const clubsWithCounts: ChildClub[] = await Promise.all(
            (childClubs || []).map(async (club) => {
              const { count: memberCount } = await supabase
                .from('profile_organizations')
                .select('*', { count: 'exact', head: true })
                .eq('org_id', club.id);

              const { count: questCount } = await supabase
                .from('quests')
                .select('*', { count: 'exact', head: true })
                .eq('org_id', club.id)
                .eq('status', 'open');

              return {
                ...club,
                member_count: memberCount || 0,
                quest_count: questCount || 0,
              };
            })
          );

          // Calculate totals
          const totalMembers = clubsWithCounts.reduce((sum, c) => sum + c.member_count, 0);
          const activeQuests = clubsWithCounts.reduce((sum, c) => sum + c.quest_count, 0);

          // Also count members directly in umbrella org
          const { count: directMembers } = await supabase
            .from('profile_organizations')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', org.id);

          return {
            id: org.id,
            name: org.name,
            slug: org.slug,
            school_affiliation: org.school_affiliation,
            verified_domains: org.verified_domains,
            primary_color: org.primary_color,
            is_verified: org.is_verified,
            created_at: org.created_at,
            child_clubs_count: childClubIds.length,
            total_members: totalMembers + (directMembers || 0),
            active_quests: activeQuests,
            child_clubs: clubsWithCounts,
          };
        })
      );

      return orgsWithStats;
    },
  });

  const filteredOrgs = umbrellaOrgs?.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleViewDetails = (org: UmbrellaOrg) => {
    setSelectedOrg(org);
    setShowDetailsModal(true);
  };

  // Summary stats
  const totalUmbrellas = filteredOrgs.length;
  const totalClubs = filteredOrgs.reduce((sum, o) => sum + o.child_clubs_count, 0);
  const totalMembers = filteredOrgs.reduce((sum, o) => sum + o.total_members, 0);
  const totalQuests = filteredOrgs.reduce((sum, o) => sum + o.active_quests, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-display font-bold">Enterprise View</h2>
        <p className="text-muted-foreground">
          Umbrella organizations and aggregate analytics across child clubs
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalUmbrellas}</p>
                <p className="text-sm text-muted-foreground">Enterprise Orgs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalClubs}</p>
                <p className="text-sm text-muted-foreground">Child Clubs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalMembers.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalQuests}</p>
                <p className="text-sm text-muted-foreground">Active Quests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search enterprise organizations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Enterprise Organizations List */}
      {filteredOrgs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Enterprise Organizations</h3>
            <p className="text-muted-foreground">
              Create an umbrella organization to see it here
            </p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-3">
          {filteredOrgs.map((org) => (
            <AccordionItem 
              key={org.id} 
              value={org.id}
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center gap-4 flex-1 text-left">
                  <div 
                    className="p-2.5 rounded-full"
                    style={{ 
                      backgroundColor: org.primary_color 
                        ? `${org.primary_color}20` 
                        : 'hsl(var(--primary) / 0.1)',
                      color: org.primary_color || 'hsl(var(--primary))'
                    }}
                  >
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{org.name}</h3>
                      {org.is_verified && (
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {org.child_clubs_count} clubs • {org.total_members} members • {org.active_quests} quests
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  {/* Verified Domains */}
                  {org.verified_domains && org.verified_domains.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Domains:</span>
                      {org.verified_domains.map((domain) => (
                        <Badge key={domain} variant="outline" className="text-xs">
                          <Mail className="h-3 w-3 mr-1" />
                          {domain}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Child Clubs Table */}
                  {org.child_clubs.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Club</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Members</TableHead>
                            <TableHead>Quests</TableHead>
                            <TableHead>Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {org.child_clubs.map((club) => (
                            <TableRow key={club.id}>
                              <TableCell className="font-medium">{club.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {club.type}
                                </Badge>
                              </TableCell>
                              <TableCell>{club.member_count}</TableCell>
                              <TableCell>{club.quest_count}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {format(new Date(club.created_at), 'MMM d, yyyy')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No child clubs yet</p>
                    </div>
                  )}

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewDetails(org)}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Full Analytics
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              {selectedOrg?.name} Analytics
            </DialogTitle>
            <DialogDescription>
              Aggregate metrics across all child clubs
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrg && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-3xl font-bold">{selectedOrg.child_clubs_count}</p>
                    <p className="text-sm text-muted-foreground">Clubs</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-3xl font-bold">{selectedOrg.total_members}</p>
                    <p className="text-sm text-muted-foreground">Members</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-3xl font-bold">{selectedOrg.active_quests}</p>
                    <p className="text-sm text-muted-foreground">Active Quests</p>
                  </CardContent>
                </Card>
              </div>

              {/* Club Breakdown */}
              <div>
                <h4 className="font-semibold mb-3">Club Performance</h4>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {selectedOrg.child_clubs
                      .sort((a, b) => b.member_count - a.member_count)
                      .map((club) => {
                        const memberPercent = selectedOrg.total_members > 0 
                          ? (club.member_count / selectedOrg.total_members) * 100 
                          : 0;
                        
                        return (
                          <div key={club.id} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{club.name}</span>
                              <span className="text-muted-foreground">
                                {club.member_count} members
                              </span>
                            </div>
                            <Progress value={memberPercent} className="h-2" />
                          </div>
                        );
                      })}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
