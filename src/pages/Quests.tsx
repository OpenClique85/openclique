import { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import QuestCard from '@/components/QuestCard';
import QuestModal from '@/components/QuestModal';
import QuestFilterBar, { type QuestFilters } from '@/components/QuestFilterBar';
import { CTASection } from '@/components/CTASection';
import { useQuests, type Quest } from '@/hooks/useQuests';
import { Loader2, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

import buggsFace from '@/assets/buggs-face.png';
import foodTruckScene from '@/assets/austin/food-truck-scene.jpg';

const Quests = () => {
  const { data: quests = [], isLoading, error } = useQuests();
  
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const [filters, setFilters] = useState<QuestFilters>({
    search: '',
    month: null,
    days: [],
    statuses: [],
    interests: [],
  });

  const handleQuestClick = (quest: Quest) => {
    setSelectedQuest(quest);
    setModalOpen(true);
  };

  const filteredQuests = useMemo(() => {
    return quests.filter((quest) => {
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
  }, [quests, filters]);

  const hasActiveFilters = 
    filters.search.length > 0 ||
    filters.month !== null || 
    filters.days.length > 0 || 
    filters.statuses.length > 0 ||
    filters.interests.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24 px-4 relative overflow-hidden">
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
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Discover Your Next Quest
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
              Browse curated experiences designed to help you meet new people and explore Austin.
            </p>
            <p className="text-sm text-muted-foreground/80 max-w-xl mx-auto">
              Each quest is a shared adventure with a small group. No awkward networking—just real connections.
            </p>
          </div>
        </section>

        {/* Quest Cards Grid */}
        <section className="pb-16 md:pb-24 px-4 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent pointer-events-none" />
          
          <div className="max-w-4xl mx-auto relative z-10">
            {/* Filter Controls */}
            <QuestFilterBar 
              filters={filters}
              onFilterChange={setFilters}
            />

            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading quests...</p>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-destructive mb-2">Failed to load quests</p>
                <p className="text-muted-foreground text-sm mb-4">Please try refreshing the page.</p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
              </div>
            )}

            {/* Content */}
            {!isLoading && !error && (
              <>
                {/* Results Count */}
                {hasActiveFilters && (
                  <p className="text-sm text-muted-foreground mb-4">
                    Showing {filteredQuests.length} of {quests.length} quests
                  </p>
                )}

                {/* Quest Cards Grid */}
                {filteredQuests.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {filteredQuests.map((quest) => (
                      <QuestCard
                        key={quest.id}
                        quest={quest}
                        onClick={() => handleQuestClick(quest)}
                      />
                    ))}
                  </div>
                ) : quests.length === 0 ? (
                  // No quests at all
                  <div className="text-center py-16">
                    <Inbox className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No quests available yet</h3>
                    <p className="text-muted-foreground mb-4">
                      We're working on creating amazing experiences for you.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Check back soon or join the pilot to be first in line!
                    </p>
                  </div>
                ) : (
                  // No quests match filters
                  <div className="text-center py-12">
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
                      })}
                    >
                      Clear All Filters
                    </Button>
                  </div>
                )}
                
                {/* BUGGS Helper Hint */}
                {filteredQuests.length > 0 && (
                  <div className="mt-12 flex items-center justify-center gap-3 text-muted-foreground">
                    <img src={buggsFace} alt="" className="w-8 h-8 object-contain" />
                    <p className="text-sm">BUGGS guides every quest. You just show up!</p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

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
