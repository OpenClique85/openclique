-- =============================================================================
-- CTO HANDOFF PACK: SYSTEM DOCUMENTATION TABLE
-- =============================================================================
-- Stores manually-maintained documentation that cannot be auto-generated
-- Used by the Admin "Docs" section for flows, state machines, rules, etc.

CREATE TABLE public.system_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Categorization
  category TEXT NOT NULL CHECK (category IN ('flow', 'state_machine', 'rule', 'guardrail', 'security', 'ops', 'estimation', 'product')),
  subcategory TEXT, -- e.g., 'quest', 'signup', 'squad', 'gamification', 'listing'
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  
  -- Content fields
  description TEXT,
  content_markdown TEXT, -- Rich markdown content
  mermaid_diagram TEXT, -- Mermaid syntax for visual diagrams
  
  -- Metadata
  version INTEGER DEFAULT 1,
  last_edited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ordering and status
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.system_docs ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_system_docs_category ON system_docs(category, subcategory);
CREATE INDEX idx_system_docs_slug ON system_docs(slug);

-- RLS Policies
CREATE POLICY "Admins can manage system_docs"
  ON public.system_docs FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Published docs are readable by authenticated users"
  ON public.system_docs FOR SELECT
  USING (is_published = true AND auth.uid() IS NOT NULL);

-- Updated at trigger
CREATE TRIGGER update_system_docs_updated_at
  BEFORE UPDATE ON public.system_docs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- SEED INITIAL DOCUMENTATION TEMPLATES
-- =============================================================================

-- Product Overview
INSERT INTO public.system_docs (category, subcategory, title, slug, description, content_markdown, sort_order) VALUES
('product', NULL, 'Product Overview', 'product-overview', 
 'High-level product description and mission',
 E'# OpenClique Product Overview\n\n## Mission\n\nOpenClique is behavioral infrastructure for real-world connection. We optimize for showing up, completing quests, and repeat group formation—not time-on-screen.\n\n## Core Value Proposition\n\n> "I don''t know anyone here" → "I''ll see my squad again next week."\n\n## Target Users\n\n- **Primary**: Mobile urban professionals (23-40), recently relocated, remote/hybrid workers\n- **Secondary**: Graduate students, hobby explorers, empty nesters seeking community\n\n## Key Anxieties We Address\n\n1. "I don''t want to go alone."\n2. "I don''t want this to be awkward."\n3. "I don''t want another flaky group chat."\n\n## What We Avoid\n\n- No infinite scrolls, swipe mechanics, or vanity metrics\n- No public follower counts or popularity rankings\n- No AI that impersonates humans or hides its role\n- No dark patterns that pressure attendance',
 1);

-- Signup Flow
INSERT INTO public.system_docs (category, subcategory, title, slug, description, content_markdown, mermaid_diagram, sort_order) VALUES
('flow', 'signup', 'Quest Signup Flow', 'quest-signup-flow',
 'User journey from browsing quests to confirmed attendance',
 E'# Quest Signup Flow\n\n## Overview\n\nThis flow covers how users discover, sign up for, and confirm attendance at quests.\n\n## Key Decision Points\n\n1. **Capacity Check**: Is there space available?\n2. **Authentication**: Is the user logged in?\n3. **Profile Completion**: Does the user have required profile fields?\n\n## Post-Signup Actions\n\n- Send confirmation email\n- Add to squad matching queue\n- Schedule reminder notifications',
 E'flowchart TD\n    A[Browse Quests] --> B{Logged In?}\n    B -->|No| C[Redirect to Auth]\n    C --> D[Return to Quest]\n    B -->|Yes| E{Capacity Available?}\n    E -->|No| F[Join Waitlist]\n    E -->|Yes| G[Confirm Signup]\n    G --> H[Send Confirmation Email]\n    H --> I[Add to Squad Queue]\n    I --> J[Schedule Reminders]\n    F --> K[Notify on Opening]',
 10);

-- Squad Formation Flow
INSERT INTO public.system_docs (category, subcategory, title, slug, description, content_markdown, mermaid_diagram, sort_order) VALUES
('flow', 'squad', 'Squad Formation Flow', 'squad-formation-flow',
 'How squads are formed from quest signups',
 E'# Squad Formation Flow\n\n## Overview\n\nSquads are small groups (3-6 people) formed for each quest to reduce social anxiety.\n\n## Matching Criteria\n\n1. **Vibe Preference**: Chill, social, or party\n2. **Age Bracket**: Similar age ranges\n3. **Area**: Geographic proximity\n4. **Interests**: Shared interests from profile\n\n## Squad Roles\n\n- **Point Person**: First to arrive, helps others find group\n- **Timekeeper**: Ensures squad stays on schedule\n- **Photographer**: Captures moments (optional)',
 E'flowchart TD\n    A[Quest Signups Close] --> B[Gather Confirmed Users]\n    B --> C[Run Matching Algorithm]\n    C --> D{Enough for Squad?}\n    D -->|No| E[Merge with Similar Group]\n    D -->|Yes| F[Form Squad]\n    F --> G[Assign Roles]\n    G --> H[Send Squad Intro]\n    H --> I[Create Group Chat]',
 20);

-- XP System Rules
INSERT INTO public.system_docs (category, subcategory, title, slug, description, content_markdown, sort_order) VALUES
('rule', 'gamification', 'XP Award Rules', 'xp-award-rules',
 'Rules for awarding XP across the platform',
 E'# XP Award Rules\n\n## Base XP Awards\n\n| Action | XP Amount | Notes |\n|--------|-----------|-------|\n| Complete Quest | 50-150 | Based on quest difficulty |\n| Submit Feedback | 25 | Per quest feedback |\n| Achievement Unlock | 10-100 | Varies by achievement |\n| Streak Milestone | 50 | Every 4 weeks |\n\n## Tree XP\n\nXP is also tracked per progression tree:\n- **Culture**: Art, music, food quests\n- **Wellness**: Fitness, outdoor, mindfulness\n- **Connector**: Social, networking, community\n\n## Bonus Multipliers\n\n- First quest in new category: 1.5x\n- Consecutive weekly attendance: +10 per week\n- Bringing a friend (referral): +25',
 30);

-- Signup Status State Machine
INSERT INTO public.system_docs (category, subcategory, title, slug, description, content_markdown, mermaid_diagram, sort_order) VALUES
('state_machine', 'signup', 'Signup Status States', 'signup-status-states',
 'State transitions for quest signup status',
 E'# Signup Status State Machine\n\n## States\n\n| State | Description |\n|-------|-------------|\n| `pending` | User signed up, awaiting confirmation |\n| `confirmed` | Spot secured, reminder scheduled |\n| `standby` | On waitlist, notified on opening |\n| `dropped` | User cancelled before event |\n| `no_show` | User did not attend |\n| `completed` | Successfully attended |',
 E'stateDiagram-v2\n    [*] --> pending\n    pending --> confirmed: Spot Available\n    pending --> standby: Quest Full\n    standby --> confirmed: Spot Opens\n    confirmed --> dropped: User Cancels\n    confirmed --> no_show: Did Not Attend\n    confirmed --> completed: Attended\n    dropped --> [*]\n    no_show --> [*]\n    completed --> [*]',
 40);

-- Quest Status State Machine
INSERT INTO public.system_docs (category, subcategory, title, slug, description, content_markdown, mermaid_diagram, sort_order) VALUES
('state_machine', 'quest', 'Quest Status States', 'quest-status-states',
 'State transitions for quest lifecycle',
 E'# Quest Status State Machine\n\n## States\n\n| State | Description |\n|-------|-------------|\n| `draft` | Quest created, not visible |\n| `pending_review` | Submitted for admin review |\n| `open` | Accepting signups |\n| `closed` | Signups closed, event upcoming |\n| `completed` | Event finished |\n| `cancelled` | Event cancelled |',
 E'stateDiagram-v2\n    [*] --> draft\n    draft --> pending_review: Submit\n    pending_review --> draft: Needs Changes\n    pending_review --> open: Approved\n    open --> closed: Capacity Full or Cutoff\n    closed --> completed: Event Ends\n    closed --> cancelled: Admin Cancels\n    open --> cancelled: Admin Cancels\n    completed --> [*]\n    cancelled --> [*]',
 41);

-- RBAC Rules
INSERT INTO public.system_docs (category, subcategory, title, slug, description, content_markdown, sort_order) VALUES
('security', 'rbac', 'RBAC Permission Matrix', 'rbac-permissions',
 'Role-based access control definitions',
 E'# RBAC Permission Matrix\n\n## Roles\n\n| Role | Description |\n|------|-------------|\n| `user` | Standard authenticated user |\n| `quest_creator` | Can create and manage quests |\n| `sponsor` | Can create venues, rewards, listings |\n| `admin` | Full system access |\n\n## Permission Matrix\n\n| Resource | User | Creator | Sponsor | Admin |\n|----------|------|---------|---------|-------|\n| View Quests | ✅ | ✅ | ✅ | ✅ |\n| Create Quest | ❌ | ✅ | ❌ | ✅ |\n| Edit Own Quest | ❌ | ✅ | ❌ | ✅ |\n| Edit Any Quest | ❌ | ❌ | ❌ | ✅ |\n| View Admin Console | ❌ | ❌ | ❌ | ✅ |\n| Manage Users | ❌ | ❌ | ❌ | ✅ |\n| Create Rewards | ❌ | ❌ | ✅ | ✅ |\n| View Analytics | Own | Own | Own | All |',
 50);

-- Guardrails
INSERT INTO public.system_docs (category, subcategory, title, slug, description, content_markdown, sort_order) VALUES
('guardrail', 'limits', 'System Limits & Guardrails', 'system-guardrails',
 'Edge cases and system limits',
 E'# System Limits & Guardrails\n\n## Signup Limits\n\n- Max signups per user per week: 10\n- Max active quests per creator: 50\n- Max squad size: 6 (min: 3)\n\n## Rate Limits\n\n- API requests: 100/min per user\n- Email sends: 10/hour per user\n- Support tickets: 5/day per user\n\n## Content Limits\n\n- Quest title: 100 chars\n- Quest description: 2000 chars\n- Profile bio: 500 chars\n\n## Edge Cases\n\n1. **Solo signup for group quest**: Merge into existing squad or hold until more sign up\n2. **Creator cancels quest with signups**: Auto-refund any payments, notify all attendees\n3. **User no-shows 3 times**: Flag for review, possible account restriction',
 60);

-- Epics Template
INSERT INTO public.system_docs (category, subcategory, title, slug, description, content_markdown, sort_order) VALUES
('estimation', 'epics', 'Feature Epics', 'feature-epics',
 'High-level feature groupings for estimation',
 E'# Feature Epics\n\n## Epic 1: Core Quest Experience\n- Quest catalog and search\n- Quest detail pages\n- Signup flow with capacity management\n- Squad formation and notifications\n\n## Epic 2: Gamification System\n- XP tracking and leveling\n- Achievement system\n- Streak tracking\n- Progression trees (Culture, Wellness, Connector)\n\n## Epic 3: Creator Portal\n- Quest creation wizard\n- Analytics dashboard\n- Proposal and listing management\n- Public profile pages\n\n## Epic 4: Sponsor Marketplace\n- Venue and reward management\n- Creator discovery and proposals\n- Listing applications\n- Analytics and ROI tracking\n\n## Epic 5: Admin Operations\n- Quest/signup management\n- Support ticket system\n- Notification console\n- Security and audit tools',
 70);

-- Known Unknowns
INSERT INTO public.system_docs (category, subcategory, title, slug, description, content_markdown, sort_order) VALUES
('estimation', 'risks', 'Known Unknowns & Risks', 'known-unknowns',
 'Technical debt and identified risks',
 E'# Known Unknowns & Risks\n\n## Technical Debt\n\n- [ ] Full OpenAPI spec for edge functions\n- [ ] Comprehensive test coverage\n- [ ] Performance optimization for large datasets\n- [ ] Mobile app considerations\n\n## Risks\n\n| Risk | Impact | Mitigation |\n|------|--------|------------|\n| Squad matching at scale | High | Pre-compute compatibility scores |\n| Email deliverability | Medium | Use reputable provider, monitor bounces |\n| Peak load during events | High | CDN, caching, auto-scaling |\n\n## Open Questions\n\n1. How to handle timezone differences for remote quests?\n2. What happens when a creator leaves mid-quest?\n3. Payment integration requirements?',
 80);