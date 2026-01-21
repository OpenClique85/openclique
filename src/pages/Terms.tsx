import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BRAND } from "@/constants/content";

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto prose prose-slate">
              <h1 className="font-display text-4xl font-bold text-foreground mb-8">
                Terms of Service
              </h1>
              
              <p className="text-muted-foreground text-lg mb-8">
                Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>

              <div className="space-y-8 text-muted-foreground">
                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Welcome to {BRAND.name}
                  </h2>
                  <p>
                    These terms of service ("Terms") govern your use of the {BRAND.name} website and any 
                    related services (collectively, the "Service"). By accessing or using the Service, you 
                    agree to be bound by these Terms.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Pilot Program
                  </h2>
                  <p>
                    {BRAND.name} is currently in a pilot phase. By signing up for the pilot, you acknowledge that:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>The Service is in development and may change significantly</li>
                    <li>Features may be added, modified, or removed without notice</li>
                    <li>We may limit access to maintain quality during the pilot</li>
                    <li>Your feedback helps shape the future of {BRAND.name}</li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    User Conduct
                  </h2>
                  <p>When using {BRAND.name}, you agree to:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>Treat other participants with respect and kindness</li>
                    <li>Provide accurate information in your profile</li>
                    <li>Show up to quests you've committed to, or notify your squad in advance</li>
                    <li>Not engage in any illegal, harmful, or discriminatory behavior</li>
                    <li>Report any concerns about safety or misconduct</li>
                  </ul>
                </section>

                <section id="community-guidelines">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Community Guidelines
                  </h2>
                  <p className="mb-4">
                    {BRAND.name} exists to help people make meaningful connections. To keep our community welcoming and safe, we expect all participants to follow these guidelines:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>
                      <strong>Be respectful:</strong> Treat every participant with kindness, regardless of background, identity, or beliefs
                    </li>
                    <li>
                      <strong>Be reliable:</strong> If you commit to a quest, show up. If you can't make it, let your squad know in advance
                    </li>
                    <li>
                      <strong>Be appropriate:</strong> No harassment, discrimination, hate speech, or unwanted advances of any kind
                    </li>
                    <li>
                      <strong>Be honest:</strong> Use your real name and accurate information. No catfishing or misrepresentation
                    </li>
                    <li>
                      <strong>Be safe:</strong> Don't promote illegal activities, controlled substances, or put others at risk
                    </li>
                  </ul>
                  <p className="mt-4">
                    <strong>Violations:</strong> We reserve the right to remove anyone from the pilot or platform without notice if they violate these guidelines or create an unsafe environment for others.
                  </p>
                  <p className="mt-4">
                    <strong>Reporting:</strong> If you experience or witness concerning behavior, please email us immediately at{' '}
                    <a href="mailto:hello@openclique.com" className="text-primary hover:underline">
                      hello@openclique.com
                    </a>. We review every report and take them seriously.
                  </p>
                </section>

                <section id="safety">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Safety & Trust
                  </h2>
                  <p className="mb-4">
                    Safety is our top priority. While we design quests with safety in mind, {BRAND.name} facilitates 
                    real-world meetups, and you are responsible for your own safety.
                  </p>
                  <h3 className="font-display text-lg font-semibold text-foreground mt-6 mb-3">
                    What We Do
                  </h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>All participants go through a verification process</li>
                    <li>Quests happen in public spaces with clear meetup points</li>
                    <li>BUGGS provides real-time coordination and check-ins</li>
                    <li>Community Guidelines that everyone agrees to before joining</li>
                    <li>Rating and feedback system after each quest</li>
                    <li>Dedicated reporting channel for concerns</li>
                  </ul>
                  <h3 className="font-display text-lg font-semibold text-foreground mt-6 mb-3">
                    What You Should Do
                  </h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Meet in public spaces for your first interactions</li>
                    <li>Share your plans with someone you trust</li>
                    <li>Trust your instincts. If something feels wrong, leave</li>
                    <li>Keep your phone charged and accessible</li>
                    <li>Report any concerning behavior immediately</li>
                  </ul>
                  <p className="mt-4">
                    <strong>Reporting concerns:</strong> Email us at{' '}
                    <a href="mailto:hello@openclique.com" className="text-primary hover:underline">
                      hello@openclique.com
                    </a>{' '}
                    or use the in-app reporting feature. We review every report within 24 hours.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Intellectual Property
                  </h2>
                  <p>
                    The {BRAND.name} name, logo, website design, and content are owned by {BRAND.name} and 
                    protected by intellectual property laws. You may not use our branding without permission.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Limitation of Liability
                  </h2>
                  <p>
                    To the maximum extent permitted by law, {BRAND.name} and its founders, employees, and 
                    partners shall not be liable for any indirect, incidental, special, consequential, or 
                    punitive damages resulting from your use of the Service.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Changes to Terms
                  </h2>
                  <p>
                    We may update these Terms from time to time. We'll notify you of significant changes 
                    via email or through the Service. Continued use after changes constitutes acceptance.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Contact
                  </h2>
                  <p>
                    Questions about these terms? Contact us at{' '}
                    <a href="mailto:hello@openclique.com" className="text-primary hover:underline">
                      hello@openclique.com
                    </a>
                  </p>
                </section>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
