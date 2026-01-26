
# AI-Assisted Quest Creation + Admin Review Pipeline

## Overview

This plan implements an AI-powered Quest Creation flow with a "Draft → Review → Submit to Admin" pipeline. The AI acts as a co-pilot that suggests content while creators always maintain control. Quests cannot be published by creators - they must be submitted to Admin for review and publishing.

---

## Current State Analysis

### What Already Exists
- **`quests` table**: Contains most required fields including `review_status` enum (`draft`, `pending_review`, `needs_changes`, `approved`, `rejected`), `admin_notes`, `submitted_at`, `published_at`
- **`quest_tags` + `quest_tag_map` tables**: Normalized tag system already in place
- **QuestBuilder wizard**: 9-step wizard with Basics, Timing, Experience, Objectives, Expectations, Safety, Capacity, Media, Review
- **Creator Dashboard**: Exists at `/creator` with quest stats and creation flow
- **Admin QuestReviewModal**: Full review flow with approve/reject/changes-requested + notifications
- **`infer-traits` edge function**: Pattern for Lovable AI integration already established
- **Notification system**: Already sends notifications on review status changes

### What Needs to Be Built
1. **New database tables**: `quest_objectives`, `quest_roles`, `quest_constraints`, `quest_personality_affinity`
2. **User preference fields** in `profiles.preferences`: alcohol preference, physical/social preferences, age
3. **AI Draft Generation**: Edge function + UI for generating quest content
4. **Constraints Step** in wizard: Hard filter fields (alcohol, age, intensity, etc.)
5. **Creator Quest List** page with status tabs
6. **Admin Review Queue** improvements: Priority, filtering, constraint display
7. **Feed Filtering Logic**: Hard filters + soft affinity scoring

---

## Phase 1: Database Schema Extensions

### 1.1 New Tables

```text
quest_objectives
├── id (uuid, pk)
├── quest_id (uuid, fk → quests.id ON DELETE CASCADE)
├── objective_order (int)
├── objective_text (text)
├── objective_type (enum: checkin, photo, qr, task, discussion, purchase_optional, travel)
├── completion_rule (enum: all_members, majority, any_member, per_member)
├── proof_type (enum: none, photo, qr, geo, text_confirmation)
├── is_required (boolean, default true)
├── ai_generated (boolean, default false)

quest_roles
├── id (uuid, pk)
├── quest_id (uuid, fk → quests.id ON DELETE CASCADE)
├── role_name (enum: Navigator, Timekeeper, Vibe Curator, Photographer, Connector, Wildcard)
├── role_description (text)
├── ai_generated (boolean, default false)

quest_constraints
├── id (uuid, pk)
├── quest_id (uuid, fk → quests.id ON DELETE CASCADE)
├── alcohol (enum: none, optional, primary)
├── age_requirement (enum: all_ages, 18_plus, 21_plus)
├── physical_intensity (enum: low, medium, high)
├── social_intensity (enum: chill, moderate, high)
├── noise_level (enum: quiet, moderate, loud)
├── time_of_day (enum: morning, afternoon, evening, late_night, flex)
├── indoor_outdoor (enum: indoor, outdoor, mixed)
├── accessibility_level (enum: unknown, wheelchair_friendly, not_wheelchair_friendly, mixed)
├── budget_level (enum: free, low, medium, high, mixed)

quest_personality_affinity
├── id (uuid, pk)
├── quest_id (uuid, fk → quests.id ON DELETE CASCADE)
├── trait_key (text) - references trait_library slugs
├── trait_weight (int, 0-100)
├── explanation (text) - "Works best for people who..."
├── ai_generated (boolean, default false)
```

### 1.2 Extend `quests` Table

```text
ADD COLUMNS:
├── short_teaser (text) - 2-3 sentence hook
├── event_source (enum: manual, eventbrite)
├── price_type (enum: free, paid, mixed)
├── estimated_cost_min (numeric)
├── estimated_cost_max (numeric)
├── safety_level (enum: public_only, mixed, private_ok_with_host)
├── creator_notes (text) - private admin-only notes from creator
├── ai_generated (boolean, default false)
├── ai_version (text)
├── ai_draft_applied_at (timestamptz)
```

### 1.3 Extend `profiles.preferences` JSON Schema

Add to the existing preferences structure:

```text
matching_filters:
├── alcohol_preference (enum: no_alcohol, ok_optional, likes_drinking)
├── physical_preference (enum: low, medium, high, any)
├── social_preference (enum: chill, moderate, high, any)
├── accessibility_needed (boolean)
├── birthdate (date) - for age gating
```

### 1.4 RLS Policies

- Creators can CRUD their own quests while `review_status` IN ('draft', 'needs_changes')
- Creators can only change `review_status` to 'pending_review' (submit)
- Admins can view/edit all quests and change any status
- Users can only view quests where `status = 'open'` AND `review_status = 'approved'`

---

## Phase 2: AI Draft Generation Edge Function

### 2.1 New Edge Function: `generate-quest-draft`

Uses Lovable AI (Gemini 3 Flash) to generate:
- `short_teaser` (2-3 sentences)
- `full_description` (long-form description)
- 4-8 `quest_objectives` with proof suggestions
- Suggested `quest_roles`
- Suggested tags (mapped to `quest_tags`)
- `quest_personality_affinity` with explanations

**Input**: Basic quest info (title, category, location, constraints, date)

**Output**: JSON with all AI-generated content marked as `ai_generated: true`

**Guardrails**:
- Prompt instructs tentative language
- All outputs labeled as drafts
- Nothing saved until creator clicks "Apply Draft"

### 2.2 Pattern Following `infer-traits`

- Rate limiting (5 requests/hour per user)
- Prompt versioning for reproducibility
- Audit logging to `ai_inference_log`
- Error handling with user-friendly messages

---

## Phase 3: Creator UI Updates

### 3.1 Creator Dashboard Enhancements

**My Quests Tab System**:

```text
Tabs: Drafts | Submitted | Needs Changes | Published | Archived
├── Status pill: Draft / Submitted (Admin Review) / Needs Changes / Published / Rejected
├── Quick actions: Edit, Submit, Withdraw
├── Admin notes banner when status = needs_changes
```

### 3.2 Quest Builder Wizard Updates

**Step 1: Basics** (enhanced)
- Title, Category (multi-select tags), City, Location
- Date/time, Group size min/max, Budget/price type
- Event source toggle: Manual / Eventbrite URL
- "Import from Eventbrite" button (existing flow)

**Step 2: Constraints** (NEW - replaces current Safety step position)
- Alcohol: None / Optional / Primary
- Age requirement: All ages / 18+ / 21+
- Physical intensity: Low / Medium / High
- Social intensity: Chill / Moderate / High-energy
- Noise level: Quiet / Moderate / Loud
- Indoor/Outdoor: Indoor / Outdoor / Mixed
- Accessibility: Unknown / Wheelchair-friendly / Not wheelchair-friendly / Mixed
- Safety setting: Public venues only / Mixed / Private OK with host

**Step 3: AI Draft** (NEW)
- Button: "Generate Draft with AI"
- Skip option: "Skip and write manually"
- AI disclaimer: "AI suggestions are editable. Nothing is published until you submit and an admin approves."
- Each section shows: Accept / Edit / Remove / Regenerate buttons
- Sections: Teaser, Description, Objectives (with proof types), Roles, Tags, "Works best for..." affinities
- "Apply Draft to My Quest" button

**Step 4: Review & Submit** (enhanced)
- Preview card exactly as users will see
- Attestation checkbox: "I reviewed this quest and it reflects my intent."
- Buttons: "Save as Draft" / "Submit to Admin Review"
- Lock editing after submission (show "Withdraw submission" option)

### 3.3 Needs Changes State

- Banner: "Changes requested - Admin left notes below"
- Show admin_notes prominently
- "Save updates" / "Resubmit to Admin Review" buttons
- Restore editability

---

## Phase 4: Admin Control Room Enhancements

### 4.1 Review Queue Page

Navigate via: Admin → Quests Manager → Quest Approvals

**Queue List**:
- Filter by: Submitted / Needs Changes / All pending
- Sort by: Submitted date, Priority
- Priority badges (auto-calculated or manual)
- Creator info, submission date, revision count

**Quest Detail View** (in modal, existing + enhanced):
- All basic fields (existing)
- NEW: Constraints section with icons
- NEW: Personality affinities section
- NEW: AI-generated indicator badge
- NEW: Objectives list with proof types
- NEW: Suggested roles

**Actions** (existing):
- Approve (sets `review_status = 'approved'`)
- Approve & Publish (also sets `status = 'open'`, `published_at`)
- Request Changes (requires admin_notes)
- Reject (requires admin_notes)

### 4.2 Notifications (existing, already works)

- When submitted: Admin sees badge in Control Room
- When changes requested/rejected/published: Creator gets notification + email

---

## Phase 5: Feed Filtering & Matching

### 5.1 Hard Filters (Quest Discovery)

Apply BEFORE ranking in `useQuests` hook:

```text
IF user.preferences.matching_filters.alcohol_preference = 'no_alcohol'
   THEN EXCLUDE quests WHERE constraints.alcohol = 'primary'
   
IF user.preferences.matching_filters.alcohol_preference = 'no_alcohol' OR 'ok_optional'
   THEN optionally deprioritize 'primary'

IF user.age < 21 THEN EXCLUDE quests WHERE constraints.age_requirement = '21_plus'
IF user.age < 18 THEN EXCLUDE quests WHERE constraints.age_requirement = '18_plus'

IF user.preferences.matching_filters.accessibility_needed
   THEN EXCLUDE quests WHERE constraints.accessibility_level = 'not_wheelchair_friendly'
```

### 5.2 Soft Affinity Scoring

Score formula based on:
- `quest_personality_affinity` weights matched against user's `inferred_traits`
- `quest_tag_map` weights matched against user's interest tags
- Higher weight = better fit

**Quest Card Enhancement**:
- Show 1-line "Why this fits" from matching `personality_affinity.explanation`

### 5.3 Implementation

New hook: `useFilteredQuests(userPreferences)` that:
1. Fetches quests WHERE `status = 'open'`
2. Joins `quest_constraints` and `quest_personality_affinity`
3. Applies hard filters client-side (or via RPC for efficiency)
4. Ranks by affinity score
5. Returns sorted quests with "why this fits" explanation

---

## Phase 6: Files to Create/Modify

### New Files

```text
supabase/functions/generate-quest-draft/index.ts    - AI draft generation
src/components/quest-builder/steps/ConstraintsStep.tsx  - Hard filters UI
src/components/quest-builder/steps/AIDraftStep.tsx      - AI generation UI
src/components/creator/CreatorQuestList.tsx             - My Quests with tabs
src/pages/CreatorQuests.tsx                             - My Quests page
src/hooks/useFilteredQuests.ts                          - Feed filtering logic
```

### Modified Files

```text
src/components/quest-builder/types.ts         - Add constraint/objective types
src/components/quest-builder/steps/index.ts   - Export new steps
src/pages/QuestBuilder.tsx                    - Integrate new steps
src/components/admin/QuestsManager.tsx        - Review queue improvements
src/components/admin/QuestReviewModal.tsx     - Show constraints/affinities
src/hooks/useQuests.ts                        - Add filtering logic
src/types/profile.ts                          - Add matching_filters type
```

---

## Microcopy Reference

All UI copy follows the exact wording from your prompt:

**Creator Studio Header**: "Build quests fast. You're always in control."

**Step 3 AI Draft Header**: "Draft with AI (optional)" / "We'll generate a strong first version. You approve everything."

**AI Disclaimer**: "AI suggestions are editable. Nothing is published until you submit and an admin approves."

**Needs Changes Banner**: "Changes requested - Admin left notes below. Update your quest and resubmit for review."

**Attestation Checkbox**: "I reviewed this quest and it reflects my intent."

---

## Technical Decisions

### Schema Alignment with Existing

- Use existing `review_status` enum (already has `draft`, `pending_review`, `needs_changes`, `approved`, `rejected`)
- Use existing `quest_status` enum for publish state (`draft`, `open`, `closed`, etc.)
- Don't duplicate: Use `status` for visibility, `review_status` for workflow
- Extend rather than replace: Add new columns to `quests` table

### AI Integration

- Use Lovable AI via `generate-quest-draft` edge function
- Model: `google/gemini-3-flash-preview` (fast, balanced)
- Follow `infer-traits` pattern for rate limiting, logging, error handling

### Filtering Implementation

- Hard filters via SQL WHERE clauses (or RPC for complex logic)
- Soft scoring via client-side ranking after fetch
- Future optimization: PostgreSQL function for scoring

---

## Implementation Order

1. **Database migrations** - Create new tables, enums, extend quests
2. **AI edge function** - `generate-quest-draft` with Lovable AI
3. **ConstraintsStep + AIDraftStep** - New wizard steps
4. **QuestBuilder integration** - Wire new steps into wizard
5. **CreatorQuestList** - My Quests page with status tabs
6. **Admin enhancements** - Show constraints/affinities in review
7. **Feed filtering** - Hard filters + affinity scoring
8. **User preference fields** - Add matching_filters to profile

---

## Risk Mitigation

- **AI hallucination**: All outputs clearly marked as drafts, creator must approve
- **RLS security**: Strict policies on quest editing based on review_status
- **Performance**: Lazy-load constraints/affinities, paginate quest lists
- **Backward compatibility**: Existing quests work without constraints (nullable fields)
