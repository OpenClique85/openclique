
# Simplified Quest Operations Flow

## Problem Summary

The current admin workflow is confusing because:

1. **Users sign up for quests** (which have dates/times set)
2. **But admins must separately "schedule instances"** before they can manage the quest
3. **There's no clear "Start Quest" button** in the Quests panel
4. **Instances feel like a duplicate scheduling step** when quests already have dates

The user's mental model:
> "Quest with signups → Click 'Start Quest' → Manage squads and run the quest"

## Solution

Simplify the admin flow by:
1. Adding a **"Start Quest"** action directly in QuestsManager for quests with signups
2. Auto-creating an instance using the quest's existing date/time (no re-scheduling needed)
3. Immediately navigating to the Pilot Control Room for squad management
4. Making "instances" feel like "active/running quests" rather than a separate concept

---

## Changes Overview

### 1. Add "Start Quest" Button to QuestsManager

**File**: `src/components/admin/QuestsManager.tsx`

Add a prominent "Start Quest" button that appears when:
- Quest has at least 1 signup
- Quest has `start_datetime` set
- No active instance exists for this quest yet

The button will:
- Auto-create an instance using `create_instance_from_quest` with the quest's date/time
- Navigate directly to `/admin/pilot/{instanceId}`

### 2. Show Signup Count Prominently

In the quest card, show signup count more prominently as the key metric for "is this ready to start?"

### 3. Update Instance Creation Logic

When "Start Quest" is clicked:
- Use quest's `start_datetime` for the date
- Use quest's `meeting_location_name` and `meeting_address`
- Set instance status to `recruiting` (not `draft`) so it's immediately actionable
- Transfer existing signups to the new instance

### 4. Link Signups to Instance

Create a function to migrate signups from quest-only to quest+instance when starting:
- Update `quest_signups.instance_id` for all signups on this quest

---

## Detailed Changes

### File: `src/components/admin/QuestsManager.tsx`

**Add "Start Quest" Button Logic:**

```tsx
// After the quest card header, add a prominent action section
{quest.signup_counts && (quest.signup_counts.confirmed + quest.signup_counts.pending) > 0 && 
 quest.start_datetime && 
 !quest.instance_count && (
  <Button 
    className="bg-emerald-600 hover:bg-emerald-700"
    onClick={() => handleStartQuest(quest)}
  >
    <Rocket className="mr-2 h-4 w-4" />
    Start Quest ({quest.signup_counts.confirmed + quest.signup_counts.pending} signed up)
  </Button>
)}
```

**Add `handleStartQuest` function:**

```tsx
const handleStartQuest = async (quest: QuestWithCounts) => {
  if (!quest.start_datetime) {
    toast({ variant: 'destructive', title: 'Quest needs a date/time first' });
    return;
  }
  
  const startDate = new Date(quest.start_datetime);
  const dateStr = startDate.toISOString().split('T')[0];
  const timeStr = startDate.toTimeString().slice(0, 5);
  
  // Create instance from quest
  const { data: instanceId, error } = await supabase.rpc('create_instance_from_quest', {
    p_quest_id: quest.id,
    p_scheduled_date: dateStr,
    p_start_time: timeStr,
    p_end_time: quest.end_datetime 
      ? new Date(quest.end_datetime).toTimeString().slice(0, 5) 
      : null,
  });
  
  if (error) {
    toast({ variant: 'destructive', title: 'Failed to start quest', description: error.message });
    return;
  }
  
  // Link existing signups to this instance
  await supabase
    .from('quest_signups')
    .update({ instance_id: instanceId })
    .eq('quest_id', quest.id)
    .is('instance_id', null);
  
  // Set instance to recruiting status
  await supabase
    .from('quest_instances')
    .update({ status: 'recruiting' })
    .eq('id', instanceId);
  
  toast({ title: 'Quest started! Opening Control Room...' });
  navigate(`/admin/pilot/${instanceId}`);
};
```

### Database Migration

Create a helper function to link signups and start an instance in one atomic operation:

```sql
CREATE OR REPLACE FUNCTION start_quest_and_link_signups(
  p_quest_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quest RECORD;
  v_instance_id UUID;
BEGIN
  -- Get quest with datetime
  SELECT * INTO v_quest FROM quests WHERE id = p_quest_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quest not found';
  END IF;
  
  IF v_quest.start_datetime IS NULL THEN
    RAISE EXCEPTION 'Quest has no start date/time set';
  END IF;
  
  -- Create instance
  v_instance_id := create_instance_from_quest(
    p_quest_id,
    v_quest.start_datetime::date,
    v_quest.start_datetime::time,
    v_quest.end_datetime::time,
    v_quest.meeting_location_name,
    v_quest.meeting_address
  );
  
  -- Set to recruiting immediately
  UPDATE quest_instances 
  SET status = 'recruiting' 
  WHERE id = v_instance_id;
  
  -- Link all existing signups to this instance
  UPDATE quest_signups
  SET instance_id = v_instance_id
  WHERE quest_id = p_quest_id
    AND instance_id IS NULL;
  
  -- Update signup count on instance
  UPDATE quest_instances
  SET current_signup_count = (
    SELECT COUNT(*) FROM quest_signups 
    WHERE instance_id = v_instance_id 
    AND status IN ('pending', 'confirmed', 'standby')
  )
  WHERE id = v_instance_id;
  
  RETURN v_instance_id;
END;
$$;
```

---

## UI Changes Summary

| Location | Change |
|----------|--------|
| Quest Card (QuestsManager) | Add "Start Quest" button when signups exist and no instance yet |
| Quest Card Header | Show signup count more prominently as "X ready to go" |
| Start Quest Action | Creates instance, links signups, opens Control Room |
| DropdownMenu | Keep "Schedule Instance" for advanced/repeating use cases |

---

## Workflow After Implementation

1. **Admin creates quest** with date/time in QuestsManager
2. **Users sign up** on the public quest page
3. **Admin sees "Start Quest (3 signed up)"** button in QuestsManager
4. **Admin clicks "Start Quest"** → Instance auto-created → Control Room opens
5. **In Control Room**: Form squads, advance through lifecycle, go live

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/QuestsManager.tsx` | Add "Start Quest" button, `handleStartQuest` function, loading state |
| Database migration | Add `start_quest_and_link_signups` RPC function |

## Optional Future Improvements

- Auto-create instance when first signup arrives (background)
- Show instances inline within quest cards
- Rename "Instances" to "Active Runs" in admin UI
