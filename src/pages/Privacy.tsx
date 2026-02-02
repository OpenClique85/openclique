/**
 * =============================================================================
 * FILE: Privacy.tsx
 * PURPOSE: The Privacy Policy page - legal privacy information
 * =============================================================================
 * 
 * WHAT THIS FILE CONTROLS:
 * - Privacy policy content and formatting
 * - All privacy-related legal text
 * 
 * WHERE TO EDIT COPY/TEXT:
 * - Brand name is pulled from: src/constants/content.ts → BRAND.name
 * - All other text is hardcoded in this file (see sections below)
 * - Contact email: hello@openclique.com (appears in multiple places)
 * 
 * NOTE: This is a legal document. Changes should be reviewed for compliance.
 * 
 * RELATED FILES:
 * - src/constants/content.ts (BRAND.name only)
 * - src/pages/Terms.tsx (companion legal page)
 * 
 * LAST UPDATED: January 2025
 * =============================================================================
 */

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BRAND } from "@/constants/content";

/**
 * Privacy Policy Page Component
 * 
 * Displays the full privacy policy with multiple sections.
 * Uses semantic HTML and prose styling for readability.
 */
export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto prose prose-slate">
              
              {/* ============ PAGE TITLE ============ */}
              <h1 className="font-display text-4xl font-bold text-foreground mb-8">
                Privacy Policy
              </h1>
              
              {/* Auto-generated "Last updated" date */}
              <p className="text-muted-foreground text-lg mb-8">
                Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>

              <div className="space-y-8 text-muted-foreground">
                
                {/* ============ SECTION: Commitment ============ */}
                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Our Commitment to Privacy
                  </h2>
                  <p>
                    At {BRAND.name}, we believe in transparency and respect for your personal information. 
                    This policy explains what data we collect, how we use it, and your rights regarding your information.
                    We're committed to giving you control over your data while enabling meaningful real-world connections.
                  </p>
                  <div className="mt-4 p-4 bg-accent/50 rounded-lg">
                    <h3 className="font-semibold text-foreground mb-2">Our Core Principles:</h3>
                    <ul className="list-disc pl-4 space-y-1 text-sm">
                      <li><strong>Opt-In, Never Opt-Out:</strong> You must actively choose to share data</li>
                      <li><strong>Clear Language:</strong> No legal jargon — we explain in plain English</li>
                      <li><strong>Minimal Collection:</strong> We only collect what we actually need</li>
                      <li><strong>User Control:</strong> View, export, and delete your data anytime</li>
                      <li><strong>Transparency:</strong> We always explain WHY before asking</li>
                    </ul>
                  </div>
                </section>

                {/* ============ SECTION: Eligibility ============ */}
                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Eligibility (18+ Requirement)
                  </h2>
                  <p>
                    {BRAND.name} is intended for adults aged 18 and older. During signup, we collect 
                    your date of birth to verify your age. If you are under 18, you cannot create an account.
                  </p>
                  <p className="mt-4">
                    <strong>We do not knowingly collect data from minors.</strong> If we learn that we have 
                    collected personal information from someone under 18, we will delete that information 
                    and terminate the account.
                  </p>
                </section>

                {/* ============ SECTION: Profile Visibility ============ */}
                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Profile Visibility & Your Control
                  </h2>
                  <p>
                    You decide who sees your profile information. Through your{' '}
                    <a href="/settings?tab=privacy" className="text-primary hover:underline">
                      Privacy Settings
                    </a>, you can set your profile visibility to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>
                      <strong>Public:</strong> Your display name and city are visible to other {BRAND.name} members
                    </li>
                    <li>
                      <strong>Squad Only:</strong> Only members of your squads and cliques can see your profile
                    </li>
                    <li>
                      <strong>Private:</strong> Your profile appears as "Private User" to others
                    </li>
                  </ul>
                  <p className="mt-4">
                    <strong>What's never publicly exposed:</strong> Your email address, date of birth, notification 
                    preferences, and detailed settings are never visible to other users — only to you and our admin 
                    team when providing support.
                  </p>
                </section>

                {/* ============ SECTION: What We Collect ============ */}
                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    What We Collect & Why
                  </h2>
                  <p>We collect only what's necessary to help you find your people:</p>
                  
                  <h3 className="font-semibold text-foreground mt-4 mb-2">Account Information:</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Email address</strong> (required for login and important updates)</li>
                    <li><strong>Display name</strong> (public, visible to squad members)</li>
                    <li><strong>Date of birth</strong> (required for age verification, never shared)</li>
                    <li><strong>City</strong> (to show local quests)</li>
                    <li><strong>Profile photo</strong> (optional)</li>
                  </ul>

                  <h3 className="font-semibold text-foreground mt-4 mb-2">Quest Participation:</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Quests you sign up for</li>
                    <li>Attendance records (check-in timestamps)</li>
                    <li>Approximate location IF you opt-in to location-verified check-in</li>
                    <li>XP and achievement progress</li>
                  </ul>

                  <h3 className="font-semibold text-foreground mt-4 mb-2">Communications:</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Messages you send in quest group chats</li>
                    <li>Reports you submit about other users</li>
                    <li>Feedback you provide after quests</li>
                  </ul>

                  <h3 className="font-semibold text-foreground mt-4 mb-2">Technical Data:</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Device type and browser</li>
                    <li>IP address (for security and fraud prevention)</li>
                    <li>Usage analytics (anonymized)</li>
                  </ul>
                </section>

                {/* ============ SECTION: Location Data ============ */}
                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Location Data
                  </h2>
                  <p>We collect location information to help you discover and attend local quests:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>
                      <strong>City-level location:</strong> When you sign up, you provide your city so we can 
                      show quests happening near you. This is visible on your profile based on your visibility settings.
                    </li>
                    <li>
                      <strong>Approximate check-in location (optional):</strong> If you choose to use geolocation 
                      check-in when arriving at a quest, we may collect your approximate location to verify attendance. 
                      This is entirely optional — you can always check in using manual confirmation, QR code, or photo upload instead.
                    </li>
                  </ul>
                  <p className="mt-4"><strong>How we handle your location data:</strong></p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>We never share your precise location with other users</li>
                    <li>Precise GPS coordinates (if collected during check-in) are converted to approximate location and the precise data is discarded</li>
                    <li>Your city is the only location information visible to other members (based on your privacy settings)</li>
                    <li>We do not track your location in the background or when you're not actively checking in</li>
                    <li>You can update your city at any time in your profile settings</li>
                  </ul>
                  <p className="mt-4">
                    You can manage your location preferences through your device's permissions. 
                    Denying location access will not prevent you from using {BRAND.name} — alternative check-in methods are always available.
                  </p>
                </section>

                {/* ============ SECTION: How We Use Your Data ============ */}
                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    How We Use Your Data
                  </h2>
                  <p>Your data helps us create better experiences:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>
                      <strong>Matching & suggestions:</strong> We use your activity patterns (not your personal details) 
                      to suggest quests and squads that might interest you
                    </li>
                    <li>
                      <strong>Community features:</strong> Display names are shown to squad members so you can 
                      recognize who you're meeting up with
                    </li>
                    <li>
                      <strong>Communications:</strong> Email for essential updates about your quests and account
                    </li>
                  </ul>
                  <p className="mt-4">
                    <strong>What we don't do:</strong> We never sell your data. We don't share your information 
                    with advertisers. We don't use manipulative algorithms designed to keep you scrolling.
                  </p>
                </section>

                {/* ============ SECTION: Creator & Sponsor Profiles ============ */}
                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Creator & Sponsor Profiles
                  </h2>
                  <p>
                    If you become a verified quest creator or sponsor, some information becomes publicly visible 
                    by design to help members discover your offerings:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>
                      <strong>Creators:</strong> Display name, bio, city, social links, and what you're looking for 
                      are visible when your profile is active. Payout and internal details remain private.
                    </li>
                    <li>
                      <strong>Sponsors:</strong> Company name, description, website, and logo are visible when approved. 
                      Contact information, budget details, and internal notes remain private.
                    </li>
                  </ul>
                </section>

                {/* ============ SECTION: Self-Service Controls ============ */}
                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Self-Service Data Controls
                  </h2>
                  <p>
                    We believe you should have full control over your data. Through your{' '}
                    <a href="/settings?tab=data" className="text-primary hover:underline">
                      Settings page
                    </a>, you can:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>
                      <strong>Export your data:</strong> Download a complete copy of all your {BRAND.name} data in JSON format
                    </li>
                    <li>
                      <strong>Manage privacy settings:</strong> Control who can see your profile, activity, and whether you appear in matching
                    </li>
                    <li>
                      <strong>Manage notifications:</strong> Choose which emails and in-app notifications you receive
                    </li>
                    <li>
                      <strong>Delete your account:</strong> Initiate account deletion with a 7-day grace period to change your mind
                    </li>
                  </ul>
                </section>

                {/* ============ SECTION: Your Rights ============ */}
                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Your Rights
                  </h2>
                  <p>You have the right to:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>Request a copy of any personal data we hold about you</li>
                    <li>Request correction of inaccurate personal data</li>
                    <li>Request deletion of your personal data</li>
                    <li>Opt out of marketing communications</li>
                    <li>Withdraw consent for data processing</li>
                    <li>Know what data we use to make suggestions (we log this)</li>
                  </ul>
                  <p className="mt-4">
                    We maintain records of your consent decisions for transparency. You can review your consent 
                    history through your account settings.
                  </p>
                </section>

                {/* ============ SECTION: Data Deletion ============ */}
                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Account Deletion
                  </h2>
                  <p>
                    You can delete your account at any time through your{' '}
                    <a href="/settings?tab=account" className="text-primary hover:underline">
                      Settings page
                    </a>. When you request deletion:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>
                      <strong>7-day grace period:</strong> You have 7 days to cancel your deletion request by logging back in
                    </li>
                    <li>
                      <strong>Confirmation email:</strong> We'll send you an email confirming your deletion request
                    </li>
                    <li>
                      <strong>Data export option:</strong> You can download your data before deletion completes
                    </li>
                    <li>
                      <strong>Complete removal:</strong> After the grace period, all your personal data is permanently deleted
                    </li>
                  </ul>
                  <p className="mt-4">
                    Alternatively, you may email{' '}
                    <a href="mailto:hello@openclique.com" className="text-primary hover:underline">
                      hello@openclique.com
                    </a> with the subject line "Data Deletion Request" and we will process it within 48 hours.
                  </p>
                </section>

                {/* ============ SECTION: Data Retention ============ */}
                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Data Retention
                  </h2>
                  <p>We retain your information only as long as necessary:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>
                      <strong>Active accounts:</strong> Data is retained while your account is active
                    </li>
                    <li>
                      <strong>Location data:</strong> Automatically deleted after 90 days regardless of account status
                    </li>
                    <li>
                      <strong>After deletion request:</strong> Data is permanently removed 7 days after your deletion request (unless cancelled)
                    </li>
                    <li>
                      <strong>Exit feedback:</strong> Anonymous feedback you provide during deletion is retained to help us improve
                    </li>
                    <li>
                      <strong>Analytics data:</strong> Anonymized and aggregated — contains no personal identifiers
                    </li>
                    <li>
                      <strong>Safety records:</strong> Ban records and moderation history retained for 7 years for legal/safety purposes
                    </li>
                  </ul>
                  <p className="mt-4">
                    <strong>We do not sell, rent, or share your personal information with third parties for marketing purposes.</strong>
                  </p>
                </section>

                {/* ============ SECTION: Third-Party Services ============ */}
                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Third-Party Services
                  </h2>
                  <p>We use the following third-party services that may process your data:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>
                      <strong>Authentication provider:</strong> For secure account login and management
                    </li>
                    <li>
                      <strong>Cloud infrastructure:</strong> For securely storing and serving your data
                    </li>
                    <li>
                      <strong>Analytics:</strong> Privacy-respecting analytics that collect only anonymized, aggregated data
                    </li>
                    <li>
                      <strong>Email services:</strong> For sending transactional and notification emails
                    </li>
                  </ul>
                  <p className="mt-4">
                    Each of these services has their own privacy policies. We choose partners who prioritize data protection 
                    and comply with applicable data protection regulations.
                  </p>
                </section>

                {/* ============ SECTION: Security ============ */}
                <section>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    How We Protect Your Data
                  </h2>
                  <p>We implement multiple layers of protection:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>
                      <strong>Row-level security:</strong> Database policies ensure you can only access your own data
                    </li>
                    <li>
                      <strong>Encrypted connections:</strong> All data transmitted uses industry-standard encryption
                    </li>
                    <li>
                      <strong>Access controls:</strong> Admin access is logged and auditable
                    </li>
                    <li>
                      <strong>Regular reviews:</strong> We conduct security assessments to identify and address vulnerabilities
                    </li>
                  </ul>
                </section>

                {/* ============ SECTION: Contact ============ */}
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
                  <p className="mt-4">
                    For data protection inquiries, include "Privacy Request" in your subject line for priority handling.
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
