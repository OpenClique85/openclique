
# Pilot Manager Implementation Plan

## Overview

This implementation creates a complete Pilot Manager section in the admin console to track, analyze, and export metrics for structured pilot programs. The first pilot "Prove Retention & Growth" will run from February 1-28, 2025.

---

## Part 1: Database Schema

### New Tables

**Table 1: `pilot_programs`**

Stores pilot program definitions with time bounds and success criteria.

```sql
CREATE TABLE public.pilot_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  hypothesis TEXT,
  success_criteria JSONB DEFAULT '[]',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
  org_id UUID REFERENCES public.organizations(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Admin-only access
ALTER TABLE public.pilot_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage pilot programs" ON public.pilot_programs FOR ALL USING (public.is_admin());
```

**Table 2: `pilot_notes`**

Stores observations, issues, decisions, and milestones during pilots.

```sql
CREATE TABLE public.pilot_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_id UUID NOT NULL REFERENCES public.pilot_programs(id) ON DELETE CASCADE,
  note_type TEXT DEFAULT 'observation' CHECK (note_type IN ('observation', 'issue', 'decision', 'milestone', 'risk')),
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  related_quest_id UUID REFERENCES public.quests(id),
  related_user_id UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Admin-only access
ALTER TABLE public.pilot_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage pilot notes" ON public.pilot_notes FOR ALL USING (public.is_admin());
```

**Table 3: `pilot_templates`**

Stores reusable pilot configurations for future programs.

```sql
CREATE TABLE public.pilot_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  default_duration_days INTEGER DEFAULT 28,
  hypothesis_template TEXT,
  success_criteria_template JSONB DEFAULT '[]',
  suggested_metrics TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Admin-only access
ALTER TABLE public.pilot_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage pilot templates" ON public.pilot_templates FOR ALL USING (public.is_admin());
```

### Database Function: `get_pilot_metrics`

Time-gated metrics calculation for a specific pilot.

```sql
CREATE OR REPLACE FUNCTION get_pilot_metrics(p_pilot_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_pilot RECORD;
  v_start TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
  v_new_users INTEGER;
  v_signups INTEGER;
  v_completed INTEGER;
  v_squads_formed INTEGER;
  v_invites_created INTEGER;
  v_invites_redeemed INTEGER;
  v_repeat_users INTEGER;
  v_cliques INTEGER;
  v_avg_rating NUMERIC;
  v_avg_belonging NUMERIC;
  v_feedback_count INTEGER;
BEGIN
  SELECT * INTO v_pilot FROM pilot_programs WHERE id = p_pilot_id;
  IF v_pilot IS NULL THEN
    RETURN jsonb_build_object('error', 'Pilot not found');
  END IF;

  v_start := v_pilot.start_date::timestamptz;
  v_end := (v_pilot.end_date + 1)::timestamptz;

  -- Engagement metrics
  SELECT COUNT(*) INTO v_new_users FROM profiles 
  WHERE created_at >= v_start AND created_at < v_end;

  SELECT COUNT(*) INTO v_signups FROM quest_signups 
  WHERE signed_up_at >= v_start AND signed_up_at < v_end;

  SELECT COUNT(*) INTO v_completed FROM quest_signups 
  WHERE status = 'completed' AND updated_at >= v_start AND updated_at < v_end;

  SELECT COUNT(*) INTO v_squads_formed FROM quest_squads 
  WHERE created_at >= v_start AND created_at < v_end;

  -- Growth metrics
  SELECT COUNT(*) INTO v_invites_created FROM friend_invites 
  WHERE created_at >= v_start AND created_at < v_end;

  SELECT COUNT(*) INTO v_invites_redeemed FROM friend_invites 
  WHERE redeemed_at >= v_start AND redeemed_at < v_end;

  -- Retention metrics
  SELECT COUNT(DISTINCT user_id) INTO v_repeat_users 
  FROM quest_signups 
  WHERE signed_up_at >= v_start AND signed_up_at < v_end
  GROUP BY user_id HAVING COUNT(*) >= 2;

  SELECT COUNT(*) INTO v_cliques FROM squads 
  WHERE created_at >= v_start AND created_at < v_end;

  -- Satisfaction metrics
  SELECT AVG(rating_1_5), AVG(belonging_delta), COUNT(*)
  INTO v_avg_rating, v_avg_belonging, v_feedback_count
  FROM feedback 
  WHERE submitted_at >= v_start AND submitted_at < v_end;

  RETURN jsonb_build_object(
    'pilot', jsonb_build_object(
      'id', v_pilot.id,
      'name', v_pilot.name,
      'start_date', v_pilot.start_date,
      'end_date', v_pilot.end_date,
      'status', v_pilot.status,
      'hypothesis', v_pilot.hypothesis,
      'success_criteria', v_pilot.success_criteria
    ),
    'engagement', jsonb_build_object(
      'new_users', COALESCE(v_new_users, 0),
      'quest_signups', COALESCE(v_signups, 0),
      'quests_completed', COALESCE(v_completed, 0),
      'squads_formed', COALESCE(v_squads_formed, 0),
      'completion_rate', CASE WHEN v_signups > 0 
        THEN ROUND((v_completed::numeric / v_signups) * 100, 1) ELSE 0 END
    ),
    'growth', jsonb_build_object(
      'friend_invites_created', COALESCE(v_invites_created, 0),
      'friend_invites_redeemed', COALESCE(v_invites_redeemed, 0),
      'referral_rate', CASE WHEN v_invites_created > 0 
        THEN ROUND((v_invites_redeemed::numeric / v_invites_created) * 100, 1) ELSE 0 END,
      'k_factor', CASE WHEN v_new_users > 0 
        THEN ROUND(v_invites_redeemed::numeric / v_new_users, 2) ELSE 0 END
    ),
    'retention', jsonb_build_object(
      'repeat_users', COALESCE(v_repeat_users, 0),
      'cliques_formed', COALESCE(v_cliques, 0),
      'repeat_rate', CASE WHEN v_new_users > 0 
        THEN ROUND((v_repeat_users::numeric / v_new_users) * 100, 1) ELSE 0 END
    ),
    'satisfaction', jsonb_build_object(
      'avg_rating', ROUND(COALESCE(v_avg_rating, 0), 2),
      'avg_belonging_delta', ROUND(COALESCE(v_avg_belonging, 0), 2),
      'feedback_count', COALESCE(v_feedback_count, 0)
    ),
    'generated_at', now()
  );
END;
$$;
```

### Seed Data: Pilot 1

```sql
INSERT INTO pilot_programs (name, slug, description, hypothesis, success_criteria, start_date, end_date, status)
VALUES (
  'Pilot 1: Prove Retention & Growth',
  'pilot-1-retention-growth',
  'First structured pilot to validate core product assumptions with UT Austin student organizations. Track retention, referral, and satisfaction metrics.',
  'If we provide structured, low-pressure quest experiences with small group formation, users will return for multiple quests and recruit their friends.',
  '[
    {"metric": "Week 1 Retention", "target": "30%", "description": "Users who sign up for 2nd quest within 7 days"},
    {"metric": "Friend Referral Rate", "target": "20%", "description": "Users who invite at least one friend"},
    {"metric": "Repeat Quest Rate", "target": "40%", "description": "Users who complete 2+ quests"},
    {"metric": "Average Rating", "target": "4.0+", "description": "Quest satisfaction rating"}
  ]'::jsonb,
  '2025-02-01',
  '2025-02-28',
  'planned'
);
```

---

## Part 2: Admin Navigation Update

### Add "Pilots" Section to AdminSectionNav.tsx

Add a new section with the Flask/Beaker icon between "Approvals & Ops" and "Squads & Cliques":

```typescript
{
  id: 'pilots',
  label: 'Pilots',
  icon: <FlaskConical className="h-4 w-4" />,
  tabs: [
    { id: 'pilot-programs', label: 'Active Pilots' },
    { id: 'pilot-analytics', label: 'Pilot Analytics' },
    { id: 'pilot-templates', label: 'Templates' },
    { id: 'pilot-notes', label: 'Notes & Issues' },
  ],
},
```

---

## Part 3: Frontend Components

### Component Structure

```
src/components/admin/pilots/
├── index.ts                      # Barrel exports
├── PilotProgramsManager.tsx      # CRUD for pilots
├── PilotAnalyticsDashboard.tsx   # Time-gated metrics + charts
├── PilotNotesManager.tsx         # Notes/issues journal
├── PilotTemplatesManager.tsx     # Template CRUD
└── PilotVCExport.tsx            # VC-ready export generator
```

### Component 1: `PilotProgramsManager.tsx`

Main management interface for pilot programs.

**Features:**
- List all pilots with status badges (Planned/Active/Completed/Cancelled)
- Create new pilot with date picker, hypothesis, and success criteria
- Edit pilot details
- Status transitions with confirmation
- Progress indicator showing days elapsed vs total duration
- Quick link to pilot analytics dashboard
- "Create from Template" action

**UI Structure:**
- Header with "New Pilot" button
- Card grid showing each pilot with:
  - Name and date range
  - Status badge (color-coded)
  - Progress bar for active pilots
  - Quick stats preview (if data exists)
  - Action buttons (Edit, View Analytics, Archive)

### Component 2: `PilotAnalyticsDashboard.tsx`

Time-gated metrics dashboard with VC-ready visualizations.

**Header Section:**
- Pilot selector dropdown (defaults to most recent active)
- Date range display with calendar icon
- Days elapsed / Days remaining counter
- Status badge
- "Export VC Report" button

**Key Metrics Cards (4-column grid):**
| Card | Metric | Icon |
|------|--------|------|
| New Users | Users created during pilot | Users |
| Quest Signups | Signups during pilot | UserCheck |
| Completion Rate | Completed / Signups % | TrendingUp |
| Friend Referrals | Redeemed invites | UserPlus |

**Detailed Sections:**

1. **Engagement Panel**
   - Quest signups chart (daily trend using Recharts)
   - Squad formation rate
   - Activity breakdown

2. **Retention Panel**
   - Repeat user count and percentage
   - Week-over-week retention (if multi-week pilot)
   - Clique formation rate

3. **Growth Panel**
   - Friend invite funnel visualization
   - K-factor calculation with explanation
   - Referral rate percentage

4. **Satisfaction Panel**
   - Average rating with star display
   - Belonging delta with +/- indicator
   - Feedback response count

5. **Success Criteria Tracker**
   - Checklist of defined success criteria
   - Current value vs target for each
   - Pass/Fail indicators with color coding

### Component 3: `PilotNotesManager.tsx`

Journal interface for pilot observations.

**Features:**
- Note type filter tabs: All | Observations | Issues | Decisions | Milestones | Risks
- Create new note with:
  - Type selector (dropdown)
  - Content textarea (rich text not required, plain text is fine)
  - Tags input (comma-separated)
  - Optional quest/user link selectors
- Timeline view sorted by date (newest first)
- Note cards showing:
  - Type badge (color-coded)
  - Content preview
  - Tags as pills
  - Created date and author
  - Linked quest/user if any
- Search within notes
- Export notes as Markdown or JSON

### Component 4: `PilotTemplatesManager.tsx`

Template management for future pilots.

**Features:**
- List templates with name and description
- Create/Edit template with:
  - Name and description
  - Default duration (days)
  - Hypothesis template text
  - Success criteria template (repeatable fields)
  - Suggested metrics checkboxes
- "Use Template" action to create a new pilot from it
- Delete template with confirmation

### Component 5: `PilotVCExport.tsx`

Embedded within PilotAnalyticsDashboard as export functionality.

**Export Options:**
- Format: JSON (structured) or Markdown (readable)
- Include: Metrics, Notes, Success Criteria tracking
- Generate shareable report URL (optional future enhancement)

**JSON Export Structure:**
```json
{
  "report": {
    "title": "OpenClique Pilot Report",
    "pilot_name": "Pilot 1: Prove Retention & Growth",
    "period": "February 1-28, 2025",
    "generated_at": "2025-02-28T23:59:59Z"
  },
  "hypothesis": "If we provide structured...",
  "success_criteria": [
    {"metric": "Week 1 Retention", "target": "30%", "actual": "35%", "passed": true}
  ],
  "metrics": {
    "engagement": {...},
    "retention": {...},
    "growth": {...},
    "satisfaction": {...}
  },
  "notes": [
    {"date": "2025-02-05", "type": "milestone", "content": "First 50 users"}
  ]
}
```

---

## Part 4: Files Summary

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/admin/pilots/index.ts` | Barrel exports |
| `src/components/admin/pilots/PilotProgramsManager.tsx` | Pilot CRUD interface |
| `src/components/admin/pilots/PilotAnalyticsDashboard.tsx` | Metrics dashboard with charts |
| `src/components/admin/pilots/PilotNotesManager.tsx` | Notes journal |
| `src/components/admin/pilots/PilotTemplatesManager.tsx` | Template management |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/AdminSectionNav.tsx` | Add "Pilots" section with 4 tabs |
| `src/pages/Admin.tsx` | Add imports and route cases for pilot components |

### Database Migration

Single migration file creating:
- `pilot_programs` table with RLS
- `pilot_notes` table with RLS  
- `pilot_templates` table with RLS
- `get_pilot_metrics` RPC function
- Pilot 1 seed data

---

## Part 5: VC Metrics Framework

### What VCs Want to See

Based on consumer social/community investment criteria:

**1. Engagement (Activity Proof)**
- DAU/MAU during pilot
- Quest signup volume
- Completion rate
- Squad formation rate

**2. Retention (Stickiness Proof)**
- Week-over-week return rate
- Repeat quest participation
- Clique formation (persistent groups)

**3. Growth (Virality Proof)**
- K-factor (new users from referrals / total users)
- Friend invite redemption rate
- Organic vs referred ratio

**4. Satisfaction (Quality Proof)**
- Average quest rating (1-5)
- Belonging delta (pre/post connection feeling)
- "Would do again" percentage

**5. Cohort Analysis**
- Weekly signup cohorts
- Drop-off funnel by stage
- Retention curves

---

## Part 6: Implementation Order

1. **Database Migration** - Create tables, RPC, seed Pilot 1
2. **Admin Navigation** - Add Pilots section to AdminSectionNav
3. **PilotProgramsManager** - Basic CRUD with status management
4. **PilotNotesManager** - Notes journal with type filtering
5. **PilotAnalyticsDashboard** - Metrics cards + charts + export
6. **PilotTemplatesManager** - Template CRUD
7. **Admin.tsx Routing** - Connect all components
8. **Testing** - Verify time-gating works correctly

---

## Technical Notes

### Date Filtering Logic

All metrics queries use inclusive date ranges:
- `start_date::timestamptz` for the start
- `(end_date + 1)::timestamptz` for the end (to include the entire end date)

### Chart Library

Using existing Recharts dependency for:
- Line charts (daily trends)
- Bar charts (comparisons)
- Area charts (cohort visualization)

### Export Implementation

Follows the pattern from `DocsExportPanel.tsx`:
- Generate JSON blob
- Create download link
- Support Markdown alternative format

### Status Transitions

Pilots follow this lifecycle:
- `planned` → `active` (when start_date is reached or manually activated)
- `active` → `completed` (when end_date passes or manually completed)
- Any status → `cancelled` (manual action only)
