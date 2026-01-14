import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FAQ } from "@/components/FAQ";
import { CTASection } from "@/components/CTASection";
import { ABOUT } from "@/constants/content";
import { User } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Mission */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
                {ABOUT.mission.title}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {ABOUT.mission.description}
              </p>
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-display text-3xl font-bold text-foreground mb-6 text-center">
                {ABOUT.story.title}
              </h2>
              <p className="text-lg text-muted-foreground text-center leading-relaxed">
                {ABOUT.story.description}
              </p>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-16 md:py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-display text-3xl font-bold text-foreground mb-12 text-center">
                Meet the Team
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {ABOUT.team.map((member) => (
                  <div
                    key={member.name}
                    className="bg-card rounded-xl p-6 border border-border text-center"
                  >
                    {/* Photo placeholder */}
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      {member.photo ? (
                        <img
                          src={member.photo}
                          alt={member.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-10 h-10 text-primary" />
                      )}
                    </div>
                    <h3 className="font-display text-xl font-semibold text-foreground">
                      {member.name}
                    </h3>
                    <p className="text-primary text-sm font-medium mb-3">
                      {member.role}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {member.bio}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center mt-6">
                To add team photos, update the <code className="bg-muted px-1.5 py-0.5 rounded">photo</code> field in <code className="bg-muted px-1.5 py-0.5 rounded">src/constants/content.ts</code>
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-display text-3xl font-bold text-foreground mb-12 text-center">
                Our Values
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {ABOUT.values.map((value) => (
                  <div
                    key={value.title}
                    className="text-center p-6"
                  >
                    <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                      {value.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {value.description}
                    </p>
                  </div>
                ))}
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
