import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CreatorTypeCard } from "@/components/CreatorTypeCard";
import { CREATORS_PAGE, FORM_URLS } from "@/constants/content";
import { 
  ArrowRight, 
  Palette, 
  Users, 
  TrendingUp, 
  Sparkles 
} from "lucide-react";
import rooftopGathering from "@/assets/austin/rooftop-gathering.jpg";
import runningGroup from "@/assets/austin/running-group.jpg";
import foodTruckScene from "@/assets/austin/food-truck-scene.jpg";
import coffeeShopFriends from "@/assets/austin/coffee-shop-friends.jpg";
import muralWall from "@/assets/austin/mural-wall.jpg";
import concertCrowd from "@/assets/austin/concert-crowd.jpg";
import buggsFront from "@/assets/buggs-front.png";
import buggsFace from "@/assets/buggs-face.png";

const valuePropIcons = {
  palette: Palette,
  users: Users,
  "trending-up": TrendingUp,
};

const useCaseImages: Record<string, string> = {
  running: runningGroup,
  "food-truck": foodTruckScene,
  "coffee-shop": coffeeShopFriends,
  concert: concertCrowd,
  rooftop: rooftopGathering,
  mural: muralWall,
};

export default function Creators() {
  const handleCTAClick = () => {
    window.open(FORM_URLS.creators, "_blank");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24 relative overflow-hidden">
          {/* Background image */}
          <div 
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: `url(${rooftopGathering})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-creator/10 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-creator" />
                <span className="text-sm font-medium text-creator">For Influencers & Creators</span>
              </div>
              
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                {CREATORS_PAGE.title}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                {CREATORS_PAGE.subtitle}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  onClick={handleCTAClick}
                  className="bg-creator text-creator-foreground hover:bg-creator/90 text-base px-8 gap-2"
                >
                  {CREATORS_PAGE.ctaText}
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <img 
                  src={buggsFace} 
                  alt="BUGGS" 
                  className="w-10 h-10 object-contain opacity-80"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Value Props Section */}
        <section className="py-16 relative overflow-hidden">
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `url(${muralWall})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-5xl mx-auto">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
                Why Creators Love OpenClique
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {CREATORS_PAGE.valueProps.map((prop) => {
                  const Icon = valuePropIcons[prop.icon as keyof typeof valuePropIcons] || Palette;
                  return (
                    <div
                      key={prop.title}
                      className="bg-card rounded-xl p-6 border border-border text-center hover:border-creator/50 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="w-14 h-14 rounded-xl bg-creator/10 flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-7 h-7 text-creator" />
                      </div>
                      <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                        {prop.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {prop.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-4">
                Built for Every Kind of Creator
              </h2>
              <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
                Whether you're building a fitness empire or teaching a craft, your audience wants to connect.
                <span className="block text-sm mt-1 text-creator">Click any card to learn more.</span>
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {CREATORS_PAGE.useCases.map((useCase) => {
                  const image = useCaseImages[useCase.image as keyof typeof useCaseImages] || runningGroup;
                  return (
                    <CreatorTypeCard
                      key={useCase.title}
                      title={useCase.title}
                      description={useCase.description}
                      icon={useCase.icon}
                      image={image}
                      expandedDescription={(useCase as any).expandedDescription}
                      exampleQuests={(useCase as any).exampleQuests}
                      perfectFor={(useCase as any).perfectFor}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Timeline */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
                How It Works
              </h2>
              
              <div className="relative">
                {/* Connecting line */}
                <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-creator/30 hidden md:block" />
                
                <div className="space-y-8">
                  {CREATORS_PAGE.howItWorks.map((step) => (
                    <div
                      key={step.step}
                      className="flex gap-6 items-start"
                    >
                      {/* Step number */}
                      <div className="relative z-10 w-12 h-12 rounded-full bg-creator text-creator-foreground flex items-center justify-center font-display font-bold text-lg shrink-0">
                        {step.step}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 pt-2">
                        <h3 className="font-display font-semibold text-foreground mb-1">
                          {step.title}
                        </h3>
                        <p className="text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BUGGS Callout */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="bg-card rounded-2xl p-8 border border-border shadow-lg text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-white rounded-2xl p-3 shadow-sm">
                  <img 
                    src={buggsFront} 
                    alt="BUGGS mascot" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                  {CREATORS_PAGE.buggs.title}
                </h3>
                <p className="text-creator font-medium mb-4">
                  {CREATORS_PAGE.buggs.subtitle}
                </p>
                <p className="text-muted-foreground max-w-lg mx-auto">
                  {CREATORS_PAGE.buggs.description}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-8">
                Frequently Asked Questions
              </h2>
              
              <Accordion type="single" collapsible className="w-full">
                {CREATORS_PAGE.faq.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 bg-creator/5">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                Ready to Activate Your Community?
              </h2>
              <p className="text-muted-foreground mb-8">
                Join creators who are turning followers into real-world friends.
              </p>
              
              <Button
                size="lg"
                onClick={handleCTAClick}
                className="bg-creator text-creator-foreground hover:bg-creator/90 text-base px-10 gap-2"
              >
                {CREATORS_PAGE.ctaText}
                <ArrowRight className="w-4 h-4" />
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                {CREATORS_PAGE.note}
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
