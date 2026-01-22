import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Palette, Users, TrendingUp, Quote } from "lucide-react";
import { CREATORS_PAGE, FORM_URLS } from "@/constants/content";
import { CreatorTypeCard } from "@/components/CreatorTypeCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import rooftopGathering from "@/assets/austin/rooftop-gathering.jpg";
import runningGroup from "@/assets/austin/running-group.jpg";
import foodTruckScene from "@/assets/austin/food-truck-scene.jpg";
import coffeeShopFriends from "@/assets/austin/coffee-shop-friends.jpg";
import concertCrowd from "@/assets/austin/concert-crowd.jpg";
import muralWall from "@/assets/austin/mural-wall.jpg";
import buggsFace from "@/assets/buggs-face.png";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

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

const testimonial = {
  quote: "I ran my first quest and 40 of my podcast listeners showed up. Some of them still meet weekly — without me. That's the whole point.",
  name: "Taylor M.",
  role: "Podcast Host",
};

export default function ContentCreatorsPage() {
  const handleCTAClick = () => {
    window.open(FORM_URLS.creators, "_blank");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 md:py-24 relative overflow-hidden">
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
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-creator/10 rounded-full mb-4">
                <Sparkles className="w-4 h-4 text-creator" />
                <span className="text-sm font-medium text-creator">Content Creators</span>
              </div>
              
              <Link 
                to="/creators" 
                className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Creator Hub
              </Link>
              
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                Turn Followers Into Friends
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Your audience wants more than content. Give them experiences.
              </p>
              
              <Button
                size="lg"
                onClick={handleCTAClick}
                className="bg-creator text-creator-foreground hover:bg-creator/90 text-base px-8 gap-2"
              >
                Apply as a Content Creator
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Value Props */}
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
              <div className="text-center mb-12">
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                  Why Creators Love OpenClique
                </h2>
              </div>
              
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

        {/* Use Cases */}
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

        {/* How It Works */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                  How It Works
                </h2>
              </div>
              
              <div className="relative">
                <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-creator/30 hidden md:block" />
                
                <div className="space-y-8">
                  {CREATORS_PAGE.howItWorks.map((step) => (
                    <div
                      key={step.step}
                      className="flex gap-6 items-start"
                    >
                      <div className="relative z-10 w-12 h-12 rounded-full bg-creator text-creator-foreground flex items-center justify-center font-display font-bold text-lg shrink-0">
                        {step.step}
                      </div>
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

        {/* Testimonial */}
        <section className="py-16 bg-creator/5">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Quote className="w-10 h-10 text-creator/30 mx-auto mb-6" />
              <blockquote className="text-xl md:text-2xl text-foreground font-medium mb-6">
                "{testimonial.quote}"
              </blockquote>
              <div>
                <p className="font-semibold text-foreground">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </div>
            </div>
          </div>
        </section>

        {/* BUGGS Callout */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="bg-card rounded-2xl p-8 border border-border shadow-lg text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-white rounded-full p-2 shadow-sm border border-border/50">
                  <img 
                    src={buggsFace} 
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

        {/* FAQ */}
        <section className="py-16 bg-muted/30">
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

        {/* CTA */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                Ready to Bring Your Community IRL?
              </h2>
              <p className="text-muted-foreground mb-8">
                Join creators who are turning online connections into real-world friendships.
              </p>
              
              <Button
                size="lg"
                onClick={handleCTAClick}
                className="bg-creator text-creator-foreground hover:bg-creator/90 text-base px-10 gap-2"
              >
                Apply as a Content Creator
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
