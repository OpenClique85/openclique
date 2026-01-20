import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import QuestCard from '@/components/QuestCard';
import QuestModal from '@/components/QuestModal';
import { QUESTS, QUESTS_PAGE, type Quest } from '@/constants/quests';
import buggsFace from '@/assets/buggs-face.png';
import foodTruckScene from '@/assets/austin/food-truck-scene.jpg';

const Quests = () => {
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleQuestClick = (quest: Quest) => {
    setSelectedQuest(quest);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section with food truck background */}
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
              {QUESTS_PAGE.heroTitle}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {QUESTS_PAGE.heroSubtitle}
            </p>
          </div>
        </section>

        {/* Quest Cards Grid */}
        <section className="pb-16 md:pb-24 px-4 relative">
          {/* Subtle background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent pointer-events-none" />
          
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {QUESTS.map((quest) => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  onClick={() => handleQuestClick(quest)}
                />
              ))}
            </div>
            
            {/* BUGGS hint */}
            <div className="mt-12 flex items-center justify-center gap-3 text-muted-foreground">
              <img src={buggsFace} alt="" className="w-8 h-8 object-contain" />
              <p className="text-sm">BUGGS guides every quest — you just show up!</p>
            </div>
          </div>
        </section>
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
