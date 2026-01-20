import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { BenefitsSection } from "@/components/BenefitsSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import BuggsFloating from "@/components/BuggsFloating";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <BenefitsSection />
        <TestimonialsSection />
        <FAQ />
      </main>
      <Footer />
      <BuggsFloating message="Ready to find your squad?" />
    </div>
  );
};

export default Index;