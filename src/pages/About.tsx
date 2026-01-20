import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FAQ } from "@/components/FAQ";
import { CTASection } from "@/components/CTASection";
import { ABOUT } from "@/constants/content";
import { Shield, Heart, Target } from "lucide-react";
import anthonyCami from "@/assets/team/anthony-cami.jpeg";
import andrewPoss from "@/assets/team/andrew-poss.jpeg";
import tvlSemifinalists from "@/assets/traction/tvl-semifinalists.jpeg";
import aclWinners from "@/assets/traction/acl-winners.jpeg";
import kendraScottAccelerator from "@/assets/traction/kendra-scott-accelerator.jpeg";
import buggsMascot from "@/assets/buggs-mascot.png";

const teamPhotos: Record<string, string> = {
  anthony: anthonyCami,
  andrew: andrewPoss,
};

const tractionPhotos: Record<string, string> = {
  "tvl-semifinalists": tvlSemifinalists,
  "acl-winners": aclWinners,
  "kendra-scott-accelerator": kendraScottAccelerator,
};

const valueIcons: Record<string, React.ElementType> = {
  shield: Shield,
  heart: Heart,
  target: Target,
};

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Mission + Story + Team (combined for flow) */}
        <section className="py-12 md:py-16 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                {ABOUT.mission.title}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                {ABOUT.mission.description}
              </p>
              <div className="bg-card/60 backdrop-blur-sm rounded-xl p-6 border border-border/50 text-left">
                <h2 className="font-display text-xl font-semibold text-foreground mb-3">
                  {ABOUT.story.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {ABOUT.story.description}
                </p>
              </div>
            </div>

            {/* Team - immediately after story */}
            <div className="max-w-2xl mx-auto">
              <h2 className="font-display text-2xl font-bold text-foreground mb-8 text-center">
                Meet the Team
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {ABOUT.team.map((member) => (
                  <div
                    key={member.name}
                    className="bg-card rounded-xl p-6 border border-border text-center hover:shadow-lg transition-shadow"
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
                
                {/* BUGGS as team member */}
                <div className="bg-card rounded-xl p-6 border border-border text-center hover:shadow-lg transition-shadow">
                  <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-4 border-primary/20 bg-primary/5 flex items-center justify-center">
                    <img
                      src={buggsMascot}
                      alt="BUGGS the rabbit mascot"
                      className="w-20 h-20 object-contain"
                    />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    BUGGS
                  </h3>
                  <p className="text-primary text-sm font-medium mb-2">
                    Chief Vibes Officer
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Your AI squad guide. Keeps the conversation flowing and the logistics sorted.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Traction */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="font-display text-3xl font-bold text-foreground mb-4 text-center">
                Building Momentum
              </h2>
              <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
                Our journey from idea to impact, validated by Austin's entrepreneurial community.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {ABOUT.traction.map((item) => (
                  <div
                    key={item.image}
                    className="bg-card rounded-xl overflow-hidden border border-border hover:shadow-lg transition-all hover:-translate-y-1"
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

        {/* Values */}
        <section className="py-12 md:py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-display text-3xl font-bold text-foreground mb-12 text-center">
                Our Values
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

        <FAQ />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
