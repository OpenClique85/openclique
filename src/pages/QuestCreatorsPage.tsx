import { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Star, Briefcase, Tag, Sparkles, Users, Calendar, Clock, Quote, ChevronDown, ChevronUp, ChevronLeft, Check } from "lucide-react";
import { FORM_URLS } from "@/constants/content";
import buggsFace from "@/assets/buggs-face.png";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import sunsetGathering from "@/assets/austin/sunset-gathering.jpg";
import foodTruckScene from "@/assets/austin/food-truck-scene.jpg";
import kayakLake from "@/assets/austin/kayak-lake.jpg";
import muralWall from "@/assets/austin/mural-wall.jpg";

const perfectForItems = [
  { icon: Calendar, text: "Event planners looking for flexible side income" },
  { icon: MapPin, text: "Local experts who know the hidden gems" },
  { icon: Users, text: "Community organizers wanting to scale impact" },
  { icon: Star, text: "Anyone who loves bringing people together" },
];

const pathSteps = [
  {
    step: 1,
    title: "Lead Your First Quest",
    description: "Start small. Host a coffee crawl, park cleanup, or sunset photo walk.",
  },
  {
    step: 2,
    title: "Build Your Reputation",
    description: "Collect reviews from squad members. Great hosts build great reputations.",
  },
  {
    step: 3,
    title: "Get Discovered",
    description: "Top creators unlock opportunities from brands and sponsors.",
  },
];

const exampleQuests = [
  {
    id: "taco-trail",
    title: "Secret Taco Trail",
    image: foodTruckScene,
    details: {
      duration: "2 hours",
      stops: "4 stops",
      capacity: "8 people",
      rating: 4.9,
      completions: 12,
    },
  },
  {
    id: "paddle-club",
    title: "Sunrise Paddle Club",
    image: kayakLake,
    details: {
      duration: "Monthly recurring",
      path: "Wellness path",
      capacity: "6 people",
      rating: 4.8,
      completions: 8,
    },
  },
  {
    id: "art-walk",
    title: "First Friday Art Walk",
    image: muralWall,
    details: {
      duration: "2.5 hours",
      stops: "5 galleries",
      capacity: "10 people",
      rating: 5.0,
      completions: 5,
    },
  },
];

const testimonials = [
  {
    quote: "I hosted my first coffee crawl expecting 4 people. 12 showed up. Now I run one every week.",
    name: "Alex R.",
    role: "Coffee & Culture Creator",
  },
  {
    quote: "Made $400 last month leading 4 quests. More importantly, I've met amazing people who share my passions.",
    name: "Jamie T.",
    role: "Outdoor Adventure Host",
  },
  {
    quote: "Went from 'local who knows good spots' to getting hired by a hotel to create guest experiences.",
    name: "Morgan S.",
    role: "Hospitality Quest Creator",
  },
];

const benefits = [
  {
    title: "Reviews & Ratings",
    description: "Squad members rate their experience. Build social proof.",
    icon: Star,
  },
  {
    title: "Quest Portfolio",
    description: "Showcase completed experiences. Your track record is your resume.",
    icon: Briefcase,
  },
  {
    title: "Audience Tags",
    description: "Get tagged for your niche: fitness, nightlife, food, art, wellness.",
    icon: Tag,
  },
  {
    title: "Brand Opportunities",
    description: "Top performers get discovered by sponsors for paid activations.",
    icon: Sparkles,
  },
];

const faq = [
  {
    question: "Do I need experience?",
    answer: "No! Just passion and local knowledge. We provide templates and guidance to help you design your first quest.",
  },
  {
    question: "How do I get paid?",
    answer: "Through the platform after each completed quest. Start free to build your reputation, then set your own rates as you grow.",
  },
  {
    question: "What if my quest doesn't fill up?",
    answer: "We help you promote and adjust. Most new creators start with smaller groups and grow from there.",
  },
  {
    question: "Can I host quests in other cities?",
    answer: "We're launching in Austin first, with more cities coming soon. Sign up to be notified when we expand.",
  },
];

function QuestExampleCard({ quest }: { quest: typeof exampleQuests[0] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className="bg-card rounded-xl border border-border overflow-hidden cursor-pointer hover:border-sunset/50 transition-all duration-300"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="relative h-40">
        <img 
          src={quest.image} 
          alt={quest.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <h4 className="font-display font-semibold text-white text-lg">
            {quest.title}
          </h4>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-sunset fill-sunset" />
            <span className="text-sm font-medium text-foreground">{quest.details.rating}</span>
            <span className="text-sm text-muted-foreground">({quest.details.completions} completions)</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-border space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{quest.details.duration}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{quest.details.stops || quest.details.path}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{quest.details.capacity}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function QuestCreatorsPage() {
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
              backgroundImage: `url(${sunsetGathering})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-sunset/10 rounded-full mb-4">
                <MapPin className="w-4 h-4 text-sunset" />
                <span className="text-sm font-medium text-sunset">Quest Creators</span>
              </div>
              
              <Link 
                to="/creators" 
                className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Creator Hub
              </Link>
              
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                Turn Your Local Knowledge Into a Side Hustle
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Design experiences. Lead squads. Build your reputation.
              </p>
              
              <Button
                size="lg"
                onClick={handleCTAClick}
                className="bg-sunset text-sunset-foreground hover:bg-sunset/90 text-base px-8 gap-2"
              >
                Apply as a Quest Creator
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Perfect For */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
                Perfect for...
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {perfectForItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div 
                      key={index}
                      className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border"
                    >
                      <div className="w-10 h-10 rounded-lg bg-sunset/10 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-sunset" />
                      </div>
                      <p className="text-foreground">{item.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Path Steps */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
                Your Path to Getting Discovered
              </h2>
              
              <div className="relative">
                <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-sunset via-sunset/50 to-sunset/20 hidden md:block" />
                
                <div className="space-y-6">
                  {pathSteps.map((step) => (
                    <div
                      key={step.step}
                      className="flex gap-6 items-start"
                    >
                      <div className="relative z-10 w-12 h-12 rounded-full bg-sunset text-sunset-foreground flex items-center justify-center font-display font-bold text-lg shrink-0 shadow-lg">
                        {step.step}
                      </div>
                      <div className="flex-1 pt-2 bg-card rounded-lg p-4 border border-border">
                        <h4 className="font-display font-semibold text-foreground mb-1">
                          {step.title}
                        </h4>
                        <p className="text-muted-foreground text-sm">
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

        {/* Example Quests */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-4">
                Example Quests
              </h2>
              <p className="text-muted-foreground text-center mb-10">
                <span className="text-sunset">Click any card</span> to see the details
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {exampleQuests.map((quest) => (
                  <QuestExampleCard key={quest.id} quest={quest} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 bg-sunset/5">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
                From Quest Creators
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {testimonials.map((testimonial, index) => (
                  <div 
                    key={index}
                    className="bg-card rounded-xl p-6 border border-border"
                  >
                    <Quote className="w-8 h-8 text-sunset/30 mb-4" />
                    <p className="text-foreground mb-6 italic">
                      "{testimonial.quote}"
                    </p>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
                Build Your Creator Profile
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit) => {
                  const Icon = benefit.icon;
                  return (
                    <div
                      key={benefit.title}
                      className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border hover:border-sunset/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-sunset/10 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-sunset" />
                      </div>
                      <div>
                        <h4 className="font-display font-semibold text-foreground mb-1">
                          {benefit.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* BUGGS Callout */}
        <section className="py-16 bg-muted/30">
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
                  Meet BUGGS, Your AI Guide
                </h3>
                <p className="text-sunset font-medium mb-4">
                  Behavioral Utility for Group Guidance & Structure
                </p>
                <p className="text-muted-foreground max-w-lg mx-auto mb-6">
                  BUGGS helps you design better quests, suggests optimal timing, and connects you with the right audience.
                </p>
                <ul className="space-y-3 inline-block text-left">
                  {[
                    "Quest templates to get started fast",
                    "Audience matching for your niche",
                    "Smart scheduling suggestions"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-sunset/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-sunset" />
                      </div>
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
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
                {faq.map((item, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger className="text-left">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {item.answer}
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
                Ready to Lead Your First Quest?
              </h2>
              <p className="text-muted-foreground mb-8">
                Join local experts who are turning their knowledge into memorable experiences.
              </p>
              
              <Button
                size="lg"
                onClick={handleCTAClick}
                className="bg-sunset text-sunset-foreground hover:bg-sunset/90 text-base px-10 gap-2"
              >
                Apply as a Quest Creator
                <ArrowRight className="w-4 h-4" />
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Apply in 2 minutes. We'll reach out within 48 hours.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
