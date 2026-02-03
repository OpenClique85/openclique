
# Enhanced Account & Social Coordination System

## Overview

This plan implements a comprehensive set of features to improve signup security, user identity, discoverability, and structured social interactions - all without enabling direct messaging. The goal is to keep socializing within cliques while providing lightweight coordination tools.

---

## Part 1: Signup Security Enhancements

### 1.1 Password Confirmation Field

**Current Gap**: Users can typo their password during signup and get locked out.

**Changes to `src/pages/Auth.tsx`:**

| Element | Change |
|---------|--------|
| New state | `confirmPassword: string` |
| New validation | Passwords must match before submission |
| New field | "Confirm Password" input between Password and Create Account button |
| Error display | "Passwords do not match" shown below confirm field |

**UI Flow:**
```text
Email: [________________]
Password: [________________]
Confirm Password: [________________]  ← NEW
[Create Account]
```

---

## Part 2: Unique Username System

### 2.1 Database Schema

```sql
-- Add username column to profiles
ALTER TABLE profiles 
  ADD COLUMN username TEXT UNIQUE;

-- Add friend_code for sharing/inviting
ALTER TABLE profiles 
  ADD COLUMN friend_code TEXT UNIQUE;

-- Case-insensitive unique index
CREATE UNIQUE INDEX idx_profiles_username_lower 
  ON profiles (LOWER(username));

-- Format validation (3-20 chars, alphanumeric + underscore)
ALTER TABLE profiles 
  ADD CONSTRAINT username_format 
  CHECK (username ~ '^[a-zA-Z0-9_]{3,20}$');

-- Auto-generate friend codes
CREATE OR REPLACE FUNCTION generate_user_friend_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate on profile creation
CREATE TRIGGER trigger_auto_generate_friend_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_friend_code();

-- Backfill existing users
UPDATE profiles 
SET friend_code = generate_user_friend_code()
WHERE friend_code IS NULL;
```

### 2.2 New Components

| Component | Purpose |
|-----------|---------|
| `src/components/profile/UsernameInput.tsx` | Real-time availability check with debounce |
| `src/components/profile/FriendCodeCard.tsx` | Display, copy, and share friend code |
| `src/hooks/useUsernameAvailability.ts` | Debounced check against database |

### 2.3 UI Integration

**ProfileModal.tsx** (for new users):
```text
Display Name: [John Smith          ]
Username:     [@johnsmith         ] ✓ Available
              "Your unique handle. Others find you as @johnsmith"
```

**ProfileEditModal.tsx** (for existing users):
- Add username field
- Show friend code (read-only, with copy button)

---

## Part 3: User Search & Discovery

### 3.1 Database Function

```sql
CREATE OR REPLACE FUNCTION search_users(
  p_query TEXT,
  p_limit INT DEFAULT 20,
  p_requester_id UUID DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  display_name TEXT,
  username TEXT,
  city TEXT,
  friend_code TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.username,
    p.city,
    p.friend_code
  FROM profiles p
  LEFT JOIN user_blocks ub ON ub.blocker_id = p_requester_id AND ub.blocked_id = p.id
  LEFT JOIN user_blocks ub2 ON ub2.blocker_id = p.id AND ub2.blocked_id = p_requester_id
  WHERE 
    (p.username ILIKE '%' || p_query || '%'
     OR p.display_name ILIKE '%' || p_query || '%'
     OR p.friend_code = UPPER(p_query))
    AND (p.privacy_settings->>'profile_visible')::boolean IS NOT FALSE
    AND ub.blocker_id IS NULL  -- Not blocked by requester
    AND ub2.blocker_id IS NULL -- Not blocking requester
    AND p.id != COALESCE(p_requester_id, '00000000-0000-0000-0000-000000000000'::uuid)
  ORDER BY 
    CASE WHEN p.username ILIKE p_query || '%' THEN 0 ELSE 1 END,
    p.display_name
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3.2 New Pages & Components

| File | Purpose |
|------|---------|
| `src/pages/UserSearch.tsx` | `/users` route for finding people |
| `src/components/social/UserSearchCard.tsx` | Result card with action buttons |
| `src/components/social/UserProfilePreview.tsx` | Quick-view drawer for user profiles |

### 3.3 Search Page UI

```text
┌─────────────────────────────────────────────┐
│ Find People                                 │
├─────────────────────────────────────────────┤
│ [🔍 Search by @username, name, or code...] │
│                                             │
│ Results:                                    │
│ ┌─────────────────────────────────────────┐ │
│ │ [J]  John S.         @johnsmith         │ │
│ │      Austin, TX                         │ │
│ │      [Invite to Clique] [Send Quest] [👋]│ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Privacy Enforcement:**
- Only show users with `profile_visible = true`
- Hide blocked users in both directions
- Never expose email addresses

---

## Part 4: Structured Social Interactions (No DMs)

### 4.1 Interaction Types

Instead of direct messaging, users can perform these structured actions:

| Action | Description | Recipient Notification |
|--------|-------------|------------------------|
| **Poke** | "Hey, thinking of you!" nudge | "[User] poked you 👋" |
| **Invite to Clique** | Add someone to your squad | "[User] invited you to join [Clique Name]" |
| **Send Quest** | Share a quest recommendation | "[User] thinks you'd like [Quest Name]" |
| **Wave** | Friendly acknowledgment | "[User] waved at you 👋" |

### 4.2 Database Schema

```sql
-- User interactions table (not messages!)
CREATE TABLE user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL, -- 'poke', 'wave', 'quest_share', 'clique_invite'
  payload JSONB, -- {quest_id: 'xxx'} or {clique_id: 'xxx'}
  message TEXT, -- Optional short context (max 100 chars)
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Prevent spam: one interaction type per pair per 24 hours
  CONSTRAINT unique_interaction_daily 
    UNIQUE NULLS NOT DISTINCT (from_user_id, to_user_id, interaction_type, 
      (created_at::date))
);

-- Rate limiting: max 10 interactions per user per day
CREATE OR REPLACE FUNCTION check_interaction_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM user_interactions 
    WHERE from_user_id = NEW.from_user_id 
    AND created_at > now() - interval '24 hours'
  ) >= 10 THEN
    RAISE EXCEPTION 'Daily interaction limit reached (10/day)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_interaction_limit
  BEFORE INSERT ON user_interactions
  FOR EACH ROW EXECUTE FUNCTION check_interaction_limit();

-- Clique invitations (person-to-person, not generic codes)
CREATE TABLE clique_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID REFERENCES squads(id) ON DELETE CASCADE,
  inviter_id UUID REFERENCES auth.users(id),
  invitee_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending', -- pending, accepted, declined, expired
  message TEXT, -- Optional: "Hey, join us for trivia night!"
  created_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT now() + interval '7 days',
  UNIQUE(squad_id, invitee_id)
);

-- RLS Policies
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clique_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see interactions involving them"
  ON user_interactions FOR SELECT
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Users can create interactions"
  ON user_interactions FOR INSERT
  WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Users can see their invitations"
  ON clique_invitations FOR SELECT
  USING (inviter_id = auth.uid() OR invitee_id = auth.uid());
```

### 4.3 Anti-Creep Safeguards

| Safeguard | Implementation |
|-----------|----------------|
| **Rate Limiting** | 10 interactions/day per user |
| **One-per-day** | Can only poke same person once per 24h |
| **Blocking** | Blocked users can't interact at all |
| **No Custom Text** | Interactions are structured, not free-form |
| **Short Context Only** | Optional message capped at 100 chars |
| **Auto-Expire** | Clique invites expire after 7 days |

### 4.4 New Components

| Component | Purpose |
|-----------|---------|
| `src/components/social/PokeButton.tsx` | Send poke with cooldown indicator |
| `src/components/social/InviteToCliqueDialog.tsx` | Select clique to invite user to |
| `src/components/social/SendQuestDialog.tsx` | Share a quest with someone |
| `src/components/social/InteractionFeed.tsx` | Show received interactions on profile |

### 4.5 Notification Integration

Update `useNotifications.ts` types:

```typescript
type: 'poke' | 'wave' | 'quest_shared_user' | 'clique_invite_received' | ...
```

These flow into the existing Notifications page with proper icons and categories.

---

## Part 5: Admin User Profile Drawer

### 5.1 New Component: `AdminUserProfileDrawer.tsx`

A slide-out panel showing complete user information for admins:

```text
┌─────────────────────────────────────┐
│ [←] User Profile                    │
├─────────────────────────────────────┤
│  [J]  John Smith                    │
│  @johnsmith                         │
│  john@example.com                   │
│  Member Since: Jan 15, 2026         │
│  Age Verified: ✓ (28 years old)     │
│  Friend Code: XKCD7M3N              │
│                                     │
│  ── Activity ──                     │
│  Quests Attended: 12                │
│  Total XP: 1,250                    │
│  Cliques: 3 (2 as leader)           │
│                                     │
│  ── Trust & Safety ──               │
│  Trust Score: 85                    │
│  Reports Filed: 2                   │
│  Reports Against: 0                 │
│  Blocks: 1                          │
│  Interactions Sent: 45              │
│                                     │
│  ── Actions ──                      │
│  [View Quest History]               │
│  [View Cliques]                     │
│  [Send Admin Message]               │
│  [Suspend Account] [Ban User]       │
└─────────────────────────────────────┘
```

### 5.2 Integration Points

Make usernames clickable in:

| Panel | Clickable Elements |
|-------|-------------------|
| `AdminReportsQueuePanel` | Reporter, Reported User |
| `AdminSOSAlertsPanel` | User who triggered alert |
| `ModerationDashboard` | Trust score entries |
| `SignupsManager` | Signup user names |

### 5.3 Admin User Directory Tab

New tab in `ModerationDashboard.tsx`:

```text
[Overview] [SOS Alerts] [User Reports] [User Directory] [Legacy Flags]
```

Features:
- Full-text search across email, username, display_name
- Filters: join date range, XP level, trust score, verified/unverified
- Bulk export to CSV
- Click any row to open `AdminUserProfileDrawer`

---

## Part 6: Friend Code System

### 6.1 How It Works

Each user gets an auto-generated 8-character code like `XKCD7M3N`.

**Uses:**
1. **Share for discovery**: "Add me on OpenClique: XKCD7M3N"
2. **Direct lookup**: Search by code to find exact user
3. **Invite to clique**: Use code to send direct clique invitation

### 6.2 UI: Friend Code Card

On Profile page (MeTab or new section):

```text
┌─────────────────────────────────────┐
│ Your Friend Code                    │
│                                     │
│    ┌───────────────────────────┐    │
│    │  XKCD-7M3N                │    │
│    └───────────────────────────┘    │
│    [📋 Copy]  [📤 Share]            │
│                                     │
│ Share this code so friends can      │
│ find you and invite you to cliques. │
└─────────────────────────────────────┘
```

### 6.3 Add by Friend Code Flow

```text
┌─────────────────────────────────────┐
│ Add by Friend Code                  │
├─────────────────────────────────────┤
│ [Enter friend code: __________ ]    │
│                                     │
│ [Search]                            │
│                                     │
│ Found:                              │
│ ┌─────────────────────────────────┐ │
│ │ [S]  Sarah M.      @sarahm      │ │
│ │ [Invite to Clique] [Poke] [Send Quest] │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Database & Auth (Sprint 1)
1. Add `username` and `friend_code` to profiles schema
2. Create `user_interactions` and `clique_invitations` tables
3. Add password confirmation to Auth.tsx
4. Create username availability check function

### Phase 2: Profile & Identity (Sprint 1)
5. Build `UsernameInput.tsx` component
6. Update `ProfileModal.tsx` and `ProfileEditModal.tsx`
7. Build `FriendCodeCard.tsx`
8. Integrate into Profile page

### Phase 3: User Search (Sprint 2)
9. Create `search_users()` database function
10. Build `UserSearch.tsx` page
11. Add `/users` route to App.tsx
12. Build `UserSearchCard.tsx` and `UserProfilePreview.tsx`

### Phase 4: Social Interactions (Sprint 2)
13. Build `PokeButton.tsx`, `InviteToCliqueDialog.tsx`, `SendQuestDialog.tsx`
14. Create interaction triggers and notifications
15. Update notification types and UI
16. Build `InteractionFeed.tsx` for profile

### Phase 5: Admin Tools (Sprint 3)
17. Build `AdminUserProfileDrawer.tsx`
18. Add User Directory tab to ModerationDashboard
19. Make usernames clickable across admin panels
20. Add interaction/invitation analytics

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/profile/UsernameInput.tsx` | Username field with availability |
| `src/components/profile/FriendCodeCard.tsx` | Display/share friend code |
| `src/components/social/UserSearchCard.tsx` | Search result card |
| `src/components/social/UserProfilePreview.tsx` | Quick-view drawer |
| `src/components/social/PokeButton.tsx` | Send poke interaction |
| `src/components/social/InviteToCliqueDialog.tsx` | Invite user to clique |
| `src/components/social/SendQuestDialog.tsx` | Share quest with user |
| `src/components/social/InteractionFeed.tsx` | Show received interactions |
| `src/components/admin/AdminUserProfileDrawer.tsx` | Admin user detail view |
| `src/components/admin/AdminUserDirectory.tsx` | Searchable user list |
| `src/pages/UserSearch.tsx` | `/users` route |
| `src/hooks/useUsernameAvailability.ts` | Debounced check |
| `src/hooks/useUserSearch.ts` | Search hook |
| `src/hooks/useUserInteractions.ts` | Interaction CRUD |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Auth.tsx` | Add confirmPassword field |
| `src/components/ProfileModal.tsx` | Add username field |
| `src/components/ProfileEditModal.tsx` | Add username field |
| `src/pages/Profile.tsx` | Add FriendCodeCard |
| `src/components/profile/MeTab.tsx` | Add friend code section |
| `src/components/admin/ModerationDashboard.tsx` | Add User Directory tab |
| `src/components/admin/AdminReportsQueuePanel.tsx` | Clickable usernames |
| `src/components/admin/AdminSOSAlertsPanel.tsx` | Clickable usernames |
| `src/hooks/useNotifications.ts` | Add interaction types |
| `src/pages/Notifications.tsx` | Add interaction icons/labels |
| `src/App.tsx` | Add `/users` route |

---

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| Username squatting | Reserved words list, rate limit changes (1/30 days) |
| Interaction spam | 10/day limit, 1/pair/day for same type |
| Creep behavior | Blocking prevents all interactions |
| Friend code brute force | 8-char = ~2 trillion combinations |
| Privacy leakage | Search respects profile_visible setting |
| Admin abuse | All admin profile views logged to audit table |

---

## Analytics & Insights (Admin)

New metrics available in admin dashboard:

| Metric | Description |
|--------|-------------|
| Interactions/day | Total pokes, waves, quest shares, invites |
| Conversion rate | Clique invites → acceptances |
| Most active inviters | Users sending most clique invites |
| Search popularity | Most searched terms |
| Friend code usage | Codes looked up vs. successful finds |

These feed into the existing analytics framework without new infrastructure.

---

## Key Design Decisions

### Why No DMs?
- **Creep prevention**: Structured interactions can't contain inappropriate content
- **Bot resistance**: Rate limits and structured actions deter automation
- **Focus**: Keeps real conversation inside cliques where context exists
- **Safety**: All interactions are visible in notifications, never private

### Why Friend Codes?
- **Privacy**: Share code without sharing email or full name
- **Precision**: Exact lookup vs. fuzzy name search
- **Shareability**: Easy to text, say out loud, put on social media
- **Regenerable**: Can get new code if compromised

### Why Rate Limits?
- **Quality over quantity**: 10/day forces intentional interactions
- **Spam prevention**: Can't mass-poke hundreds of users
- **Creep deterrent**: Limited harassment surface area
