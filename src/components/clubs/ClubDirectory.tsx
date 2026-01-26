/**
 * ClubDirectory - Netflix-style browse interface for clubs
 * Used within umbrella org portals (e.g., UT Austin)
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, Users, Lock, Globe } from 'lucide-react';
import { ClubCard } from './ClubCard';
import { useClubs, useOrganizations } from '@/hooks/useOrganizations';
import type { Organization } from '@/hooks/useOrganizations';

interface ClubDirectoryProps {
  umbrellaOrgId: string;
  umbrellaOrgName: string;
  onCreateClub?: () => void;
  canCreateClub?: boolean;
}

export function ClubDirectory({
  umbrellaOrgId,
  umbrellaOrgName,
  onCreateClub,
  canCreateClub,
}: ClubDirectoryProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const { data: clubs, isLoading } = useClubs(umbrellaOrgId);
  const { isMemberOf, joinOrg } = useOrganizations();

  // Get unique categories from clubs
  const categories = [...new Set(clubs?.map((c) => c.category).filter(Boolean))];

  // Filter clubs
  const filteredClubs = clubs?.filter((club) => {
    const matchesSearch =
      !search ||
      club.name.toLowerCase().includes(search.toLowerCase()) ||
      club.description?.toLowerCase().includes(search.toLowerCase());

    const matchesVisibility =
      filter === 'all' ||
      (filter === 'public' && club.visibility === 'public') ||
      (filter === 'private' && (club.visibility === 'private' || club.visibility === 'invite_only'));

    const matchesCategory = !categoryFilter || club.category === categoryFilter;

    return matchesSearch && matchesVisibility && matchesCategory;
  });

  // Group clubs by category for Netflix-style rows
  const clubsByCategory = categories.reduce((acc, category) => {
    if (category) {
      acc[category] = filteredClubs?.filter((c) => c.category === category) || [];
    }
    return acc;
  }, {} as Record<string, Organization[]>);

  // Uncategorized clubs
  const uncategorizedClubs = filteredClubs?.filter((c) => !c.category) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-semibold">
            Clubs in {umbrellaOrgName}
          </h2>
          <p className="text-sm text-muted-foreground">
            {clubs?.length || 0} clubs available
          </p>
        </div>
        {canCreateClub && (
          <Button onClick={onCreateClub}>
            <Plus className="h-4 w-4 mr-2" />
            Create a Club
          </Button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clubs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all" className="gap-1">
              <Users className="h-3.5 w-3.5" />
              All
            </TabsTrigger>
            <TabsTrigger value="public" className="gap-1">
              <Globe className="h-3.5 w-3.5" />
              Public
            </TabsTrigger>
            <TabsTrigger value="private" className="gap-1">
              <Lock className="h-3.5 w-3.5" />
              Private
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Category Pills */}
      {categories.length > 0 && (
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            <Badge
              variant={categoryFilter === null ? 'default' : 'outline'}
              className="cursor-pointer shrink-0"
              onClick={() => setCategoryFilter(null)}
            >
              All Categories
            </Badge>
            {categories.map((cat) => (
              <Badge
                key={cat}
                variant={categoryFilter === cat ? 'default' : 'outline'}
                className="cursor-pointer shrink-0"
                onClick={() => setCategoryFilter(cat === categoryFilter ? null : cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* Club Lists */}
      {filteredClubs?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No clubs found matching your criteria</p>
          {canCreateClub && (
            <Button variant="outline" className="mt-4" onClick={onCreateClub}>
              Create the first club
            </Button>
          )}
        </div>
      ) : categoryFilter || search ? (
        // Flat list when filtering
        <div className="grid gap-3">
          {filteredClubs?.map((club) => (
            <ClubCard
              key={club.id}
              club={club}
              isMember={isMemberOf(club.id)}
              onJoin={() => joinOrg.mutate(club.id)}
              isJoining={joinOrg.isPending}
            />
          ))}
        </div>
      ) : (
        // Netflix-style category rows
        <div className="space-y-8">
          {Object.entries(clubsByCategory).map(([category, categoryClubs]) =>
            categoryClubs.length > 0 ? (
              <div key={category}>
                <h3 className="font-display font-semibold mb-3">{category}</h3>
                <div className="grid gap-3">
                  {categoryClubs.map((club) => (
                    <ClubCard
                      key={club.id}
                      club={club}
                      isMember={isMemberOf(club.id)}
                      onJoin={() => joinOrg.mutate(club.id)}
                      isJoining={joinOrg.isPending}
                    />
                  ))}
                </div>
              </div>
            ) : null
          )}

          {uncategorizedClubs.length > 0 && (
            <div>
              <h3 className="font-display font-semibold mb-3">Other Clubs</h3>
              <div className="grid gap-3">
                {uncategorizedClubs.map((club) => (
                  <ClubCard
                    key={club.id}
                    club={club}
                    isMember={isMemberOf(club.id)}
                    onJoin={() => joinOrg.mutate(club.id)}
                    isJoining={joinOrg.isPending}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
