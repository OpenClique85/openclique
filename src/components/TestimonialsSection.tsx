import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Testimonial {
  id: string;
  name: string;
  profileType: string;
  avatar: string;
  rating: number;
  questName: string;
  questIcon: string;
  shortText: string;
  fullText?: string;
  hasFullText: boolean;
}

// Static fallback testimonials for when no approved ones exist
const fallbackTestimonials: Testimonial[] = [
  {
    id: "fallback-1",
    name: "Maya R.",
    profileType: "New to Austin",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    questName: "First Friday Art Walk",
    questIcon: "🎨",
    shortText: "I moved here knowing nobody. Now I have a group chat that's actually active.",
    fullText: "I moved here knowing absolutely nobody. Three months of eating dinner alone, scrolling through apps that promised 'connection.' Then I tried OpenClique. My first quest was an art walk on South Congress. By the second gallery, we were laughing about our shared terrible taste in wine. Now I have a group chat that's actually active — we've done four more quests together and they came to my birthday.",
    hasFullText: true,
  },
  {
    id: "fallback-2",
    name: "Marcus T.",
    profileType: "Austinite",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    questName: "Sunrise Zilker Run",
    questIcon: "🏃",
    shortText: "Finally found running buddies who match my pace. 5am crew for life. 🏃‍♂️",
    hasFullText: false,
  },
  {
    id: "fallback-3",
    name: "Jordan K.",
    profileType: "Transplant",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    questName: "Secret Speakeasy Crawl",
    questIcon: "🍸",
    shortText: "Was super nervous showing up alone. BUGGS kept things flowing naturally.",
    fullText: "Honestly? I almost didn't go. Standing outside the first bar, I nearly turned around. But then this girl walked up looking just as nervous and said 'OpenClique?' We laughed, went in together, and BUGGS had sent everyone these fun icebreaker prompts. By bar three we were sharing embarrassing stories. No forced networking energy — just vibes.",
    hasFullText: true,
  },
  {
    id: "fallback-4",
    name: "Priya S.",
    profileType: "Austinite",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    questName: "Hidden Taco Trail",
    questIcon: "🌮",
    shortText: "Discovered 3 taco spots I'd never heard of. New foodie friends acquired. 🌮✨",
    hasFullText: false,
  },
  {
    id: "fallback-5",
    name: "David L.",
    profileType: "Visitor",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    rating: 4,
    questName: "Live Music Discovery",
    questIcon: "🎵",
    shortText: "Saw an amazing band with strangers. Way better than going alone.",
    hasFullText: false,
  },
];

function useApprovedTestimonials() {
  return useQuery({
    queryKey: ['approved-testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback')
        .select(`
          id,
          testimonial_text,
          recommendation_text,
          consent_type,
          rating_1_5,
          submitted_at,
          profile:profiles!feedback_user_id_fkey(display_name, city),
          quest:quests!feedback_quest_id_fkey(title, icon)
        `)
        .eq('is_testimonial_approved', true)
        .or('testimonial_text.neq.null,recommendation_text.neq.null')
        .order('submitted_at', { ascending: false })
        .limit(12);

      if (error) {
        console.error('Error fetching testimonials:', error);
        return [];
      }

      // Transform database records to testimonial format
      return (data || []).map((item: any): Testimonial => {
        const displayName = item.consent_type === 'first_name_city' 
          ? `${item.profile?.display_name?.split(' ')[0] || 'Quester'} ${item.profile?.display_name?.split(' ')[1]?.[0] || ''}.`.trim()
          : 'Anonymous Quester';
        
        const city = item.profile?.city || 'Austin';
        const profileType = `${city} Quester`;
        
        // Use first letter of name as avatar placeholder
        const avatarLetter = displayName[0] || 'Q';
        
        const text = item.testimonial_text || item.recommendation_text || '';
        const isLong = text.length > 150;
        
        return {
          id: item.id,
          name: displayName,
          profileType,
          avatar: '', // Will use letter avatar
          rating: item.rating_1_5 || 5,
          questName: item.quest?.title || 'OpenClique Quest',
          questIcon: item.quest?.icon || '🎯',
          shortText: isLong ? text.slice(0, 150) + '...' : text,
          fullText: isLong ? text : undefined,
          hasFullText: isLong,
        };
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const [expanded, setExpanded] = useState(false);
  const isExpandable = testimonial.hasFullText && testimonial.fullText;

  return (
    <div 
      className={cn(
        "flex-shrink-0 w-[300px] md:w-[340px] h-[280px] bg-card rounded-2xl p-6 border border-border shadow-sm",
        "transition-all duration-300 hover:shadow-md hover:border-primary/20",
        "flex flex-col",
        isExpandable && "cursor-pointer"
      )}
      onClick={() => isExpandable && setExpanded(!expanded)}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        {testimonial.avatar ? (
          <img 
            src={testimonial.avatar} 
            alt={testimonial.name}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold ring-2 ring-primary/20">
            {testimonial.name[0]}
          </div>
        )}
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
      <div className="relative mb-4 flex-grow">
        <Quote className="absolute -top-1 -left-1 w-6 h-6 text-primary/20" />
        <p className="text-foreground pl-5 text-sm leading-relaxed">
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

      {/* Quest Tag */}
      <div className="flex flex-wrap gap-2 mt-auto">
        <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
          {testimonial.questIcon} {testimonial.questName}
        </span>
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  const [scrollPosition, setScrollPosition] = useState(0);
  const { data: dbTestimonials, isLoading } = useApprovedTestimonials();
  
  // Use database testimonials if available, otherwise fall back to static
  const testimonials = (dbTestimonials && dbTestimonials.length > 0) 
    ? dbTestimonials 
    : fallbackTestimonials;
  
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
