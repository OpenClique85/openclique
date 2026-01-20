import { useState } from "react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Testimonial {
  id: number;
  name: string;
  profileType: "New to Austin" | "Austinite" | "Visitor" | "Transplant";
  avatar: string;
  rating: number;
  questName: string;
  path: "Culture" | "Wellness" | "Connector";
  shortText: string;
  fullText?: string;
  style: "minimal" | "fun" | "elaborate";
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Maya R.",
    profileType: "New to Austin",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    questName: "First Friday Art Walk",
    path: "Culture",
    shortText: "I moved here knowing nobody. Now I have a group chat that's actually active.",
    fullText: "I moved here knowing absolutely nobody. Three months of eating dinner alone, scrolling through apps that promised 'connection.' Then I tried OpenClique. My first quest was an art walk on South Congress. By the second gallery, we were laughing about our shared terrible taste in wine. Now I have a group chat that's actually active — we've done four more quests together and they came to my birthday.",
    style: "elaborate",
  },
  {
    id: 2,
    name: "Marcus T.",
    profileType: "Austinite",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    questName: "Sunrise Zilker Run",
    path: "Wellness",
    shortText: "Finally found running buddies who match my pace. 5am crew for life. 🏃‍♂️",
    style: "minimal",
  },
  {
    id: 3,
    name: "Jordan K.",
    profileType: "Transplant",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    questName: "Secret Speakeasy Crawl",
    path: "Culture",
    shortText: "Was super nervous showing up alone. BUGGS kept things flowing naturally.",
    fullText: "Honestly? I almost didn't go. Standing outside the first bar, I nearly turned around. But then this girl walked up looking just as nervous and said 'OpenClique?' We laughed, went in together, and BUGGS had sent everyone these fun icebreaker prompts. By bar three we were sharing embarrassing stories. No forced networking energy — just vibes.",
    style: "elaborate",
  },
  {
    id: 4,
    name: "Priya S.",
    profileType: "Austinite",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    questName: "Hidden Taco Trail",
    path: "Culture",
    shortText: "Discovered 3 taco spots I'd never heard of. New foodie friends acquired. 🌮✨",
    style: "fun",
  },
  {
    id: 5,
    name: "David L.",
    profileType: "Visitor",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    rating: 4,
    questName: "Live Music Discovery",
    path: "Culture",
    shortText: "Saw an amazing band with strangers. Way better than going alone.",
    fullText: "I was in Austin for work and had one free night. Normally I'd just stay in the hotel, but I saw OpenClique mentioned somewhere. Joined a live music quest — ended up at this tiny venue seeing a band I'd never heard of with five locals who knew all the best spots. They even invited me to their group's next quest when I'm back in town.",
    style: "elaborate",
  },
  {
    id: 6,
    name: "Sam W.",
    profileType: "New to Austin",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    questName: "Kayak & Coffee",
    path: "Wellness",
    shortText: "Big company, no friends at work. OpenClique made the room feel smaller.",
    fullText: "I work at one of those big tech companies — thousands of employees, but somehow no real connections. Everyone's head down in their laptops. OpenClique matched me with a squad for paddleboarding on Lady Bird Lake. Turns out two of them work in my building! Now we grab lunch weekly. The room finally feels smaller.",
    style: "elaborate",
  },
  {
    id: 7,
    name: "Aisha M.",
    profileType: "Austinite",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    questName: "Yoga & Brunch Flow",
    path: "Wellness",
    shortText: "Different clique for different sides of me. Love having my wellness crew. 🧘‍♀️",
    style: "fun",
  },
  {
    id: 8,
    name: "Chris P.",
    profileType: "Transplant",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcabd31?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    questName: "Mural Hunt Challenge",
    path: "Connector",
    shortText: "The rewards are actually sick. Got exclusive merch from a local artist. 🎨",
    style: "minimal",
  },
  {
    id: 9,
    name: "Elena V.",
    profileType: "New to Austin",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    questName: "Comedy Night Squad",
    path: "Connector",
    shortText: "None of my friends like stand-up. Found my people. We go every month now. 😂",
    style: "fun",
  },
];

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const [expanded, setExpanded] = useState(false);
  const isExpandable = testimonial.style === "elaborate" && testimonial.fullText;
  
  const pathColors = {
    Culture: "bg-sunset/10 text-sunset border-sunset/20",
    Wellness: "bg-primary/10 text-primary border-primary/20",
    Connector: "bg-creator/10 text-creator border-creator/20",
  };

  return (
    <div 
      className={cn(
        "flex-shrink-0 w-[300px] md:w-[340px] bg-card rounded-2xl p-6 border border-border shadow-sm",
        "transition-all duration-300 hover:shadow-md hover:border-primary/20",
        isExpandable && "cursor-pointer"
      )}
      onClick={() => isExpandable && setExpanded(!expanded)}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <img 
          src={testimonial.avatar} 
          alt={testimonial.name}
          className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground truncate">{testimonial.name}</h4>
          <p className="text-sm text-muted-foreground">{testimonial.profileType}</p>
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={cn(
              "w-4 h-4",
              i < testimonial.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"
            )} 
          />
        ))}
      </div>

      {/* Quote */}
      <div className="relative mb-4">
        <Quote className="absolute -top-1 -left-1 w-6 h-6 text-primary/20" />
        <p className={cn(
          "text-foreground pl-5",
          testimonial.style === "minimal" && "text-sm",
          testimonial.style === "fun" && "text-base",
          testimonial.style === "elaborate" && "text-sm leading-relaxed"
        )}>
          {expanded && testimonial.fullText ? testimonial.fullText : testimonial.shortText}
        </p>
        {isExpandable && (
          <button 
            className="text-primary text-xs mt-2 hover:underline pl-5"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? "Show less" : "Read more..."}
          </button>
        )}
      </div>

      {/* Quest & Path Tags */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
          {testimonial.questName}
        </span>
        <span className={cn(
          "text-xs px-2 py-1 rounded-full border",
          pathColors[testimonial.path]
        )}>
          {testimonial.path}
        </span>
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  const [scrollPosition, setScrollPosition] = useState(0);
  
  const scroll = (direction: "left" | "right") => {
    const container = document.getElementById("testimonials-container");
    if (container) {
      const scrollAmount = 360;
      const newPosition = direction === "left" 
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount;
      
      container.scrollTo({ left: newPosition, behavior: "smooth" });
      setScrollPosition(newPosition);
    }
  };

  return (
    <section className="py-16 md:py-24 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Real Stories from Real Squads
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From nervous first-timers to seasoned adventurers — hear how quests turned strangers into friends.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm hidden md:flex"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm hidden md:flex"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          {/* Scrollable Container */}
          <div 
            id="testimonials-container"
            className="flex gap-6 overflow-x-auto pb-4 px-4 md:px-12 scrollbar-hide snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            onScroll={(e) => setScrollPosition((e.target as HTMLDivElement).scrollLeft)}
          >
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="snap-start">
                <TestimonialCard testimonial={testimonial} />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile scroll hint */}
        <p className="text-center text-sm text-muted-foreground mt-4 md:hidden">
          ← Swipe to see more stories →
        </p>
      </div>
    </section>
  );
}