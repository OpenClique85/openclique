
# Recruit a Friend Feature Implementation Plan

## Overview

This plan implements a complete "Recruit a Friend" feature that allows users who have signed up for a quest to invite new users to join OpenClique and automatically sign up for the same quest. The system includes XP rewards, badges, achievements, and admin analytics.

## User Experience Flow

```text
1. User signs up for a quest
2. On their Profile Hub "Quests" tab, they see a "Recruit a Friend" button
3. Clicking the button shows a modal with:
   - Unique friend code (e.g., "QUEST-ABC123")
   - Shareable link with the code embedded
   - Copy buttons for code and link
   - XP reward preview (+50 XP)
4. Friend clicks link or enters code during signup
5. Friend creates account and is auto-signed up for the quest
6. Original user receives:
   - +50 XP (immediate)
   - One-time "Friend Recruiter" badge (first friend only)
   - "Social Connector" achievement (5 friends)
   - "Community Builder" achievement (10 friends)
7. Both users are flagged for squad grouping (existing feature)
```

---

## Database Changes

### 1. New Table: `friend_invites`

Tracks quest-specific friend recruitment codes, separate from general referrals.

```sql
CREATE TABLE public.friend_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  redeemed_at TIMESTAMPTZ,
  UNIQUE(referrer_user_id, quest_id)
);
```

### 2. New RPC: `redeem_friend_invite`

Handles account creation + quest signup + XP + achievement unlock flow.

```sql
CREATE OR REPLACE FUNCTION public.redeem_friend_invite(p_code TEXT, p_new_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invite RECORD;
  v_recruit_count INTEGER;
  v_new_achievements JSONB := '[]';
BEGIN
  -- Validate invite code
  SELECT * INTO v_invite FROM friend_invites
  WHERE code = UPPER(TRIM(p_code))
  AND redeemed_at IS NULL;
  
  IF v_invite IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or already used code');
  END IF;
  
  -- Mark invite as redeemed
  UPDATE friend_invites SET
    referred_user_id = p_new_user_id,
    redeemed_at = now()
  WHERE id = v_invite.id;
  
  -- Auto-signup new user for the quest
  INSERT INTO quest_signups (user_id, quest_id, status)
  VALUES (p_new_user_id, v_invite.quest_id, 'pending')
  ON CONFLICT (user_id, quest_id) DO NOTHING;
  
  -- Award referrer 50 XP
  PERFORM award_xp(v_invite.referrer_user_id, 50, 'friend_recruit', v_invite.id::text);
  
  -- Count successful referrals for achievements
  SELECT COUNT(*) INTO v_recruit_count
  FROM friend_invites
  WHERE referrer_user_id = v_invite.referrer_user_id
  AND redeemed_at IS NOT NULL;
  
  -- Check and unlock achievements
  SELECT json_agg(row_to_json(t)) INTO v_new_achievements
  FROM check_and_unlock_achievements(v_invite.referrer_user_id) t;
  
  -- Link for squad grouping (existing referrals table)
  INSERT INTO referrals (referrer_user_id, quest_id, referral_code, referred_user_id, signed_up_at)
  VALUES (v_invite.referrer_user_id, v_invite.quest_id, p_code, p_new_user_id, now())
  ON CONFLICT (referral_code) DO UPDATE SET
    referred_user_id = p_new_user_id,
    signed_up_at = now();
  
  RETURN jsonb_build_object(
    'success', true,
    'quest_id', v_invite.quest_id,
    'referrer_id', v_invite.referrer_user_id,
    'recruit_count', v_recruit_count,
    'achievements', v_new_achievements
  );
END;
$$;
```

### 3. Update `check_and_unlock_achievements` Function

Add new criteria type `friend_recruit_count`:

```sql
-- Add to the achievement check logic:
ELSIF v_criteria->>'type' = 'friend_recruit_count' THEN
  SELECT COUNT(*) INTO v_recruit_count
  FROM friend_invites
  WHERE referrer_user_id = p_user_id AND redeemed_at IS NOT NULL;
  v_qualified := v_recruit_count >= (v_criteria->>'count')::integer;
```

### 4. New Achievement Templates

Insert into `achievement_templates`:

| Name | Criteria | XP Reward | Icon |
|------|----------|-----------|------|
| Friend Recruiter | `{"type": "friend_recruit_count", "count": 1}` | 25 | 🤝 |
| Social Connector | `{"type": "friend_recruit_count", "count": 5}` | 75 | 🌟 |
| Community Builder | `{"type": "friend_recruit_count", "count": 10}` | 150 | 🏆 |

### 5. New Badge Template

Insert into `badge_templates`:

| Name | Description | Icon |
|------|-------------|------|
| Friend Bringer | Recruited your first friend to OpenClique | 👋 |

---

## Frontend Components

### 1. `RecruitFriendButton` Component

New component: `src/components/quests/RecruitFriendButton.tsx`

Features:
- Generates/retrieves friend invite code
- Shows shareable link with code
- Copy buttons for code and full link
- XP reward preview (+50 XP per friend)
- Progress toward achievements

### 2. Add to `QuestsTab.tsx`

Add "Recruit a Friend" button to quest cards for `pending`, `confirmed`, or `standby` signups:

```tsx
{(signup.status === 'pending' || signup.status === 'confirmed' || signup.status === 'standby') && (
  <RecruitFriendButton 
    questId={signup.quest.id} 
    questSlug={signup.quest.slug}
  />
)}
```

### 3. Update Auth Flow

Modify `src/pages/Auth.tsx` to:
- Check for `?invite=FRIEND-XXXXX` query param
- After successful signup, call `redeem_friend_invite` RPC
- Show celebration modal with quest auto-signup confirmation

### 4. Hook: `useFriendInvite`

New hook: `src/hooks/useFriendInvite.ts`

```typescript
export function useFriendInvite(questId: string) {
  // Generate or fetch existing invite code
  // Return code, link, copy functions
  // Track successful recruitments for user
}
```

---

## Admin Analytics

### 1. Add to `PlatformStats.tsx`

New stat card:
- **Friends Recruited**: Total count from `friend_invites` where `redeemed_at IS NOT NULL`

### 2. New Admin Tab: `ReferralAnalytics.tsx`

Add under Growth section:

```text
Growth
  ├── Invite Codes
  ├── Onboarding Feedback
  ├── Analytics
  └── Friend Referrals (NEW)
```

Component: `src/components/admin/ReferralAnalytics.tsx`

Features:
- Total friends recruited (all-time)
- Friends recruited this week/month
- Top recruiters leaderboard (anonymized or full names)
- Conversion funnel: Invites Created → Clicked → Redeemed
- Distribution chart: Users by recruit count (0, 1-4, 5-9, 10+)
- Recruit-to-quest-completion rate

---

## XP & Gamification Updates

### 1. Update `useUserXP.ts` Labels

Add new source label:
```typescript
friend_recruit: 'Friend Recruited',
```

### 2. Update Achievement Toast

The existing `showAchievementToast` will automatically display when achievements unlock via the RPC flow.

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/quests/RecruitFriendButton.tsx` | Main recruit button with modal |
| `src/hooks/useFriendInvite.ts` | Hook for invite code management |
| `src/components/admin/ReferralAnalytics.tsx` | Admin analytics dashboard |
| `supabase/migrations/XXXXXX_friend_invites.sql` | Database migration |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/profile/QuestsTab.tsx` | Add RecruitFriendButton to quest cards |
| `src/pages/Auth.tsx` | Handle friend invite code redemption |
| `src/hooks/useUserXP.ts` | Add `friend_recruit` label |
| `src/components/admin/AdminSectionNav.tsx` | Add Friend Referrals tab |
| `src/pages/Admin.tsx` | Add ReferralAnalytics case |
| `src/components/admin/PlatformStats.tsx` | Add recruit count stat |

---

## Technical Considerations

### Code Format
Friend invite codes use format: `FRIEND-{8_CHAR_RANDOM}`
- Example: `FRIEND-X7K2M9PQ`
- Uppercase, alphanumeric, easy to share verbally

### Squad Grouping Integration
The `redeem_friend_invite` RPC inserts into the existing `referrals` table with `referred_user_id` populated. The `recommend-squads` edge function already uses this data to create "referral clusters" for squad formation.

### Security
- RLS policies ensure users can only see their own invites
- Admins can view all invites for analytics
- Codes expire after 30 days (optional, can be added)

### Mobile Considerations
- RecruitFriendButton uses responsive dialog/drawer pattern
- Share functionality uses native share API when available
- Code is copy-friendly for messaging apps

---

## Implementation Order

1. **Database Migration** - Create `friend_invites` table, RPC functions, achievement templates
2. **Hooks** - Create `useFriendInvite` hook
3. **Components** - Build `RecruitFriendButton` with modal
4. **QuestsTab Integration** - Add button to quest cards
5. **Auth Flow** - Handle invite code redemption on signup
6. **Admin Analytics** - Add `ReferralAnalytics` component
7. **PlatformStats** - Add recruit count to dashboard
8. **Testing** - End-to-end flow verification
