/**
 * =============================================================================
 * FILE: Terms.tsx
 * PURPOSE: The Terms of Service page - legal terms and conditions
 * =============================================================================
 * 
 * WHAT THIS FILE CONTROLS:
 * - Terms of service content and formatting
 * - All legal terms including pilot program, user conduct, safety guidelines
 * - Community guidelines section (has anchor #community-guidelines)
 * - Safety section (has anchor #safety)
 * 
 * WHERE TO EDIT COPY/TEXT:
 * - Brand name is pulled from: src/constants/content.ts → BRAND.name
 * - All other text is hardcoded in this file (see sections below)
 * - Contact email: hello@openclique.com (appears in multiple places)
 * 
 * IMPORTANT ANCHORS:
 * - #community-guidelines - Links directly to community guidelines section
 * - #safety - Links directly to safety section
 * 
 * NOTE: This is a legal document. Changes should be reviewed for compliance.
 * 
 * RELATED FILES:
 * - src/constants/content.ts (BRAND.name only)
 * - src/pages/Privacy.tsx (companion legal page)
 * 
 * LAST UPDATED: January 2025
 * =============================================================================
 */

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BRAND } from "@/constants/content";

/**
 * Terms of Service Page Component
 * 
 * Displays the full terms of service with multiple sections.
 * Uses semantic HTML and prose styling for readability.
 */
export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto prose prose-slate">
              
              {/* ============ PAGE TITLE ============ */}
              <h1 className="font-display text-4xl font-bold text-foreground mb-8">
                Terms of Service
              </h1>
              
              {/* Auto-generated "Last updated" date */}
              <p className="text-muted-foreground text-lg mb-8">
                Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>

              <div className="space-y-8 text-muted-foreground">
                
                {/* ============ SECTION: Welcome ============ */}
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

                {/* ============ SECTION: Pilot Program ============ */}
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

                {/* ============ SECTION: User Conduct ============ */}
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

                {/* ============ SECTION: Location Data & Check-In ============ */}
                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Location Data & Check-In
                  </h2>
                  <p className="mb-4">
                    {BRAND.name} offers optional location-based features to enhance your quest experience:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>
                      <strong>Quest Discovery:</strong> We use your city to show relevant local quests
                    </li>
                    <li>
                      <strong>Check-In Verification:</strong> When you arrive at a quest, you may check in using various methods:
                      <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li>Manual check-in (tap a button)</li>
                        <li>QR code scan (scan host's code)</li>
                        <li>Photo upload (share proof of attendance)</li>
                        <li>Geolocation check-in (share your approximate location)</li>
                      </ul>
                    </li>
                  </ul>
                  <p className="mt-4">
                    By using geolocation check-in, you consent to {BRAND.name} temporarily accessing your device's 
                    location to verify you are at or near the quest venue. This location data:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>Is used only to confirm attendance</li>
                    <li>Is immediately converted to approximate coordinates</li>
                    <li>Is not stored in precise form</li>
                    <li>Is not shared with other users</li>
                  </ul>
                  <p className="mt-4">
                    You are never required to use geolocation. Alternative check-in methods are always available. 
                    If you deny location permission on your device, you can still participate in all quests using other check-in methods.
                  </p>
                  <p className="mt-4">
                    For details on how we handle your location data, see our{' '}
                    <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
                  </p>
                </section>

                {/* ============ SECTION: Community Guidelines ============ */}
                {/* This section has an anchor: #community-guidelines */}
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

                {/* ============ SECTION: Safety & Trust ============ */}
                {/* This section has an anchor: #safety */}
                <section id="safety">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Safety & Assumption of Risk
                  </h2>
                  <p className="mb-4">
                    {BRAND.name} facilitates real-world meetups with other users. By participating in quests, 
                    you acknowledge and agree to the following:
                  </p>
                  
                  {/* Safety Responsibilities */}
                  <h3 className="font-display text-lg font-semibold text-foreground mt-6 mb-3">
                    Your Safety Responsibilities
                  </h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>YOU</strong> are responsible for your own safety and well-being</li>
                    <li><strong>YOU</strong> should meet in public places and trust your instincts</li>
                    <li><strong>YOU</strong> should tell a friend where you're going</li>
                    <li><strong>YOU</strong> should never share sensitive personal information immediately</li>
                    <li><strong>YOU</strong> should report concerning behavior to {BRAND.name} immediately</li>
                  </ul>

                  {/* What We Don't Do */}
                  <h3 className="font-display text-lg font-semibold text-foreground mt-6 mb-3">
                    What We Do NOT Do
                  </h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>We do NOT conduct background checks on users</li>
                    <li>We do NOT verify identities beyond email confirmation</li>
                    <li>We do NOT supervise or monitor quests in-person</li>
                    <li>We do NOT guarantee the safety of any interaction</li>
                  </ul>

                  <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm font-medium text-destructive">
                      <strong>Assumption of Risk:</strong> You assume all risks associated with meeting strangers 
                      through {BRAND.name}, including but not limited to personal injury, property damage, or 
                      emotional distress.
                    </p>
                  </div>

                  {/* What We Do */}
                  <h3 className="font-display text-lg font-semibold text-foreground mt-6 mb-3">
                    What We Do
                  </h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>All participants go through age verification (18+)</li>
                    <li>Quests happen in public spaces with clear meetup points</li>
                    <li>Community Guidelines that everyone agrees to before joining</li>
                    <li>Rating and feedback system after each quest</li>
                    <li>24-hour report review and moderation</li>
                    <li>Emergency SOS button for urgent situations</li>
                  </ul>

                  <p className="mt-4">
                    <strong>Reporting concerns:</strong> Email us at{' '}
                    <a href="mailto:hello@openclique.com" className="text-primary hover:underline">
                      hello@openclique.com
                    </a>{' '}
                    or use the in-app reporting feature. We review every report within 24 hours.
                  </p>
                </section>

                {/* ============ SECTION: Prohibited Conduct ============ */}
                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Prohibited Conduct
                  </h2>
                  <p className="mb-4">You agree NOT to use {BRAND.name} to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Harass, threaten, intimidate, or harm others</li>
                    <li>Share explicit, violent, or illegal content</li>
                    <li>Impersonate others or provide false information (including false age)</li>
                    <li>Spam, advertise, or solicit other users</li>
                    <li>Coordinate illegal activities</li>
                    <li>Circumvent safety features or reporting mechanisms</li>
                    <li>Access other users' accounts or data</li>
                    <li>Share other users' personal information without consent</li>
                  </ul>
                  <p className="mt-4">
                    Violations may result in account suspension or permanent ban. We cooperate with 
                    law enforcement when required by law.
                  </p>
                </section>

                {/* ============ SECTION: Intellectual Property ============ */}
                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Intellectual Property
                  </h2>
                  <p>
                    The {BRAND.name} name, logo, website design, and content are owned by {BRAND.name} and 
                    protected by intellectual property laws. You may not use our branding without permission.
                  </p>
                </section>

                {/* ============ SECTION: Limitation of Liability ============ */}
                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Limitation of Liability
                  </h2>
                  <p className="mb-4">To the maximum extent permitted by law:</p>
                  <p className="mb-4">
                    {BRAND.name} is provided "as is" without warranties of any kind. We do not guarantee 
                    that the service will be uninterrupted, secure, or error-free.
                  </p>
                  <p className="mb-4">
                    {BRAND.name} and its founders, employees, and partners <strong>SHALL NOT BE LIABLE</strong> for:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Personal injury, assault, or harm occurring during quests</li>
                    <li>Property damage or theft</li>
                    <li>Emotional distress or psychological harm</li>
                    <li>Lost data or service interruptions</li>
                    <li>Actions or conduct of other users</li>
                    <li>Any indirect, incidental, special, or consequential damages</li>
                  </ul>
                  <p className="mt-4">
                    Your sole remedy for dissatisfaction is to stop using {BRAND.name}.
                  </p>
                  <p className="mt-4">
                    <strong>Maximum Liability:</strong> If we are found liable despite these limitations, our 
                    total liability shall not exceed $100 or the amount you paid us in the past 12 months, 
                    whichever is greater.
                  </p>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Some states do not allow these limitations, so they may not apply to you.
                  </p>
                </section>

                {/* ============ SECTION: Dispute Resolution ============ */}
                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Governing Law & Disputes
                  </h2>
                  <p className="mb-4">
                    These Terms are governed by the laws of the State of Texas, without regard to 
                    conflict of law principles.
                  </p>
                  <p className="mb-4">
                    Any disputes shall be resolved through binding arbitration in Austin, Texas, rather 
                    than in court. You and {BRAND.name} both waive the right to a jury trial or class 
                    action lawsuit.
                  </p>
                  <p>
                    <strong>Exception:</strong> Either party may seek injunctive relief in court if 
                    necessary to protect intellectual property or confidential information.
                  </p>
                </section>

                {/* ============ SECTION: Changes to Terms ============ */}
                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Changes to Terms
                  </h2>
                  <p>
                    We may update these Terms from time to time. We'll notify you of significant changes 
                    via email or through the Service. Continued use after changes constitutes acceptance.
                  </p>
                </section>

                {/* ============ SECTION: Contact ============ */}
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
