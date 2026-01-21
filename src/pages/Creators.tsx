import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  CreatorHero,
  InfluencerSection,
  QuestCreatorSection,
  CreatorHowItWorks,
  CreatorBuggsCallout,
  CreatorFAQ,
  CreatorCTA,
} from "@/components/creators";

export default function Creators() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <CreatorHero />
        <InfluencerSection />
        <CreatorHowItWorks />
        <QuestCreatorSection />
        <CreatorBuggsCallout />
        <CreatorFAQ />
        <CreatorCTA />
      </main>
      <Footer />
    </div>
  );
}
