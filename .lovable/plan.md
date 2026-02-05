
# Quest Completion Flow Enhancement Plan

## Overview

This plan addresses the full lifecycle when an admin ends a quest: awarding XP, updating databases, celebrating completion, enabling optional clique persistence (premium feature), and improving the feedback UX.

---

## Current State Analysis

**What's working:**
- `EndQuestDialog.tsx` creates `feedback_requests` and sends chat notifications
- `award_quest_xp()` RPC exists and handles XP + achievements + streaks
- `useEntitlements` hook checks `personal_scope` for premium features
- `premium_interest` table tracks pilot users

**Gaps identified:**
1. Admin "End Quest" doesn't award completion XP (50% base)
2. No celebration UI when quest ends (user-facing)
3. `quest_signups.completed_at` not set on End Quest
4. No "Skip Testimonial" option (only "Skip" button exists but no explicit "No thanks")
5. No "Keep Clique" prompt post-completion
6. No navigation out of feedback flow mid-form
7. Notifications not created when quest ends
8. Quest history doesn't show completion state prominently

---

## Phase 1: Database Schema Updates

### 1.1 New Table: `clique_save_requests`
Tracks mutual selection for clique persistence.

```sql
CREATE TABLE clique_save_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES quest_instances(id),
  squad_id uuid NOT NULL REFERENCES squads(id),
  requester_id uuid NOT NULL REFERENCES profiles(id),
  selected_member_ids uuid[] NOT NULL DEFAULT '{}',
  wants_to_save boolean NOT NULL DEFAULT true,
  premium_acknowledged boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  UNIQUE(instance_id, requester_id)
);
```

### 1.2 New Column: `quest_signups.completion_xp_awarded`
Track whether base XP was awarded for completion.

```sql
ALTER TABLE quest_signups
ADD COLUMN IF NOT EXISTS completion_xp_awarded boolean DEFAULT false;
```

### 1.3 RLS Policies

```sql
-- clique_save_requests
ALTER TABLE clique_save_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own save requests"
ON clique_save_requests FOR SELECT
USING (requester_id = auth.uid());

CREATE POLICY "Users can create own save requests"
ON clique_save_requests FOR INSERT
WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can update own save requests"
ON clique_save_requests FOR UPDATE
USING (requester_id = auth.uid());

-- Rate limit: users can only create 1 request per instance
-- Enforced by UNIQUE constraint
```

---

## Phase 2: End Quest Flow Enhancement

### 2.1 Modify `EndQuestDialog.tsx`

**Current behavior:**
- Updates instance status
- Creates feedback_requests
- Sends chat message

**Add:**
1. Award 50% base XP to each participant:
   ```typescript
   // For each member:
   await supabase.rpc('award_xp', {
     p_user_id: member.user_id,
     p_amount: Math.floor(quest.base_xp * 0.5),
     p_source: 'quest_complete',
     p_source_id: instanceId,
   });
   ```

2. Update `quest_signups.completed_at` and `completion_xp_awarded`:
   ```typescript
   await supabase
     .from('quest_signups')
     .update({ 
       status: 'completed',
       completed_at: new Date().toISOString(),
       completion_xp_awarded: true,
     })
     .eq('instance_id', instanceId)
     .in('status', ['confirmed', 'pending']);
   ```

3. Create notifications for all participants:
   ```typescript
   const notifications = members.map(m => ({
     user_id: m.user_id,
     type: 'quest_complete',
     title: `Quest Complete: ${instanceTitle}`,
     body: `You earned ${Math.floor(quest.base_xp * 0.5)} XP! Give feedback to earn up to ${feedbackMaxXP} more.`,
   }));
   await supabase.from('notifications').insert(notifications);
   ```

4. Trigger achievement checks:
   ```typescript
   for (const member of members) {
     await supabase.rpc('check_and_unlock_achievements', { p_user_id: member.user_id });
   }
   ```

### 2.2 Add Notification Type

Add `'quest_complete'` to the notification types enum if not present (check DB types).

---

## Phase 3: User-Facing Quest Completion Celebration

### 3.1 New Component: `QuestCompleteModal.tsx`

Location: `src/components/quests/QuestCompleteModal.tsx`

**Trigger:** When user opens their quest detail (via profile) and quest just completed

**Features:**
- Confetti animation (or party emoji burst)
- Show XP earned badge: "+{baseXP/2} XP Earned!"
- "Keep Your Clique?" prompt (if eligible)
- CTA buttons: "Give Feedback (+{xp} XP)" / "View Quest History"

### 3.2 User Quest Card Enhancement

**Modify:** `QuestsTab.tsx` completed quest display

**Add:**
- 🎉 "Completed!" badge with checkmark
- "Give Feedback" button if feedback_request pending
- "Feedback Submitted" if already done
- XP earned indicator

---

## Phase 4: "Keep Your Clique" Premium Feature

### 4.1 New Component: `KeepCliqueModal.tsx`

Location: `src/components/cliques/KeepCliqueModal.tsx`

**Flow:**
1. Show after quest completion (in QuestCompleteModal or FeedbackComplete)
2. List clique members with checkboxes
3. "Who would you quest with again?" multi-select
4. Premium gate:
   - If `hasPersonalPremium()` → proceed
   - If not → show "This is a Premium Feature" upsell
   - CTA: "Join Premium Pilot" opens `PremiumInterestModal`
5. On confirm → insert `clique_save_request`

### 4.2 Mutual Match Processing

**New Edge Function or DB Trigger:** `process-clique-saves`

**Logic:**
1. After both users select each other:
   ```sql
   -- Find mutual selections for same instance + squad
   SELECT a.requester_id, b.requester_id
   FROM clique_save_requests a
   JOIN clique_save_requests b 
     ON a.instance_id = b.instance_id 
     AND a.squad_id = b.squad_id
     AND a.requester_id = ANY(b.selected_member_ids)
     AND b.requester_id = ANY(a.selected_member_ids)
   WHERE a.processed_at IS NULL;
   ```
2. Create persistent squad with mutual members
3. Insert into `squad_members` with `persistent_squad_id`
4. Notify matched members

### 4.3 Premium Check Integration

Use existing `useEntitlements` hook:
```typescript
const { hasPersonalPremium, shouldShowPremiumUpsell } = useEntitlements();

if (!hasPersonalPremium()) {
  return <PremiumUpsellCard feature="clique_persistence" />;
}
```

---

## Phase 5: Feedback UX Improvements

### 5.1 Add "No Thanks" Option to Testimonial Step

**Modify:** `FeedbackStep4.tsx`

**Current:** "Skip" and "Submit"
**Change to:** 
- "No Thanks, I'm Done" → marks complete without testimonial XP
- "Submit Testimonial" → earns XP

```tsx
<div className="pt-4 flex gap-3">
  <Button variant="ghost" onClick={onSkip} className="flex-1">
    No Thanks, I'm Done
  </Button>
  <Button 
    onClick={handleSubmit} 
    disabled={!canSubmit || isSubmitting}
    className="flex-1"
  >
    {isSubmitting ? 'Saving...' : hasTestimonialText ? `Submit (+${xpReward} XP)` : 'Skip Step'}
  </Button>
</div>
```

### 5.2 Add Exit Navigation

**Modify:** `FeedbackFlow.tsx`

**Add:** Exit button in header with confirmation dialog:
```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="ghost" size="sm">
      <X className="h-4 w-4" />
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogTitle>Leave Feedback?</AlertDialogTitle>
    <AlertDialogDescription>
      Your progress is saved. You can return anytime before the deadline.
    </AlertDialogDescription>
    <AlertDialogFooter>
      <AlertDialogCancel>Stay</AlertDialogCancel>
      <AlertDialogAction onClick={() => navigate('/profile?tab=quests')}>
        Leave
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 5.3 Integrate "Keep Clique" After Feedback Complete

**Modify:** `FeedbackComplete.tsx`

**Add:** After XP summary, before suggested quests:
```tsx
{squadId && (
  <KeepCliquePrompt 
    squadId={squadId}
    instanceId={instanceId}
    onComplete={() => setShowKeepCliqueModal(false)}
  />
)}
```

---

## Phase 6: Profile & History Updates

### 6.1 Quest History Card Enhancement

**Modify:** `QuestsTab.tsx` - Completed quests section

**Display for completed quests:**
- ✅ Completion badge with date
- XP earned indicator
- Feedback status (Pending/Submitted)
- "Keep Clique" status if applicable

### 6.2 Notification Updates

**Add notification icons/handling in:**
- `NotificationBell.tsx` for `quest_complete` type
- `Notifications.tsx` page

---

## File Changes Summary

### New Files (4)
| File | Purpose |
|------|---------|
| `src/components/quests/QuestCompleteModal.tsx` | Celebration modal on quest completion |
| `src/components/cliques/KeepCliqueModal.tsx` | Member selection for clique persistence |
| `src/components/cliques/KeepCliquePrompt.tsx` | Inline prompt in FeedbackComplete |
| `supabase/functions/process-clique-saves/index.ts` | Process mutual matches |

### Modified Files (8)
| File | Changes |
|------|---------|
| `EndQuestDialog.tsx` | Add XP award, signup updates, notifications |
| `FeedbackStep4.tsx` | Add "No Thanks" button |
| `FeedbackFlow.tsx` | Add exit button with confirmation |
| `FeedbackComplete.tsx` | Integrate KeepCliquePrompt |
| `QuestsTab.tsx` | Enhance completed quest display |
| `NotificationBell.tsx` | Add quest_complete icon |
| `Notifications.tsx` | Handle quest_complete type |
| `useNotifications.ts` | Add type if needed |

### Database Migrations (2)
1. Create `clique_save_requests` table with RLS
2. Add `completion_xp_awarded` column to `quest_signups`

---

## Security & Risk Analysis

### Security Measures

| Concern | Mitigation |
|---------|------------|
| Clique save spam | UNIQUE constraint on (instance_id, requester_id); rate-limited to 1 per quest |
| Premium bypass | Server-side check in edge function before creating persistent squad |
| XP double-award | Check `completion_xp_awarded` flag before awarding |
| Unauthorized clique joins | RLS policies ensure users can only submit own requests |
| Fake member selection | Validate selected members were actually in same squad |

### Rate Limits

| Action | Limit |
|--------|-------|
| Clique save request | 1 per instance per user (DB constraint) |
| Feedback submission | 1 per quest per user (existing) |
| Premium interest | 1 per user (upsert on conflict) |

### RLS Policies Summary

```sql
-- clique_save_requests
SELECT: requester_id = auth.uid()
INSERT: requester_id = auth.uid()
UPDATE: requester_id = auth.uid() AND processed_at IS NULL
DELETE: (none - preserve for analytics)
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| User confusion with premium gate | Medium | Low | Clear copy: "This feature requires Premium - currently free during pilot" |
| Mutual match never happens | Medium | Low | Show "Waiting for matches" status; remind in 24h |
| XP inflation from quest completion | Low | Medium | 50% base XP is reasonable; tracked in xp_transactions |
| Edge function cold starts | Low | Low | Use scheduled cron for match processing |
| Users abandon feedback for clique feature | Medium | Medium | Keep clique prompt AFTER feedback complete |

---

## Improvements Over Current System

1. **Complete XP flow**: Users get 50% XP just for completing + up to 250 XP for feedback = ~350-400 XP total per quest
2. **Celebration moment**: Quest completion now has emotional payoff
3. **Clique persistence**: Converts one-time groups into lasting connections (core OpenClique value)
4. **Premium monetization path**: Natural upsell at moment of high engagement
5. **Better feedback UX**: Clear exit, explicit "No" option, auto-save
6. **Full audit trail**: All completions, XP awards, and clique saves tracked

---

## Implementation Order

1. **Database migrations** - Foundation
2. **EndQuestDialog enhancements** - Core completion flow
3. **Feedback UX improvements** - Quick wins
4. **KeepCliqueModal + KeepCliquePrompt** - Premium feature
5. **QuestCompleteModal** - Celebration UI
6. **Profile/history updates** - Polish
7. **Edge function for match processing** - Background automation

---

## Testing Checklist

- [ ] Admin ends quest → participants receive XP + notification
- [ ] Quest signup status updates to completed
- [ ] Feedback flow: can exit mid-form and return
- [ ] Testimonial step: "No Thanks" works without error
- [ ] Non-premium user sees upsell when trying to save clique
- [ ] Premium user can submit clique save request
- [ ] Mutual matches create persistent squad
- [ ] All data persists correctly in database
- [ ] Achievement unlocks trigger on completion
