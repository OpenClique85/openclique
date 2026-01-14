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

                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Safety
                  </h2>
                  <p>
                    While we design quests with safety in mind, {BRAND.name} is a platform that facilitates 
                    real-world meetups. You are responsible for your own safety and should:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>Meet in public spaces</li>
                    <li>Share your plans with someone you trust</li>
                    <li>Trust your instincts — if something feels wrong, leave</li>
                    <li>Report any concerning behavior to our team</li>
                  </ul>
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
