/**
 * =============================================================================
 * FILE: About.tsx
 * PURPOSE: The About page - tells the OpenClique story, team, traction, and values
 * =============================================================================
 * 
 * WHAT THIS FILE CONTROLS:
 * - Mission statement and company story
 * - Team member profiles with photos
 * - Traction/achievements section with images
 * - Core values section with icons
 * - FAQ and CTA sections at the bottom
 * 
 * WHERE TO EDIT COPY/TEXT:
 * - Mission, story, team, traction, values: src/constants/content.ts → ABOUT
 * - Section headlines are hardcoded below (search for text in quotes)
 * - BUGGS team card text: Lines 96-104 below
 * 
 * WHERE TO EDIT IMAGES:
 * - Team photos: src/assets/team/ folder, then update imports at top
 * - Traction images: src/assets/traction/ folder, then update imports
 * - Background image: src/assets/austin/zilker-park.jpg
 * 
 * IMAGE MAPPINGS:
 * - teamPhotos: Maps member.photo field to actual image files
 * - tractionPhotos: Maps item.image field to actual image files
 * 
 * RELATED FILES:
 * - src/constants/content.ts (ABOUT section for all text)
 * - src/components/FAQ.tsx (FAQ section)
 * - src/components/CTASection.tsx (final CTA)
 * 
 * LAST UPDATED: January 2025
 * =============================================================================
 */

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CTASection } from "@/components/CTASection";
import { UGCShowcase } from "@/components/UGCShowcase";
import { ABOUT } from "@/constants/content";
import { Shield, Heart, Target } from "lucide-react";

// ============ TEAM PHOTOS ============
// Import team member photos here and add to the mapping below
import anthonyCami from "@/assets/team/anthony-cami.jpeg";
import andrewPoss from "@/assets/team/andrew-poss.jpeg";
import buggsReal from "@/assets/team/buggs-real.jpeg";

// ============ TRACTION PHOTOS ============
// Import achievement/traction photos here and add to the mapping below
import tvlSemifinalists from "@/assets/traction/tvl-semifinalists.jpeg";
import aclWinners from "@/assets/traction/acl-winners.jpeg";
import kendraScottAccelerator from "@/assets/traction/kendra-scott-accelerator.jpeg";

// ============ BACKGROUND IMAGE ============
import zilkerPark from "@/assets/austin/zilker-park.jpg";

/**
 * TEAM PHOTOS MAPPING
 * 
 * Maps the "photo" field from ABOUT.team in content.ts to actual image files.
 * To add a new team member:
 * 1. Add their photo to src/assets/team/
 * 2. Import it above (e.g., import newPerson from "@/assets/team/new-person.jpeg")
 * 3. Add the mapping here (e.g., newperson: newPerson)
 * 4. Add their info in src/constants/content.ts → ABOUT.team
 */
const teamPhotos: Record<string, string> = {
  anthony: anthonyCami,    // Anthony's photo
  andrew: andrewPoss,      // Andrew's photo
};

/**
 * TRACTION PHOTOS MAPPING
 * 
 * Maps the "image" field from ABOUT.traction in content.ts to actual image files.
 * Same process as team photos to add new achievements.
 */
const tractionPhotos: Record<string, string> = {
  "tvl-semifinalists": tvlSemifinalists,          // Texas Venture Labs achievement
  "acl-winners": aclWinners,                       // ACL competition win
  "kendra-scott-accelerator": kendraScottAccelerator, // Accelerator program
};

/**
 * VALUE ICONS MAPPING
 * 
 * Maps the "icon" field from ABOUT.values to Lucide icon components.
 * To add a new icon:
 * 1. Import it from lucide-react at the top
 * 2. Add the mapping here (e.g., newicon: NewIcon)
 */
const valueIcons: Record<string, React.ElementType> = {
  shield: Shield,   // Represents trust/safety
  heart: Heart,     // Represents care/community
  target: Target,   // Represents purpose/goals
};

/**
 * About Page Component
 * 
 * Renders the full About page with mission, story, team, traction, and values.
 */
export default function About() {
  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar />
      <main className="flex-1">
        
        {/* ============ SECTION 1: Mission + Story + Team ============ */}
        {/* Combined section with gradient background for visual flow */}
        <section className="py-12 md:py-16 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="container mx-auto px-4">
            
            {/* --- Mission Statement --- */}
            {/* Text from: src/constants/content.ts → ABOUT.mission */}
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                {ABOUT.mission.title}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                {ABOUT.mission.description}
              </p>
              
              {/* --- Our Story Card --- */}
              {/* Text from: src/constants/content.ts → ABOUT.story */}
              <div className="bg-card/60 backdrop-blur-sm rounded-xl p-6 border border-border/50 text-left">
                <h2 className="font-display text-xl font-semibold text-foreground mb-3">
                  {ABOUT.story.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {ABOUT.story.description}
                </p>
              </div>
            </div>

            {/* --- Team Grid --- */}
            {/* Team data from: src/constants/content.ts → ABOUT.team */}
            <div className="max-w-2xl mx-auto">
              <h2 className="font-display text-2xl font-bold text-foreground mb-8 text-center">
                Meet the Team
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Dynamic team member cards from content.ts */}
                {ABOUT.team.map((member) => (
                  <div
                    key={member.name}
                    className="bg-card rounded-xl p-6 border border-border text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-4 border-primary/20">
                      <img
                        src={teamPhotos[member.photo]}
                        alt={member.name}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      {member.name}
                    </h3>
                    <p className="text-primary text-sm font-medium mb-2">
                      {member.role}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {member.bio}
                    </p>
                  </div>
                ))}
                
                {/* --- BUGGS Team Card (Hardcoded) --- */}
                {/* BUGGS is our AI mascot, always shown as a team member */}
                {/* To edit BUGGS info, change the text below directly */}
                <div className="bg-card rounded-xl p-6 border border-border text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-4 border-primary/20 hover:border-primary/40 transition-colors">
                    <img
                      src={buggsReal}
                      alt="BUGGS the rabbit"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    BUGGS
                  </h3>
                  <p className="text-primary text-sm font-medium mb-2">
                    Chief Vibes Officer {/* ← EDIT BUGGS ROLE HERE */}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Your AI squad guide. Keeps the conversation flowing and the logistics sorted. {/* ← EDIT BUGGS BIO HERE */}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ SECTION 2: Traction/Achievements ============ */}
        {/* Shows company milestones with Zilker Park background */}
        {/* Traction data from: src/constants/content.ts → ABOUT.traction */}
        <section className="py-12 md:py-16 relative overflow-hidden">
          {/* Background image with overlay */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url(${zilkerPark})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-5xl mx-auto">
              <h2 className="font-display text-3xl font-bold text-foreground mb-4 text-center">
                Building Momentum {/* ← EDIT SECTION HEADLINE HERE */}
              </h2>
              <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
                Our journey from idea to impact, validated by Austin's entrepreneurial community. {/* ← EDIT SECTION SUBHEADLINE HERE */}
              </p>
              
              {/* Traction cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {ABOUT.traction.map((item) => (
                  <div
                    key={item.image}
                    className="bg-card rounded-xl overflow-hidden border border-border hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
                  >
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={tractionPhotos[item.image]}
                        alt={item.title}
                        className={`w-full h-full object-cover ${item.image === 'acl-winners' ? 'object-[center_70%]' : 'object-top'}`}
                      />
                    </div>
                    <div className="p-5">
                      <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ============ SECTION 3: Values ============ */}
        {/* Company core values with icons */}
        {/* Values data from: src/constants/content.ts → ABOUT.values */}
        <section className="py-12 md:py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-display text-3xl font-bold text-foreground mb-12 text-center">
                Our Values {/* ← EDIT SECTION HEADLINE HERE */}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {ABOUT.values.map((value) => {
                  const IconComponent = valueIcons[value.icon];
                  return (
                    <div
                      key={value.title}
                      className="text-center p-6 bg-card rounded-xl border border-border"
                    >
                      {IconComponent && (
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                          <IconComponent className="w-7 h-7 text-primary" />
                        </div>
                      )}
                      <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                        {value.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {value.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ============ SECTION 4: Community UGC ============ */}
        {/* Approved user photos/videos from quests */}
        <UGCShowcase limit={6} />

        {/* ============ SECTION 5: CTA ============ */}
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
