

# Extended Creator Flow & Quest Runtime Plan

## Summary

This plan extends the original creator flow improvements to include full quest runtime capabilities for creators - allowing them to manage live quests, form squads, approve them, and handle communications end-to-end while respecting privacy boundaries (no access to squad chats).

---

## Architecture Verification Results

### Current State Analysis

| Component | Current State | Gap |
|-----------|---------------|-----|
| **Edit Live Quests** | `canEdit()` restricts to `draft` or `needs_changes` only | Creators cannot edit published quests |
| **Quest Status vs Date** | `formatDateRange()` has timezone bugs; no "today/happening now" detection | Active quests may show as "past" incorrectly |
| **Squad Formation** | `DragDropSquadBuilder.tsx` exists but admin-only RLS | Creators have no squad formation UI |
| **Squad Approval** | Admin-only in `SquadWarmUpReview.tsx` | Creators cannot approve their own squads |
| **Squad Chat Access** | RLS: `squad_members` only can view messages | Correct - creators should NOT see chats |
| **Icebreaker Prompts** | `message_templates` table with `warm_up` category | Quest instances have `warm_up_prompt_id` - creators need UI to set this |
| **Creator Dashboard** | Shows stats only - no runtime controls | Missing signups view, squad management, communications |

### Database Architecture (Verified)

```text
quest_instances.status enum:
  draft → recruiting → locked → live → completed
                    ↘ cancelled
                    ↘ paused → archived

squads (quest_squads) have:
  - quest_id (links to quest_instance)
  - squad_name
  - formation_reason
  - locked_at

squad_chat_messages:
  - squad_id, sender_id, message
  - RLS: Only active squad_members can view (hidden_at IS NULL)
  - Creators CANNOT read chats (correct behavior)

message_templates:
  - category = 'warm_up' for icebreaker prompts
  - quest_instances.warm_up_prompt_id links to this
```

---

## Implementation Plan

### Phase 1: Enable Editing Live Quests

**Problem**: Creators cannot edit quests once published (status = 'open')

**Solution**: Allow limited editing of live quests

#### File: `src/pages/CreatorQuests.tsx`

Update `canEdit()` function:

```typescript
function canEdit(quest: Quest) {
  // Can edit drafts, needs_changes, AND live quests (with restrictions)
  return quest.review_status === 'draft' 
    || quest.review_status === 'needs_changes'
    || ['open', 'closed'].includes(quest.status || '');
}
```

#### File: `src/pages/QuestBuilder.tsx`

Add restricted editing mode for published quests:

- Allow editing: descriptions, images, meeting details, what_to_bring, safety_notes
- Disallow editing: dates, capacity (requires admin intervention)
- Show warning banner: "Editing a live quest - some fields are locked"

---

### Phase 2: Fix Today's Quests Classification

**Problem**: Quests happening today or right now may appear in "past" due to timezone issues

#### File: `src/hooks/useQuests.ts`

Fix `formatDateRange()` timezone handling:

```typescript
const formatDateRange = (start: string | null, end: string | null): string => {
  if (!start) return 'Date TBD';
  
  const startDate = new Date(start);
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  };
  
  const startStr = startDate.toLocaleDateString('en-US', options);
  
  if (!end) return startStr;
  
  const endDate = new Date(end);
  
  // Timezone-safe local date comparison
  const startLocal = startDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
  const endLocal = endDate.toLocaleDateString('en-CA');
  
  if (startLocal === endLocal) {
    return startStr;
  }
  
  const endStr = endDate.toLocaleDateString('en-US', options);
  return `${startStr} - ${endStr}`;
};
```

Add quest status helper:

```typescript
export function getQuestTemporalStatus(quest: Quest): 'upcoming' | 'today' | 'live' | 'past' {
  if (!quest.startDatetime) return 'upcoming';
  
  const now = new Date();
  const startDate = new Date(quest.startDatetime);
  const endDate = quest.endDatetime ? new Date(quest.endDatetime) : null;
  
  const todayStr = now.toLocaleDateString('en-CA');
  const startStr = startDate.toLocaleDateString('en-CA');
  
  if (endDate && now > endDate) return 'past';
  if (now >= startDate && (!endDate || now <= endDate)) return 'live';
  if (startStr === todayStr) return 'today';
  return 'upcoming';
}
```

---

### Phase 3: Creator Runtime Dashboard

**New Feature**: Add runtime controls for creators to manage their live quests

#### New File: `src/pages/CreatorQuestRuntime.tsx`

A dedicated page for creators to run their quests:

| Tab | Features |
|-----|----------|
| **Signups** | View who signed up, confirm/cancel signups, see status breakdown |
| **Squads** | Form squads, name them, assign members, set icebreaker prompts |
| **Communications** | Send group announcements (NOT view chats), set warm-up prompts |
| **Logistics** | Update meeting point details, post safety notes, add what-to-bring |

#### Route Addition:
```
/creator/quests/:questId/runtime → CreatorQuestRuntime.tsx
```

---

### Phase 4: Creator Squad Formation

**New Feature**: Allow creators to form squads for their quests

#### New Component: `src/components/creators/CreatorSquadBuilder.tsx`

Reuse the drag-drop logic from admin but with creator-scoped RLS:

| Feature | Creator Access |
|---------|----------------|
| View signups | Own quest only |
| Create squads | Own quest only |
| Assign members to squads | Own quest only |
| Set squad icebreaker prompt | Can pick from `message_templates` where `category = 'warm_up'` |
| View squad chats | **NO** - Privacy protected |
| Lock squads for warm-up | Yes |

#### Database Changes Required:

```sql
-- Add RLS policy for creators to manage their quest's squads
CREATE POLICY "Creators can manage their quest squads"
ON quest_squads
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM quests q
    WHERE q.id = quest_squads.quest_id
    AND q.creator_id = auth.uid()
  )
);

-- Add policy for creators to view signups on their quests
CREATE POLICY "Creators can view signups for their quests"
ON quest_signups
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM quests q
    WHERE q.id = quest_signups.quest_id
    AND q.creator_id = auth.uid()
  )
);
```

---

### Phase 5: Squad Approval for Creators

**New Feature**: Allow creators to approve squads after warm-up

#### New Component: `src/components/creators/CreatorSquadApproval.tsx`

Simplified version of admin's `SquadWarmUpReview.tsx`:

| Capability | Details |
|------------|---------|
| View warm-up progress | See % of members ready |
| View prompt responses | Aggregated view (not full chat) |
| Approve squad | Changes status from `ready_for_review` → `approved` |
| Unlock instructions | Triggers briefing visibility |

**Important**: Creator can only approve squads for their own quests.

#### Database Changes:

```sql
-- Allow creators to update squad status for their quests
CREATE POLICY "Creators can update their squad status"
ON quest_squads
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM quests q
    WHERE q.id = quest_squads.quest_id
    AND q.creator_id = auth.uid()
  )
)
WITH CHECK (
  -- Can only transition to approved from ready_for_review
  status IN ('approved', 'active')
);
```

---

### Phase 6: Icebreaker Prompt Management

**New Feature**: Creators can set/suggest icebreaker questions for their squads

#### Component: `src/components/creators/IcebreakerPromptPicker.tsx`

UI for creators to:
1. Browse existing warm-up prompts from `message_templates`
2. Assign a prompt to a specific squad
3. (Future) Create custom prompts (requires admin approval)

#### Integration Point:
- `quest_instances.warm_up_prompt_id` - set at instance level
- Or per-squad override in `quest_squads` table (may need schema addition)

---

### Phase 7: Creator Communication Tools

**New Feature**: Creators can send announcements without seeing squad chats

#### New Component: `src/components/creators/CreatorAnnouncements.tsx`

| Feature | How It Works |
|---------|--------------|
| Send to all signups | Creates notification for all confirmed users |
| Send to specific squad | Inserts system message in squad chat (creator cannot read responses) |
| Pre-event reminders | Template-based messages (what to bring, when to arrive) |
| Emergency updates | Urgent notifications with push delivery |

#### Chat Privacy Guarantee:

```typescript
// Message insertion uses system sender, not creator
const sendCreatorAnnouncement = async (squadId: string, message: string) => {
  await supabase.from('squad_chat_messages').insert({
    squad_id: squadId,
    sender_id: null, // System message
    sender_type: 'system', // Not 'user' or 'creator'
    message: `[Creator Announcement] ${message}`,
  });
};
```

Creators cannot call the SELECT on `squad_chat_messages` - the RLS policy ensures this:

```sql
-- Current policy (verified):
"Squad members can view chat messages"
  qual: EXISTS (
    SELECT 1 FROM squad_members sm
    WHERE sm.persistent_squad_id = squad_chat_messages.squad_id
    AND sm.user_id = auth.uid()
    AND sm.status = 'active'
  )
  AND hidden_at IS NULL
```

---

### Phase 8: Admin Override Access

**Requirement**: Admin can step in at any time to resolve issues

Already supported via existing policies:
- `"Admins can manage quest_squads"` - `is_admin()` check
- Admin Control Room has full visibility

Add escalation UI for creators:

#### Component: `src/components/creators/EscalateToAdmin.tsx`

- Button to flag an issue for admin attention
- Creates entry in `support_tickets` table
- Admin sees in their dashboard with context

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/CreatorQuestRuntime.tsx` | Create | Main runtime dashboard |
| `src/components/creators/CreatorSquadBuilder.tsx` | Create | Drag-drop squad formation |
| `src/components/creators/CreatorSquadApproval.tsx` | Create | Approve warmed-up squads |
| `src/components/creators/CreatorAnnouncements.tsx` | Create | Send messages without reading chats |
| `src/components/creators/IcebreakerPromptPicker.tsx` | Create | Select warm-up prompts |
| `src/components/creators/CreatorPortalNav.tsx` | Modify | Add "Run Quest" link |
| `src/pages/CreatorQuests.tsx` | Modify | Enable edit for live quests, add runtime link |
| `src/pages/QuestBuilder.tsx` | Modify | Restricted editing mode for published quests |
| `src/hooks/useQuests.ts` | Modify | Fix date range display, add temporal status |
| `supabase/migrations/xxx_creator_squad_rls.sql` | Create | RLS policies for creator squad management |

---

## Technical Details

### RLS Policy Summary

| Table | Creator Access |
|-------|---------------|
| `quests` | SELECT/UPDATE own quests |
| `quest_instances` | SELECT own quest's instances |
| `quest_signups` | SELECT signups for own quests |
| `quest_squads` | ALL for own quest's squads |
| `squad_members` | SELECT/INSERT/UPDATE for own quest's squads |
| `squad_chat_messages` | INSERT only (system sender) - **NO SELECT** |
| `message_templates` | SELECT where `category = 'warm_up'` |

### Mobile Responsiveness

All new components will use:
- Responsive grid layouts (`grid-cols-1 md:grid-cols-2`)
- Touch-friendly tap targets (min 48px)
- Bottom sheet dialogs for squad actions
- Collapsible sections for dense data

---

## Summary of Original Plan Items (Retained)

From the previous analysis, these items are still included:

1. **Data Persistence Gap** - Save to `quest_constraints`, `quest_objectives`, `quest_roles`, `quest_personality_affinity`
2. **Date Display Bug** - Timezone-safe comparison in `formatDateRange()`
3. **AI Suggestion Redundancy** - Merge/replace dialog in `AIDraftStep.tsx`
4. **Missing Objectives Display** - Fetch and show in `QuestModal.tsx`
5. **Image Size Guidance** - Add 1200x675 (16:9) recommendation in `MediaStep.tsx`

---

## Implementation Order

1. **Phase 1-2**: Fix editing permissions and date display (Quick wins)
2. **Phase 3**: Creator runtime dashboard skeleton
3. **Phase 4**: Squad formation with RLS policies
4. **Phase 5**: Squad approval flow
5. **Phase 6-7**: Icebreakers and communications
6. **Phase 8**: Admin escalation integration

