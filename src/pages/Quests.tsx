import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import QuestCard from '@/components/QuestCard';
import QuestRow from '@/components/QuestRow';
import QuestModal from '@/components/QuestModal';
import QuestFilterBar, { type QuestFilters } from '@/components/QuestFilterBar';
import { CTASection } from '@/components/CTASection';
import { UserWeekCalendarView, MobileFilterDrawer } from '@/components/quests';
import { useQuests, type Quest } from '@/hooks/useQuests';
import { useCreatorSlugs } from '@/hooks/useCreatorSlugs';
import { useFollowedIds } from '@/hooks/useFollows';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2, Inbox, CalendarDays, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';

import buggsFace from '@/assets/buggs-face.png';
import foodTruckScene from '@/assets/austin/food-truck-scene.jpg';
import { TutorialQuestBanner } from '@/components/tutorial-quest';

const CATEGORY_CONFIG = {
  culture: { icon: '🎭', title: 'Culture & Arts' },
  wellness: { icon: '🧘', title: 'Wellness & Fitness' },
  connector: { icon: '🤝', title: 'Social & Networking' },
} as const;

const Quests = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: quests = [], isLoading, error } = useQuests();
  const { creatorIds: followedCreatorIds, sponsorIds: followedSponsorIds, hasFollows } = useFollowedIds();
  
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  const [filters, setFilters] = useState<QuestFilters>({
    search: '',
    month: null,
    days: [],
    statuses: [],
    interests: [],
    creatorId: null,
    sortBy: 'date',
    followingOnly: false,
  });

  const handleQuestClick = (quest: Quest) => {
    setSelectedQuest(quest);
    setModalOpen(true);
  };

  const handleCalendarQuestClick = (questSlug: string) => {
    navigate(`/quests/${questSlug}`);
  };

  // Apply filters and sorting
  const filteredQuests = useMemo(() => {
    let result = quests.filter((quest) => {
      // Following filter - check if quest creator or sponsor is followed
      if (filters.followingOnly) {
        const creatorFollowed = quest.creatorId && followedCreatorIds.has(quest.creatorId);
        const sponsorFollowed = quest.sponsorId && followedSponsorIds.has(quest.sponsorId);
        if (!creatorFollowed && !sponsorFollowed) return false;
      }

      // Search filter
      if (filters.search.trim()) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          quest.title.toLowerCase().includes(searchLower) ||
          quest.shortDescription.toLowerCase().includes(searchLower) ||
          quest.theme?.toLowerCase().includes(searchLower) ||
          quest.rewards?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Interest filter
      if (filters.interests.length > 0) {
        const questTree = quest.progressionTree?.toLowerCase();
        const matchesInterest = filters.interests.some(interest => 
          questTree?.includes(interest.toLowerCase())
        );
        if (!matchesInterest) return false;
      }

      // Status filter
      if (filters.statuses.length > 0 && !filters.statuses.includes(quest.status)) {
        return false;
      }

      // Creator filter
      if (filters.creatorId && quest.creatorId !== filters.creatorId) {
        return false;
      }

      // Month filter
      if (filters.month) {
        const questDateLower = quest.metadata.date.toLowerCase();
        if (!questDateLower.includes(filters.month)) {
          return false;
        }
      }

      // Day filter
      if (filters.days.length > 0) {
        const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const questDateLower = quest.metadata.date.toLowerCase();
        const matchesDay = filters.days.some(dayIndex => 
          questDateLower.includes(dayNames[dayIndex])
        );
        if (!matchesDay) {
          return false;
        }
      }

      return true;
    });

    // Apply sorting
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'date':
          // Sort by start date (soonest first)
          const dateA = a.startDatetime ? new Date(a.startDatetime).getTime() : Infinity;
          const dateB = b.startDatetime ? new Date(b.startDatetime).getTime() : Infinity;
          return dateA - dateB;
        case 'newest':
          // This would need created_at, for now just reverse order
          return 0;
        case 'popular':
        case 'rating':
          // Would need signup counts/ratings, for now keep order
          return 0;
        default:
          return 0;
      }
    });

    return result;
  }, [quests, filters, followedCreatorIds, followedSponsorIds]);

  // Get unique creator IDs for fetching slugs
  const creatorIds = useMemo(() => {
    return [...new Set(
      filteredQuests
        .filter(q => q.creatorType === 'community' && q.creatorId)
        .map(q => q.creatorId!)
    )];
  }, [filteredQuests]);

  // Fetch creator slugs for linking
  const { data: creatorSlugs } = useCreatorSlugs(creatorIds);

  // Group quests for Netflix-style layout
  const questGroups = useMemo(() => {
    // Quests happening this week (next 7 days)
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const thisWeek = filteredQuests.filter(quest => {
      if (!quest.startDatetime) return false;
      const questDate = new Date(quest.startDatetime);
      return questDate >= now && questDate <= weekFromNow && quest.status === 'open';
    });

    // Group by category
    const byCategory = {
      culture: filteredQuests.filter(q => q.progressionTree === 'culture'),
      wellness: filteredQuests.filter(q => q.progressionTree === 'wellness'),
      connector: filteredQuests.filter(q => q.progressionTree === 'connector'),
    };

    // Group by creator (only creators with 2+ quests)
    const byCreator = new Map<string, { name: string; quests: Quest[] }>();
    filteredQuests.forEach(quest => {
      if (quest.creatorType === 'community' && quest.creatorId) {
        if (!byCreator.has(quest.creatorId)) {
          byCreator.set(quest.creatorId, {
            name: quest.creatorName || 'Creator',
            quests: []
          });
        }
        byCreator.get(quest.creatorId)!.quests.push(quest);
      }
    });

    // Filter to only creators with 2+ quests
    const creatorRows = Array.from(byCreator.entries())
      .filter(([_, data]) => data.quests.length >= 2)
      .map(([creatorId, data]) => ({
        creatorId,
        name: data.name,
        slug: creatorSlugs?.get(creatorId)?.slug,
        quests: data.quests,
      }));

    // Quests from followed creators/sponsors (for "From People You Follow" row)
    const followingQuests = hasFollows ? filteredQuests.filter(quest => {
      const creatorFollowed = quest.creatorId && followedCreatorIds.has(quest.creatorId);
      const sponsorFollowed = quest.sponsorId && followedSponsorIds.has(quest.sponsorId);
      return creatorFollowed || sponsorFollowed;
    }) : [];

    return {
      thisWeek,
      byCategory,
      creatorRows,
      followingQuests,
    };
  }, [filteredQuests, creatorSlugs, hasFollows, followedCreatorIds, followedSponsorIds]);

  const hasActiveFilters = 
    filters.search.length > 0 ||
    filters.month !== null || 
    filters.days.length > 0 || 
    filters.statuses.length > 0 ||
    filters.interests.length > 0 ||
    filters.creatorId !== null ||
    filters.followingOnly;

  // Determine if we should use Netflix layout or filtered grid
  const useNetflixLayout = !hasActiveFilters && filteredQuests.length > 0;

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Mobile: Compact Header with Filter Drawer */}
        {isMobile ? (
          <section className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between gap-3">
              <h1 className="font-display text-xl font-bold text-foreground">
                Discover Quests
              </h1>
              <div className="flex items-center gap-2">
                <MobileFilterDrawer 
                  filters={filters}
                  onFilterChange={setFilters}
                />
                {/* Calendar View Toggle */}
                <div className="flex items-center gap-0.5 border rounded-lg p-0.5 bg-muted/30">
                  <Toggle
                    pressed={!showCalendar}
                    onPressedChange={() => setShowCalendar(false)}
                    size="sm"
                    aria-label="Grid view"
                    className="h-8 w-8 p-0 data-[state=on]:bg-background data-[state=on]:shadow-sm"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Toggle>
                  <Toggle
                    pressed={showCalendar}
                    onPressedChange={() => setShowCalendar(true)}
                    size="sm"
                    aria-label="Calendar view"
                    className="h-8 w-8 p-0 data-[state=on]:bg-background data-[state=on]:shadow-sm"
                  >
                    <CalendarDays className="h-4 w-4" />
                  </Toggle>
                </div>
              </div>
            </div>
            
            {/* Calendar View (Mobile) */}
            {showCalendar && (
              <div className="pt-3">
                <UserWeekCalendarView onQuestClick={handleCalendarQuestClick} />
              </div>
            )}
          </section>
        ) : (
          /* Desktop: Full Hero + Filter Bar */
          <>
            <section className="py-12 md:py-16 px-4 relative overflow-hidden">
              <div 
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage: `url(${foodTruckScene})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />
              
              <div className="max-w-4xl mx-auto text-center relative z-10">
                <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3">
                  Discover Your Next Quest
                </h1>
                <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                  Browse curated experiences designed to help you meet new people and explore Austin.
                </p>
              </div>
            </section>

            <section className="px-4 pb-6">
              <div className="max-w-6xl mx-auto space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <QuestFilterBar 
                      filters={filters}
                      onFilterChange={setFilters}
                    />
                  </div>
                  
                  {/* Calendar View Toggle */}
                  <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted/30">
                    <Toggle
                      pressed={!showCalendar}
                      onPressedChange={() => setShowCalendar(false)}
                      size="sm"
                      aria-label="Grid view"
                      className="data-[state=on]:bg-background data-[state=on]:shadow-sm"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Toggle>
                    <Toggle
                      pressed={showCalendar}
                      onPressedChange={() => setShowCalendar(true)}
                      size="sm"
                      aria-label="Calendar view"
                      className="data-[state=on]:bg-background data-[state=on]:shadow-sm"
                    >
                      <CalendarDays className="h-4 w-4" />
                    </Toggle>
                  </div>
                </div>
                
                {/* Calendar View */}
                {showCalendar && (
                  <div className="pt-2">
                    <UserWeekCalendarView onQuestClick={handleCalendarQuestClick} />
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* Loading State */}
        {isLoading && (
          <section className="px-4 py-16">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading quests...</p>
            </div>
          </section>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <section className="px-4 py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-destructive mb-2">Failed to load quests</p>
              <p className="text-muted-foreground text-sm mb-4">Please try refreshing the page.</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          </section>
        )}

        {/* Content */}
        {!isLoading && !error && (
          <>
            {/* Results Count (when filtered) */}
            {hasActiveFilters && (
              <div className="px-4 pb-4">
                <div className="max-w-6xl mx-auto">
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredQuests.length} of {quests.length} quests
                  </p>
                </div>
              </div>
            )}

            {filteredQuests.length > 0 ? (
              useNetflixLayout ? (
                /* Netflix-Style Browse Layout */
                <section className="pb-16 space-y-10">
                  <div className="max-w-[1400px] mx-auto px-4 space-y-10">
                    {/* From People You Follow */}
                    {questGroups.followingQuests.length > 0 && (
                      <QuestRow
                        title="From People You Follow"
                        icon="❤️"
                        quests={questGroups.followingQuests}
                        onQuestClick={handleQuestClick}
                      />
                    )}

                    {/* Happening This Week */}
                    {questGroups.thisWeek.length > 0 && (
                      <QuestRow
                        title="Happening This Week"
                        icon="📅"
                        quests={questGroups.thisWeek}
                        onQuestClick={handleQuestClick}
                      />
                    )}

                    {/* Culture & Arts */}
                    {questGroups.byCategory.culture.length > 0 && (
                      <QuestRow
                        title={CATEGORY_CONFIG.culture.title}
                        icon={CATEGORY_CONFIG.culture.icon}
                        quests={questGroups.byCategory.culture}
                        onQuestClick={handleQuestClick}
                      />
                    )}

                    {/* Wellness & Fitness */}
                    {questGroups.byCategory.wellness.length > 0 && (
                      <QuestRow
                        title={CATEGORY_CONFIG.wellness.title}
                        icon={CATEGORY_CONFIG.wellness.icon}
                        quests={questGroups.byCategory.wellness}
                        onQuestClick={handleQuestClick}
                      />
                    )}

                    {/* Social & Networking */}
                    {questGroups.byCategory.connector.length > 0 && (
                      <QuestRow
                        title={CATEGORY_CONFIG.connector.title}
                        icon={CATEGORY_CONFIG.connector.icon}
                        quests={questGroups.byCategory.connector}
                        onQuestClick={handleQuestClick}
                      />
                    )}

                    {/* Creator Rows */}
                    {questGroups.creatorRows.map((row) => (
                      <QuestRow
                        key={row.creatorId}
                        title={`Quests by ${row.name}`}
                        icon="👤"
                        quests={row.quests}
                        onQuestClick={handleQuestClick}
                        creatorSlug={row.slug || undefined}
                        creatorName={row.name}
                      />
                    ))}
                  </div>

                  {/* BUGGS Helper Hint */}
                  <div className="flex items-center justify-center gap-3 text-muted-foreground pt-8">
                    <img src={buggsFace} alt="" className="w-8 h-8 object-contain" />
                    <p className="text-sm">BUGGS guides every quest. You just show up!</p>
                  </div>
                </section>
              ) : (
                /* Filtered Grid Layout */
                <section className="pb-16 px-4">
                  <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      {filteredQuests.map((quest) => (
                        <QuestCard
                          key={quest.id}
                          quest={quest}
                          onClick={() => handleQuestClick(quest)}
                        />
                      ))}
                    </div>

                    {/* BUGGS Helper Hint */}
                    <div className="mt-12 flex items-center justify-center gap-3 text-muted-foreground">
                      <img src={buggsFace} alt="" className="w-8 h-8 object-contain" />
                      <p className="text-sm">BUGGS guides every quest. You just show up!</p>
                    </div>
                  </div>
                </section>
              )
            ) : quests.length === 0 ? (
              // No quests at all
              <section className="px-4 py-16">
                <div className="text-center">
                  <Inbox className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No quests available yet</h3>
                  <p className="text-muted-foreground mb-4">
                    We're working on creating amazing experiences for you.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Check back soon or join the pilot to be first in line!
                  </p>
                </div>
              </section>
            ) : (
              // No quests match filters
              <section className="px-4 py-12">
                <div className="text-center">
                  <p className="text-muted-foreground mb-2">No quests match your filters.</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Try adjusting your search or clearing some filters.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setFilters({
                      search: '',
                      month: null,
                      days: [],
                      statuses: [],
                      interests: [],
                      creatorId: null,
                      sortBy: 'date',
                      followingOnly: false,
                    })}
                  >
                    Clear All Filters
                  </Button>
                </div>
              </section>
            )}
          </>
        )}

        <CTASection />
      </main>

      <Footer />

      {/* Quest Detail Modal */}
      <QuestModal
        quest={selectedQuest}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
};

export default Quests;
