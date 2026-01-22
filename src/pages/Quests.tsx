/**
 * =============================================================================
 * FILE: Quests.tsx
 * PURPOSE: The Quests catalog page - browse and filter all available quests
 * =============================================================================
 * 
 * WHAT THIS FILE CONTROLS:
 * - Quest catalog landing page
 * - Hero section with page title
 * - Quest filtering (by month, day of week, status)
 * - Grid of quest cards
 * - Quest detail modal when a card is clicked
 * - BUGGS helper hint at the bottom
 * 
 * WHERE TO EDIT COPY/TEXT:
 * - Hero title/subtitle: src/constants/quests/page-config.ts → QUESTS_PAGE
 * - Quest data: src/constants/quests/ folder (culture-quests.ts, wellness-quests.ts, etc.)
 * - BUGGS hint text: Line 134 below
 * 
 * HOW FILTERING WORKS:
 * - Month filter: Matches against quest.metadata.date
 * - Day filter: Matches day name (mon, tue, etc.) in quest.metadata.date
 * - Status filter: Matches quest.status (open, closed, coming-soon, etc.)
 * 
 * RELATED FILES:
 * - src/constants/quests/index.ts (QUESTS array, QUESTS_PAGE config)
 * - src/components/QuestCard.tsx (individual quest card)
 * - src/components/QuestModal.tsx (quest detail popup)
 * - src/components/QuestDateFilter.tsx (filter controls)
 * 
 * LAST UPDATED: January 2025
 * =============================================================================
 */

import { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import QuestCard from '@/components/QuestCard';
import QuestModal from '@/components/QuestModal';
import QuestDateFilter from '@/components/QuestDateFilter';
import { CTASection } from '@/components/CTASection';
import { useQuests, type Quest } from '@/hooks/useQuests';
import { Loader2 } from 'lucide-react';

// ============ IMAGES ============
import buggsFace from '@/assets/buggs-face.png';
import foodTruckScene from '@/assets/austin/food-truck-scene.jpg';

/**
 * Quests Page Component
 * 
 * Displays a filterable catalog of all available quests.
 */
const Quests = () => {
  // ============ DATA FETCHING ============
  const { data: quests = [], isLoading } = useQuests();
  
  // ============ STATE MANAGEMENT ============
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Active filter state
  const [filters, setFilters] = useState<{
    month: string | null;
    days: number[];
    statuses: ('open' | 'closed' | 'coming-soon' | 'completed')[];
  }>({
    month: null,
    days: [],
    statuses: [],
  });

  /**
   * Opens the quest detail modal
   * @param quest - The quest to display in the modal
   */
  const handleQuestClick = (quest: Quest) => {
    setSelectedQuest(quest);
    setModalOpen(true);
  };

  /**
   * FILTERED QUESTS
   * 
   * Filters the QUESTS array based on active filters.
   * Uses useMemo for performance (only recalculates when filters change).
   */
  const filteredQuests = useMemo(() => {
    return quests.filter((quest) => {
      if (filters.statuses.length > 0 && !filters.statuses.includes(quest.status)) {
        return false;
      }

      if (filters.month) {
        const questDateLower = quest.metadata.date.toLowerCase();
        if (!questDateLower.includes(filters.month)) {
          return false;
        }
      }

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* ============ HERO SECTION ============ */}
        {/* Text from: src/constants/quests/page-config.ts → QUESTS_PAGE */}
        <section className="py-16 md:py-24 px-4 relative overflow-hidden">
          {/* Background image */}
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

        {/* ============ QUEST CARDS GRID ============ */}
        <section className="pb-16 md:pb-24 px-4 relative">
          {/* Subtle background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent pointer-events-none" />
          
          <div className="max-w-4xl mx-auto relative z-10">
            {/* --- Filter Controls --- */}
            {/* Filter component: src/components/QuestDateFilter.tsx */}
            <QuestDateFilter 
              activeFilters={filters}
              onFilterChange={setFilters}
            />

            {/* --- Results Count --- */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {(filters.month || filters.days.length > 0 || filters.statuses.length > 0) && (
                  <p className="text-sm text-muted-foreground mb-4">
                    Showing {filteredQuests.length} of {quests.length} quests
                  </p>
                )}

            {/* --- Quest Cards Grid --- */}
            {/* Quest cards: src/components/QuestCard.tsx */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {filteredQuests.map((quest) => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  onClick={() => handleQuestClick(quest)}
                />
              ))}
            </div>

            {/* --- No Results Message --- */}
            {filteredQuests.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-2">No quests match your filters.</p>
                <p className="text-sm text-muted-foreground">Try adjusting your availability or clearing filters.</p>
              </div>
            )}
            
            {/* --- BUGGS Helper Hint --- */}
            <div className="mt-12 flex items-center justify-center gap-3 text-muted-foreground">
              <img src={buggsFace} alt="" className="w-8 h-8 object-contain" />
              <p className="text-sm">BUGGS guides every quest. You just show up!</p>
            </div>
              </>
            )}
          </div>
        </section>

        {/* ============ CTA SECTION ============ */}
        <CTASection />
      </main>

      <Footer />

      {/* ============ QUEST DETAIL MODAL ============ */}
      {/* Opens when a quest card is clicked */}
      {/* Modal component: src/components/QuestModal.tsx */}
      <QuestModal
        quest={selectedQuest}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
};

export default Quests;
