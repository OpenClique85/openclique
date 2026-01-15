import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BRAND } from "@/constants/content";

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto prose prose-slate">
              <h1 className="font-display text-4xl font-bold text-foreground mb-8">
                Privacy Policy
              </h1>
              
              <p className="text-muted-foreground text-lg mb-8">
                Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>

              <div className="space-y-8 text-muted-foreground">
                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Our Commitment to Privacy
                  </h2>
                  <p>
                    At {BRAND.name}, we believe in transparency and respect for your personal information. 
                    This policy explains what data we collect, how we use it, and your rights regarding your information.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    What We Collect on This Website
                  </h2>
                  <p>
                    <strong>This marketing website does not collect personal information directly.</strong> We use:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>
                      <strong>Analytics cookies:</strong> We may use privacy-respecting analytics to understand how 
                      visitors use our site (pages visited, time on site). This data is anonymized and aggregated.
                    </li>
                    <li>
                      <strong>Non-identifying tracking:</strong> When you click certain buttons, we track the action 
                      (not your identity) to understand which features interest our visitors.
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    When You Sign Up (via Google Forms)
                  </h2>
                  <p>
                    If you choose to join our pilot, partner with us, or work with us, you'll be redirected to 
                    Google Forms. Information you provide there is:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>Stored securely in our Google Workspace account</li>
                    <li>Used only to coordinate pilots, partnerships, and collaborations</li>
                    <li>Never sold to third parties</li>
                    <li>Retained only as long as necessary for our relationship</li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Email Subscriptions
                  </h2>
                  <p>
                    If you subscribe to our email list, we store your email address to send you updates about 
                    {BRAND.name}. You can unsubscribe at any time by clicking the link in any email or contacting us.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Your Rights
                  </h2>
                  <p>You have the right to:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>Request a copy of any personal data we hold about you</li>
                    <li>Request deletion of your personal data</li>
                    <li>Opt out of marketing communications</li>
                    <li>Withdraw consent for data processing</li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Data Deletion Requests
                  </h2>
                  <p>
                    You may request deletion of your personal data at any time by emailing{' '}
                    <a href="mailto:hello@openclique.com" className="text-primary hover:underline">
                      hello@openclique.com
                    </a> with the subject line "Data Deletion Request."
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>We will acknowledge your request within 48 hours</li>
                    <li>Deletion will be completed within 30 days</li>
                    <li>You will receive confirmation once your data has been removed</li>
                    <li>Some data may be retained if required by law or for legitimate business purposes (e.g., fraud prevention)</li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Data Retention
                  </h2>
                  <p>We retain your information only as long as necessary:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>
                      <strong>Pilot program data:</strong> Retained during the pilot and up to 12 months after your last activity, unless you request earlier deletion
                    </li>
                    <li>
                      <strong>Email subscriptions:</strong> Until you unsubscribe or request removal
                    </li>
                    <li>
                      <strong>Analytics data:</strong> Anonymized and aggregated — contains no personal identifiers
                    </li>
                  </ul>
                  <p className="mt-4">
                    <strong>We do not sell, rent, or share your personal information with third parties for marketing purposes.</strong>
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Third-Party Services
                  </h2>
                  <p>We use the following third-party services that may process your data:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>
                      <strong>Google Forms & Workspace:</strong> For collecting and storing form submissions (pilot signups, partnerships, etc.)
                    </li>
                    <li>
                      <strong>Hosting provider:</strong> For serving this website
                    </li>
                    <li>
                      <strong>Analytics:</strong> Privacy-respecting analytics that collect only anonymized, aggregated data
                    </li>
                  </ul>
                  <p className="mt-4">
                    Each of these services has their own privacy policies. We choose partners who prioritize data protection.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Contact Us
                  </h2>
                  <p>
                    If you have questions about this privacy policy or your data, please contact us at{' '}
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
