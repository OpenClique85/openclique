
# Corrected Implementation Plan

## Summary of Clarifications

The user clarified the following important distinctions:

1. **Quest Completion is per-instance/clique, not global** - Admins complete quests at the clique or instance level, not as a global "end all" action
2. **Archival is time-based** - Quests are removed from the public queue when their `end_datetime` passes the current date, not when manually marked complete
3. **Current "End Quest" dialog needs adjustment** - The existing `EndQuestDialog.tsx` ends the entire instance at once, which should remain as an option, but clique-level completion should also be available

---

## Current Issues Found

### Issue 1: Past Quests Still Showing
Database query revealed:
- **"DND-Lite Karaoke BRUNCH"** has `end_datetime: 2026-01-31 22:00:00` (5 days ago)
- Status is still `open`
- This quest is still appearing in the public `/quests` page

**Root Cause:** There's no automatic process to close/archive quests when their `end_datetime` passes. The existing `auto_archive_instances` function only archives instances that have been in `completed` status for 7 days.

### Issue 2: Clique-Level Completion Not Available
The current `EndQuestDialog.tsx` only supports instance-level completion (completing all cliques at once). There's no UI for completing individual cliques.

---

## Planned Changes

### 1. Remove Pricing Page (As Previously Approved)

**Files to modify:**
| File | Change |
|------|--------|
| `src/App.tsx` | Remove `Pricing` lazy import and `/pricing` route |
| `src/constants/content.ts` | Remove "Pricing" from `NAV_LINKS` array |

---

### 2. Reorganize Hero CTAs (As Previously Approved)

**Current layout:**
```
[Join Now]    [Get Involved ▼]
        [📱 Download the App]
```

**New layout:**
```
[Join Now]    [📱 Download App]
        Get Involved ▼
```

**Changes to `src/components/Hero.tsx`:**
- Move "Download the App" button to primary row next to "Join Now"
- Change it from `ghost` variant to `outline` variant
- Move "Get Involved" dropdown below as smaller, less prominent text-link style

---

### 3. Auto-Close Past Quests Based on Time

Create a new database function and edge function that automatically marks quests as `closed` when their `end_datetime` passes.

#### 3a. New Database Function

```sql
CREATE OR REPLACE FUNCTION auto_close_past_quests()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_closed_count INTEGER;
BEGIN
  WITH closed AS (
    UPDATE quests
    SET status = 'closed'
    WHERE status = 'open'
      AND end_datetime IS NOT NULL
      AND end_datetime < NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO v_closed_count FROM closed;
  
  RETURN v_closed_count;
END;
$$;
```

#### 3b. New Edge Function: `auto-close-past-quests`

Create `supabase/functions/auto-close-past-quests/index.ts` to call this function on a schedule.

#### 3c. Also Add Frontend Filter

Update `src/hooks/useQuests.ts` to filter out quests where `end_datetime < now()` regardless of status, as a client-side safety net.

---

### 4. Add Clique-Level Completion

Create a new component `CompleteCliqueDialog.tsx` that allows admins to:
- Complete individual cliques within an instance
- Award XP to members of that specific clique
- Send feedback requests to those clique members only
- Mark the clique's squad status as `completed`

This component will be added to the `CliqueManager.tsx` and `ActiveCliquesPanel.tsx` components.

#### New Component: `CompleteCliqueDialog.tsx`

**Features:**
- Takes a single `cliqueId` and `cliqueName` as props
- Shows member count for that clique
- On confirm:
  1. Updates `quest_squads.status` to `completed`
  2. Awards completion XP to members of that clique only
  3. Creates feedback requests for those members
  4. Sends notification to clique members
  5. Sends system message to clique chat

#### Integration Points

**`CliqueManager.tsx`:**
- Add a "Complete" button on each clique card (next to the lock/unlock button)
- Only visible when clique status is `active` or `approved`

**`ActiveCliquesPanel.tsx`:**
- Add "Complete Clique" action button in the clique list
- Available for cliques with status `active` or `approved`

---

### 5. Instance Auto-Archive Based on All Cliques Completed

Update the instance lifecycle so that when ALL cliques within an instance are marked `completed`, the instance automatically transitions to `completed` status.

This can be done via a database trigger:

```sql
CREATE OR REPLACE FUNCTION check_instance_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_instance_id UUID;
  v_total_cliques INTEGER;
  v_completed_cliques INTEGER;
BEGIN
  -- Get the instance ID for this squad
  SELECT instance_id INTO v_instance_id 
  FROM quest_squads 
  WHERE id = NEW.id;
  
  IF v_instance_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Count total and completed cliques
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO v_total_cliques, v_completed_cliques
  FROM quest_squads
  WHERE instance_id = v_instance_id
    AND status NOT IN ('cancelled', 'archived');
  
  -- If all cliques are completed, complete the instance
  IF v_total_cliques > 0 AND v_total_cliques = v_completed_cliques THEN
    UPDATE quest_instances
    SET status = 'completed'
    WHERE id = v_instance_id
      AND status NOT IN ('completed', 'archived', 'cancelled');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_squad_status_change
AFTER UPDATE OF status ON quest_squads
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION check_instance_completion();
```

---

## File Change Summary

### New Files

| File | Purpose |
|------|---------|
| `src/components/admin/pilot/CompleteCliqueDialog.tsx` | UI for completing individual cliques |
| `supabase/functions/auto-close-past-quests/index.ts` | Edge function to auto-close past quests |

### Modified Files

| File | Changes |
|------|---------|
| `src/App.tsx` | Remove Pricing import and route |
| `src/constants/content.ts` | Remove Pricing from NAV_LINKS |
| `src/components/Hero.tsx` | Reorganize CTAs |
| `src/hooks/useQuests.ts` | Add client-side filter for past quests |
| `src/components/admin/pilot/CliqueManager.tsx` | Add Complete button per clique |
| `src/components/admin/pilot/ActiveCliquesPanel.tsx` | Add Complete action per clique |
| `src/components/admin/pilot/index.ts` | Export CompleteCliqueDialog |

### Database Migration

| Change | Description |
|--------|-------------|
| `auto_close_past_quests()` function | Closes quests when end_datetime passes |
| `check_instance_completion()` trigger | Auto-completes instance when all cliques done |

---

## Technical Architecture

```text
QUEST LIFECYCLE (Corrected):

┌─────────────┐      (admin creates)       ┌──────────────┐
│   draft     │ ──────────────────────────→│    open      │
└─────────────┘                            └──────┬───────┘
                                                  │
                    ┌─────────────────────────────┴───────────────────┐
                    │                                                 │
                    ▼ (end_datetime passes)                          ▼ (admin closes)
            ┌──────────────┐                                  ┌──────────────┐
            │    closed    │←─────────────────────────────────│  cancelled   │
            └──────────────┘                                  └──────────────┘


INSTANCE/CLIQUE LIFECYCLE:

┌─────────────────────────────────────────────────────────────────────────┐
│                        QUEST INSTANCE                                    │
│                                                                          │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐         │
│   │ Clique A │    │ Clique B │    │ Clique C │    │ Clique D │         │
│   │  active  │    │ completed│    │  active  │    │ completed│         │
│   └──────────┘    └──────────┘    └──────────┘    └──────────┘         │
│                                                                          │
│   Instance Status: live                                                  │
│   (auto-completes when ALL cliques are completed)                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Testing Checklist

After implementation:
- [ ] Pricing page returns 404 when accessed directly
- [ ] No "Pricing" link in navbar
- [ ] Hero shows "Join Now" and "Download App" side by side
- [ ] "Get Involved" dropdown appears smaller, below primary CTAs
- [ ] Past quests (end_datetime < now) don't appear on /quests page
- [ ] Admin can complete individual cliques from CliqueManager
- [ ] Completing a clique awards XP only to that clique's members
- [ ] Completing all cliques auto-completes the instance
- [ ] The existing "End Quest & Send Feedback" button still works for bulk completion
