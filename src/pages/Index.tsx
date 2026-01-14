import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { VideoPlaceholder } from "@/components/VideoPlaceholder";
import { BenefitsSection } from "@/components/BenefitsSection";
import { FAQ } from "@/components/FAQ";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <VideoPlaceholder />
        <BenefitsSection />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;