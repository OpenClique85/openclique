-- =============================================================================
-- COO PLAYBOOK SYSTEM - Extend categories and seed operational templates
-- =============================================================================

-- Step 1: Drop existing category constraint
ALTER TABLE public.system_docs DROP CONSTRAINT system_docs_category_check;

-- Step 2: Add new constraint with expanded categories
ALTER TABLE public.system_docs ADD CONSTRAINT system_docs_category_check 
CHECK (category = ANY (ARRAY[
  -- Original categories
  'flow'::text, 'state_machine'::text, 'rule'::text, 'guardrail'::text, 
  'security'::text, 'ops'::text, 'estimation'::text, 'product'::text,
  -- New COO Playbook categories
  'playbook'::text, 'process'::text, 'sla'::text, 'metrics'::text
]));

-- Step 3: Seed COO Playbook Documentation Templates

-- 1. Daily Ops Checklist
INSERT INTO public.system_docs (
  category, subcategory, title, slug, description, content_markdown, mermaid_diagram, 
  version, is_published, sort_order
) VALUES (
  'playbook', 'daily_ops', 'Daily Operations Checklist',
  'daily-ops-checklist',
  'Morning and evening operational tasks for platform management',
  '## Daily Operations Checklist

### Morning Routine (9:00 AM)

#### Support & Moderation
- [ ] Review overnight support tickets (priority: urgent first)
- [ ] Check abuse/safety flags from automated systems
- [ ] Review pending creator/sponsor applications
- [ ] Scan WhatsApp groups for escalations

#### Quest Operations
- [ ] Verify today''s quest capacity vs signups
- [ ] Check for standby users needing confirmation
- [ ] Review no-show patterns from yesterday''s quests
- [ ] Confirm creator attendance for hosted quests

#### Partner Management
- [ ] Review pending sponsor proposals
- [ ] Check creator payout queue
- [ ] Follow up on stale partnership conversations

### Evening Routine (6:00 PM)

#### Wrap-Up
- [ ] Process quest completions and XP awards
- [ ] Review feedback from completed quests
- [ ] Update squad recommendations queue
- [ ] Prepare tomorrow''s priority list

#### Metrics Review
- [ ] Check daily signups vs target
- [ ] Review completion rate
- [ ] Note any SLA breaches
- [ ] Document escalations in ops log',
  NULL, 1, true, 1
);

-- 2. Escalation Flowchart
INSERT INTO public.system_docs (
  category, subcategory, title, slug, description, content_markdown, mermaid_diagram, 
  version, is_published, sort_order
) VALUES (
  'playbook', 'escalation', 'Escalation Flowchart',
  'escalation-flowchart',
  'Decision tree for handling support escalations and crisis situations',
  '## Escalation Protocol

### Tier 1: Standard Support (Response: < 24h)
- General questions about quests
- Account access issues
- Feature requests
- Feedback submission

### Tier 2: Priority Support (Response: < 4h)
- Payment/billing issues
- Creator/sponsor onboarding blockers
- Quest cancellation requests
- Harassment reports

### Tier 3: Urgent (Response: < 1h)
- Safety concerns at live events
- Platform outage reports
- Legal/compliance issues
- Media inquiries

### Tier 4: Crisis (Response: Immediate)
- Physical safety emergency
- Data breach suspected
- Major PR incident
- Legal threat received

### Escalation Contacts
| Tier | Primary | Backup |
|------|---------|--------|
| 1-2 | Support Lead | COO |
| 3 | COO | CEO |
| 4 | CEO + Legal | Board notification |',
  'graph TD
    A[Issue Received] --> B{Safety Risk?}
    B -->|Yes| C[Tier 4: Crisis]
    B -->|No| D{Payment/Legal?}
    D -->|Yes| E[Tier 3: Urgent]
    D -->|No| F{Blocking User?}
    F -->|Yes| G[Tier 2: Priority]
    F -->|No| H[Tier 1: Standard]
    C --> I[Immediate Response]
    E --> J[1 Hour Response]
    G --> K[4 Hour Response]
    H --> L[24 Hour Response]',
  1, true, 2
);

-- 3. Partner Onboarding Process
INSERT INTO public.system_docs (
  category, subcategory, title, slug, description, content_markdown, mermaid_diagram, 
  version, is_published, sort_order
) VALUES (
  'process', 'partner_management', 'Partner Onboarding Process',
  'partner-onboarding-process',
  'Step-by-step guide for onboarding creators and sponsors',
  '## Partner Onboarding Process

### Creator Onboarding (7-day journey)

#### Day 1: Application Review
1. Review application within 24h of submission
2. Check social media presence and content quality
3. Verify identity and location (Austin-based)
4. Decision: Approve, Request Info, or Decline

#### Day 2-3: Welcome & Setup
1. Send welcome email with portal access
2. Schedule 15-min onboarding call
3. Complete profile setup together
4. Review creator guidelines and policies

#### Day 4-5: First Quest
1. Assign first quest as co-host (shadow an experienced creator)
2. Review quest creation workflow
3. Set up payout information

#### Day 6-7: Go Live
1. Approve first solo quest proposal
2. Add to creator WhatsApp group
3. Set 30-day check-in reminder

### Sponsor Onboarding (14-day journey)

#### Week 1: Discovery & Setup
1. Sales handoff: Review partnership terms
2. Create sponsor portal account
3. Add venues and rewards catalog
4. Review brand guidelines

#### Week 2: Launch
1. Publish first sponsored quest or listing
2. Connect with creator matches
3. Review analytics dashboard
4. Schedule monthly review cadence',
  'graph LR
    subgraph Creator
    A1[Apply] --> A2[Review 24h]
    A2 --> A3[Onboard Call]
    A3 --> A4[Shadow Quest]
    A4 --> A5[Go Live]
    end
    subgraph Sponsor
    B1[Sales Close] --> B2[Portal Setup]
    B2 --> B3[Venue/Rewards]
    B3 --> B4[First Campaign]
    B4 --> B5[Monthly Review]
    end',
  1, true, 1
);

-- 4. Quest Lifecycle (Ops View)
INSERT INTO public.system_docs (
  category, subcategory, title, slug, description, content_markdown, mermaid_diagram, 
  version, is_published, sort_order
) VALUES (
  'process', 'daily_ops', 'Quest Lifecycle - Operations View',
  'quest-lifecycle-ops',
  'Operational state management for quests from creation to completion',
  '## Quest Lifecycle - Operations View

### States & Actions

| State | Trigger | Ops Action Required |
|-------|---------|---------------------|
| Draft | Creator saves | None (creator workflow) |
| Pending Review | Creator submits | Review within 24h |
| Published | Admin approves | Monitor signups |
| Full | Capacity reached | Manage standby list |
| In Progress | Quest time starts | Be available for issues |
| Completed | Quest time ends | Process completions |
| Cancelled | Creator/Admin cancels | Notify signups, refund if needed |

### Key Automations
- Auto-confirm: Standby users promoted when spots open
- Reminder emails: 24h and 2h before quest
- No-show detection: Mark absent users after check-in window
- XP awards: Triggered on completion status

### Manual Interventions
- Override capacity for special cases
- Force-complete stuck quests
- Merge or split squads
- Handle disputes between users

### Red Flags to Monitor
- Quest with 0 signups 24h before start
- Creator unresponsive to messages
- High standby-to-capacity ratio (>50%)
- Repeat no-shows from same user',
  'stateDiagram-v2
    [*] --> Draft
    Draft --> PendingReview: Submit
    PendingReview --> Published: Approve
    PendingReview --> Draft: Request Changes
    Published --> Full: Capacity Reached
    Full --> Published: Spot Opens
    Published --> InProgress: Quest Time
    Full --> InProgress: Quest Time
    InProgress --> Completed: End Time
    Published --> Cancelled: Cancel
    Full --> Cancelled: Cancel
    Completed --> [*]
    Cancelled --> [*]',
  1, true, 2
);

-- 5. Support Ticket Triage
INSERT INTO public.system_docs (
  category, subcategory, title, slug, description, content_markdown, mermaid_diagram, 
  version, is_published, sort_order
) VALUES (
  'playbook', 'support_runbook', 'Support Ticket Triage Guide',
  'support-ticket-triage',
  'Priority classification and response time guidelines for support tickets',
  '## Support Ticket Triage Guide

### Priority Levels

#### Critical (P0)
**Response: 15 minutes | Resolution: 1 hour**
- Active safety incident
- Platform-wide outage
- Data breach or security incident
- Legal cease and desist

#### High (P1)
**Response: 1 hour | Resolution: 4 hours**
- User locked out before quest
- Payment failed, user upset
- Harassment report
- Creator no-show (live quest)

#### Medium (P2)
**Response: 4 hours | Resolution: 24 hours**
- Feature not working as expected
- Refund request
- Partner onboarding blocker
- Negative feedback requiring response

#### Low (P3)
**Response: 24 hours | Resolution: 72 hours**
- General questions
- Feature suggestions
- Account settings changes
- Content moderation (non-urgent)

### Triage Checklist
1. Read full ticket and any attachments
2. Check user history (repeat issues?)
3. Assign priority based on impact + urgency
4. Tag with issue category
5. Route to appropriate handler
6. Set SLA reminder',
  NULL, 1, true, 3
);

-- 6. Crisis Response Playbook
INSERT INTO public.system_docs (
  category, subcategory, title, slug, description, content_markdown, mermaid_diagram, 
  version, is_published, sort_order
) VALUES (
  'playbook', 'crisis_response', 'Crisis Response Playbook',
  'crisis-response-playbook',
  'Emergency procedures for platform crises and safety incidents',
  '## Crisis Response Playbook

### Activation Criteria
A crisis is declared when any of the following occur:
- Physical harm or threat at an OpenClique event
- Platform security breach affecting user data
- Negative media coverage gaining traction
- Legal action initiated against the company
- Key partner publicly disassociates

### Immediate Actions (First 30 Minutes)

#### 1. Assess & Contain
- Gather facts: What happened? Who is affected?
- Contain spread: Pause related features if needed
- Secure evidence: Screenshots, logs, communications

#### 2. Notify Leadership
- CEO: All crises
- Legal: Legal threats, data breaches
- Board: Reputation or financial impact

#### 3. Internal Communication
- Ops team: Briefing on what to say/not say
- Support team: Prepare for volume increase
- All hands: If company-wide impact

### Response Templates

#### Safety Incident
"We are aware of an incident at [Quest Name] and are working with local authorities. The safety of our community is our top priority."

#### Data Breach
"We have identified unauthorized access to [scope]. We are investigating and will notify affected users directly."

### Post-Crisis (48-72 Hours)
- Conduct incident retrospective
- Update playbooks based on learnings
- Follow up with affected parties
- Communicate resolution to stakeholders',
  NULL, 1, true, 4
);

-- 7. Metrics Dashboard Guide
INSERT INTO public.system_docs (
  category, subcategory, title, slug, description, content_markdown, mermaid_diagram, 
  version, is_published, sort_order
) VALUES (
  'metrics', 'reporting', 'Metrics Dashboard Guide',
  'metrics-dashboard-guide',
  'KPI definitions, thresholds, and monitoring guidance',
  '## Metrics Dashboard Guide

### Primary KPIs

#### 1. Quest Completion Rate
**Definition**: (Completed signups / Total signups) x 100
**Target**: > 85%
**Alert Threshold**: < 75%

Why it matters: Indicates platform reliability and user commitment.

#### 2. Squad Return Rate
**Definition**: Percentage of users who join another quest within 30 days
**Target**: > 40%
**Alert Threshold**: < 25%

Why it matters: Core indicator of product-market fit.

#### 3. Net Promoter Score (NPS)
**Definition**: Promoters minus Detractors (from post-quest survey)
**Target**: > 50
**Alert Threshold**: < 30

Why it matters: Leading indicator of organic growth.

#### 4. Support Response Time
**Definition**: Median time from ticket creation to first response
**Target**: < 4 hours (during business hours)
**Alert Threshold**: > 8 hours

Why it matters: User trust and satisfaction.

### Secondary Metrics

| Metric | Target | Alert |
|--------|--------|-------|
| Weekly Active Users | +5% WoW | -10% WoW |
| Creator Quest Rate | 2+ quests/mo | < 1 quest/mo |
| Sponsor Renewal Rate | > 70% | < 50% |
| App Crash Rate | < 0.1% | > 1% |

### Dashboard Access
- Real-time: Admin Console - Analytics
- Weekly Report: Sent Mondays 9 AM
- Monthly Deep Dive: First Friday of month',
  NULL, 1, true, 1
);

-- 8. SLA Definitions
INSERT INTO public.system_docs (
  category, subcategory, title, slug, description, content_markdown, mermaid_diagram, 
  version, is_published, sort_order
) VALUES (
  'sla', 'response_times', 'SLA Definitions & Response Times',
  'sla-definitions',
  'Service Level Agreement definitions for support, partners, and platform uptime',
  '## SLA Definitions

### Support SLAs

| Priority | First Response | Resolution Target | Escalation Trigger |
|----------|---------------|-------------------|-------------------|
| P0 Critical | 15 min | 1 hour | Immediate |
| P1 High | 1 hour | 4 hours | After 2 hours |
| P2 Medium | 4 hours | 24 hours | After 12 hours |
| P3 Low | 24 hours | 72 hours | After 48 hours |

**Business Hours**: Monday-Friday 9 AM - 6 PM CT
**After-Hours Coverage**: P0/P1 only via on-call rotation

### Partner SLAs

#### Creator Support
- Application review: 48 hours
- Quest approval: 24 hours
- Payout processing: 5 business days
- Dispute resolution: 72 hours

#### Sponsor Support
- Onboarding completion: 14 days
- Campaign launch: 7 days from assets received
- Analytics report: Monthly by 5th
- Contract renewal: 30 days notice

### Platform Uptime

| Component | Target | Measurement |
|-----------|--------|-------------|
| Web App | 99.5% | Monthly |
| API | 99.9% | Monthly |
| Payments | 99.99% | Monthly |
| Notifications | 99% | Weekly |

### SLA Breach Protocol
1. Auto-alert sent to ops lead
2. Document reason for breach
3. Notify affected user/partner
4. Root cause analysis within 24h
5. Update process if systemic issue',
  NULL, 1, true, 1
);