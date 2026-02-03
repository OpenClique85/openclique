
# Follow Function for Quest Creators and Brands

## Overview

This plan implements a "Follow" system allowing users to subscribe to quest creators and brand (sponsor) accounts. Followers can discover new quests through a dedicated "Following" feed without push notifications, while creators and brands gain social proof through follower counts.

---

## Part 1: Database Schema

### 1.1 New Table: `user_follows`

```sql
CREATE TABLE user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Polymorphic target: either a creator OR a sponsor (not both)
  creator_id UUID REFERENCES creator_profiles(id) ON DELETE CASCADE,
  sponsor_id UUID REFERENCES sponsor_profiles(id) ON DELETE CASCADE,
  
  -- Notification preferences (future opt-in)
  notify_new_quests BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT follow_has_target CHECK (
    (creator_id IS NOT NULL AND sponsor_id IS NULL) OR
    (creator_id IS NULL AND sponsor_id IS NOT NULL)
  ),
  CONSTRAINT unique_creator_follow UNIQUE (follower_id, creator_id),
  CONSTRAINT unique_sponsor_follow UNIQUE (follower_id, sponsor_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_creator ON user_follows(creator_id) WHERE creator_id IS NOT NULL;
CREATE INDEX idx_user_follows_sponsor ON user_follows(sponsor_id) WHERE sponsor_id IS NOT NULL;

-- RLS Policies
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own follows"
  ON user_follows FOR SELECT
  USING (follower_id = auth.uid());

CREATE POLICY "Users can view follower counts (public)"
  ON user_follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow/unfollow"
  ON user_follows FOR INSERT
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can unfollow"
  ON user_follows FOR DELETE
  USING (follower_id = auth.uid());
```

### 1.2 Follower Count Materialized View

For performance when displaying follower counts on profiles:

```sql
-- Function to get follower counts
CREATE OR REPLACE FUNCTION get_creator_follower_count(p_creator_id UUID)
RETURNS BIGINT AS $$
  SELECT COUNT(*) FROM user_follows WHERE creator_id = p_creator_id;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_sponsor_follower_count(p_sponsor_id UUID)
RETURNS BIGINT AS $$
  SELECT COUNT(*) FROM user_follows WHERE sponsor_id = p_sponsor_id;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
```

---

## Part 2: React Hooks

### 2.1 `useFollows.ts`

| Function | Purpose |
|----------|---------|
| `useIsFollowing(type, id)` | Check if current user follows a creator/sponsor |
| `useFollowCreator()` | Mutation to follow a creator |
| `useUnfollowCreator()` | Mutation to unfollow a creator |
| `useFollowSponsor()` | Mutation to follow a sponsor |
| `useUnfollowSponsor()` | Mutation to unfollow a sponsor |
| `useFollowedCreators()` | List all creators the user follows |
| `useFollowedSponsors()` | List all sponsors the user follows |
| `useFollowerCount(type, id)` | Get follower count for a creator/sponsor |

### 2.2 `useFollowingFeed.ts`

Fetches quests from all followed creators and sponsors, sorted by newest first:

```typescript
interface FollowingFeedQuest extends Quest {
  source: {
    type: 'creator' | 'sponsor';
    id: string;
    name: string;
    slug: string;
  };
  contactsJoined: number; // How many of user's contacts signed up
}
```

---

## Part 3: UI Components

### 3.1 `FollowButton.tsx`

A reusable button component for creator/sponsor profiles:

```text
┌─────────────────┐     ┌─────────────────┐
│ [♡] Follow      │ ──► │ [✓] Following   │
└─────────────────┘     └─────────────────┘
     (not following)         (following)
```

**Props:**
- `type: 'creator' | 'sponsor'`
- `targetId: string`
- `size?: 'sm' | 'md' | 'lg'`
- `variant?: 'default' | 'outline'`

### 3.2 `FollowerCountBadge.tsx`

Displays follower count with appropriate formatting:
- Under 1000: exact number (e.g., "247 followers")
- 1000+: abbreviated (e.g., "1.2k followers")

### 3.3 `FollowingFeedRow.tsx`

A new row type for the Netflix-style quest discovery:

```text
┌──────────────────────────────────────────────────────────────┐
│ From Creators & Brands You Follow                        (8) │
├──────────────────────────────────────────────────────────────┤
│ [Quest Card]  [Quest Card]  [Quest Card]  [Quest Card] ──►   │
│   by Nike       by @chef_sarah  by @yoga_guru  by REI        │
└──────────────────────────────────────────────────────────────┘
```

Each card shows:
- Source attribution (creator name or brand logo)
- Quest date, difficulty
- Contacts joined indicator (if any)

### 3.4 `FollowingFilterToggle.tsx`

A filter toggle for the quest discovery page:

```text
[All Quests] [Following Only]
```

When "Following Only" is active, only quests from followed accounts appear.

---

## Part 4: Profile Page Integration

### 4.1 Creator Public Profile (`CreatorPublicProfile.tsx`)

Add Follow button and follower count to hero section:

```text
┌─────────────────────────────────────────────────────┐
│  [Avatar]  Chef Sarah Martinez                      │
│            @chef_sarah                              │
│            Austin, TX                               │
│                                                     │
│            247 followers                            │
│            [Follow]                                 │
├─────────────────────────────────────────────────────┤
│  Stats: 12 Quests | 340 Participants | ★ 4.8       │
└─────────────────────────────────────────────────────┘
```

### 4.2 Sponsor Public Profile (`SponsorPublicProfile.tsx`)

Same pattern as creator profile:

```text
┌─────────────────────────────────────────────────────┐
│  [Logo]  Nike Austin                                │
│          Brand & Venue                              │
│          1.2k followers                             │
│          [Follow]                                   │
└─────────────────────────────────────────────────────┘
```

---

## Part 5: Quest Discovery Integration

### 5.1 Update `Quests.tsx`

Add "Following" row to Netflix-style layout:

```typescript
// In questGroups calculation
const followingQuests = filteredQuests.filter(quest => {
  // Check if creator_id or sponsor_id is in user's followed list
  return followedCreatorIds.has(quest.creatorId) || 
         followedSponsorIds.has(quest.sponsorId);
});

// Render order:
// 1. "From People You Follow" (if user follows anyone and has quests)
// 2. "Happening This Week"
// 3. Category rows
// 4. Creator rows
```

### 5.2 Update `QuestFilterBar.tsx`

Add "Following" filter option:

```typescript
export interface QuestFilters {
  // ... existing filters
  followingOnly: boolean;  // NEW
}
```

UI:
```text
┌─────────────────────────────────────────────────────┐
│ 🔍 [Search quests...]          [Starting Soon ▾]   │
├─────────────────────────────────────────────────────┤
│ [Following] [Culture] [Wellness] [Social]          │
└─────────────────────────────────────────────────────┘
```

"Following" is a special toggle that:
- Appears first when user follows at least one account
- Shows only quests from followed creators/sponsors when active
- Displays count of available quests

---

## Part 6: Contact Social Proof

### 6.1 Quest Card Enhancement

Show how many of the user's contacts have joined:

```text
┌─────────────────────────────┐
│ [Quest Image]               │
│ 🍜 Ramen Quest              │
│ Mar 15 • Austin             │
│                             │
│ 👥 2 contacts interested    │  ← NEW
└─────────────────────────────┘
```

This leverages the existing contacts system:
1. Fetch user's accepted contacts
2. Cross-reference with quest signups
3. Display count (or nothing if 0)

---

## Part 7: Anti-Spam Mechanics

### 7.1 Feed Diversity Rules

Prevent any single creator/sponsor from dominating the Following feed:

```typescript
// In useFollowingFeed.ts
const diversifyFeed = (quests: FollowingFeedQuest[]) => {
  const MAX_PER_SOURCE = 3; // Max 3 quests per creator/sponsor in feed
  const seen = new Map<string, number>();
  
  return quests.filter(quest => {
    const key = `${quest.source.type}_${quest.source.id}`;
    const count = seen.get(key) || 0;
    if (count >= MAX_PER_SOURCE) return false;
    seen.set(key, count + 1);
    return true;
  });
};
```

### 7.2 No Push Notifications by Default

The `notify_new_quests` column defaults to `false`. Users browse the Following feed on their own schedule.

Future enhancement: Per-creator notification toggle:
```text
┌─────────────────────────────────────────────────────┐
│ [Following ✓]  [🔔 Get notified]                   │
└─────────────────────────────────────────────────────┘
```

---

## Part 8: Analytics & Social Proof

### 8.1 Creator Analytics

Add follower metrics to creator dashboard (`CreatorAnalytics.tsx`):

| Metric | Description |
|--------|-------------|
| Total Followers | Current follower count |
| Follower Growth | Week-over-week change |
| Follower → Signup Rate | % of followers who sign up for quests |

### 8.2 Sponsor Analytics

Same metrics in sponsor dashboard.

---

## Implementation Phases

### Phase 1: Database & Core Hooks (This Sprint)
1. Create `user_follows` table with RLS
2. Create follower count functions
3. Build `useFollows.ts` hooks
4. Build `useFollowingFeed.ts` hook

### Phase 2: Profile Integration (This Sprint)
5. Create `FollowButton.tsx` component
6. Create `FollowerCountBadge.tsx` component
7. Update `CreatorPublicProfile.tsx` with follow button + count
8. Update `SponsorPublicProfile.tsx` with follow button + count

### Phase 3: Quest Discovery (This Sprint)
9. Update `QuestFilterBar.tsx` with Following toggle
10. Update `Quests.tsx` with Following row
11. Create `FollowingFeedRow.tsx` component
12. Add contacts-joined indicator to quest cards

### Phase 4: Analytics (Future)
13. Add follower metrics to creator/sponsor dashboards
14. Build follower growth charts
15. Create conversion tracking (follower → signup)

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useFollows.ts` | Follow/unfollow mutations and queries |
| `src/hooks/useFollowingFeed.ts` | Fetch quests from followed accounts |
| `src/components/social/FollowButton.tsx` | Reusable follow/unfollow button |
| `src/components/social/FollowerCountBadge.tsx` | Display formatted follower count |
| `src/components/quests/FollowingFeedRow.tsx` | Netflix-style row for following feed |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/CreatorPublicProfile.tsx` | Add FollowButton, FollowerCountBadge |
| `src/pages/SponsorPublicProfile.tsx` | Add FollowButton, FollowerCountBadge |
| `src/pages/Quests.tsx` | Add Following row to Netflix layout |
| `src/components/QuestFilterBar.tsx` | Add "Following" filter toggle |
| `src/components/QuestCard.tsx` | Add contacts-joined indicator |

---

## Technical Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                     user_follows table                      │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐ │
│  │ follower_id │ creator_id  │ sponsor_id  │ notify_     │ │
│  │ (required)  │ (nullable)  │ (nullable)  │ new_quests  │ │
│  └──────┬──────┴──────┬──────┴──────┬──────┴─────────────┘ │
│         │             │             │                       │
│         ▼             ▼             ▼                       │
│   auth.users   creator_profiles  sponsor_profiles          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Data Flow                                │
│                                                             │
│  CreatorPublicProfile ──► FollowButton ──► useFollows      │
│                               │                             │
│                               ▼                             │
│                        user_follows                         │
│                               │                             │
│                               ▼                             │
│                      useFollowingFeed                       │
│                               │                             │
│                               ▼                             │
│                     Quests.tsx (feed)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| Follow spam | Rate limit via RLS (same user can't follow same target twice) |
| Fake follower counts | All follows require authenticated user |
| Privacy | Users can only see their own follow list; counts are public |
| Manipulation | No public API for bulk operations |

---

## Key Design Decisions

### Why No Push Notifications?
- Users stay in control of their attention
- Prevents notification fatigue
- Following feed becomes a "pull" experience
- Future opt-in per-creator keeps it intentional

### Why Polymorphic Table?
- Single `user_follows` table handles both creators and sponsors
- Simpler queries for the "Following" feed
- Easier to add new followable entity types later

### Why Follower Counts Are Public?
- Social proof for creators/brands
- Helps users discover popular accounts
- Enables brand partnership matching

### Why Limit Feed Diversity?
- Prevents a prolific creator from drowning out others
- Encourages variety in the Following experience
- Mirrors how streaming services prevent binge-listing from one source
