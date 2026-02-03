
# Fix Quest Classification and Enable External Quest Sharing

## Overview

This plan addresses two related issues:
1. **Quests appearing as "Past" incorrectly** - Multi-day quests (like Feb 2-28) show in "Past Quests" when they're still ongoing
2. **Sharing quests with non-OpenClique users** - Need shareable links that non-members can click to view the quest, then create an account and be automatically redirected back to that quest

---

## Part 1: Fix Quest Temporal Classification

### Current Problem
The QuestsTab only checks `start_datetime`:
```javascript
// Current broken logic
const upcomingSignups = signups.filter(s => {
  return new Date(s.quest.start_datetime) >= now;  // Ignores end_datetime!
});
```

A quest running Feb 2-28 shows as "Past" on Feb 3 because the start date has passed.

### Solution
Implement three-way classification using both `start_datetime` AND `end_datetime`:

| Category | Criteria |
|----------|----------|
| **Today / Live** | Quest starts today OR currently between start and end |
| **Upcoming** | Quest starts in the future |
| **Past** | Quest's `end_datetime` (or start if no end) has passed |

### New Classification Logic
```javascript
const classifySignup = (signup) => {
  const startDate = signup.quest.start_datetime 
    ? new Date(signup.quest.start_datetime) 
    : null;
  const endDate = signup.quest.end_datetime 
    ? new Date(signup.quest.end_datetime) 
    : startDate; // Fallback to start if no end specified
  
  // Dropped/no-show always past
  if (signup.status === 'dropped' || signup.status === 'no_show') return 'past';
  
  // Quest has ended (end_datetime passed)
  if (endDate && endDate < now) return 'past';
  
  // No date = treat as upcoming
  if (!startDate) return 'upcoming';
  
  // Check if quest is "today" (starts today OR currently running)
  const isToday = startDate.toDateString() === now.toDateString();
  const isOngoing = startDate <= now && endDate && endDate >= now;
  
  if (isToday || isOngoing) return 'today';
  
  return 'upcoming';
};
```

### UI Changes
- Add a new "Today / Happening Now" section above "Upcoming"
- Show live stats: "X signed up", "X squads forming"
- Add action buttons for active quests (Invite Friends, View Details)

---

## Part 2: External Quest Sharing

### Goal
Allow users to share quest links with people who **don't have OpenClique accounts**. The flow:

1. User clicks "Share Quest" 
2. Gets a link like `https://openclique.lovable.app/quests/trivia-night?ref=SHARE-ABC123`
3. Non-user clicks link → sees quest preview
4. Non-user clicks "Join Quest" → redirected to `/auth` with return path
5. After signup → auto-redirected back to quest with signup flow

### Current State Analysis
- `ShareQuestButton` uses `window.location.origin` instead of `PUBLISHED_URL` (bug!)
- Links work for viewing (quest detail page is public), but don't preserve context well
- `RecruitFriendButton` links to `/auth?invite=CODE`, not directly to quest

### Solution: Unified Quest Share System

#### 1. Fix ShareQuestButton to Use Production URL
Update to use the centralized `PUBLISHED_URL` constant for consistency:
```javascript
// Current (broken)
const link = `${window.location.origin}/quests/${quest.slug}`;

// Fixed
import { PUBLISHED_URL } from '@/lib/config';
const link = `${PUBLISHED_URL}/quests/${quest.slug}?ref=${code}`;
```

#### 2. Create Simple Guest Share Link
Add a new share mode that works without requiring authentication to generate:
- Direct quest links: `https://openclique.lovable.app/quests/trivia-night`
- Tracked links (if logged in): `https://openclique.lovable.app/quests/trivia-night?ref=CODE`

#### 3. Enhance Auth Flow to Preserve Quest Context
Update the Auth page to:
- Accept `?quest=slug` parameter
- After successful signup, redirect to `/quests/{slug}` instead of `/my-quests`
- Allow auto-join flow for the quest

#### 4. Add Native Share + Copy for Mobile
```javascript
const shareLink = `${PUBLISHED_URL}/quests/${quest.slug}?ref=${code}`;

// Native share (mobile)
if (navigator.share) {
  await navigator.share({
    title: quest.title,
    text: `Check out ${quest.title} on OpenClique!`,
    url: shareLink,
  });
}
```

---

## Technical Implementation

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/profile/QuestsTab.tsx` | Fix temporal classification, add "Today/Live" section, integrate quest stats |
| `src/components/ShareQuestButton.tsx` | Use `PUBLISHED_URL`, support anonymous sharing, add native share |
| `src/pages/Auth.tsx` | Handle `?quest=slug` param for post-signup redirect |

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/profile/ActiveQuestCard.tsx` | Rich card for today/upcoming quests with stats and actions |

---

## Database Changes
None required - existing schema supports all needed functionality.

---

## Expected Results

### Quest Classification
- "Party at Moontower" (Feb 2-28) → Shows in **"Today / Happening Now"** during the event
- "Trivia Night" (Feb 3, 7pm-11pm) → Shows in **"Today / Happening Now"** on Feb 3
- Quest that ended → Shows in **"Past Quests"**

### External Sharing
- Any user can generate shareable quest links
- Links work for non-users (public quest detail pages)
- After signup, users are redirected to the quest they were viewing
- Referral tracking works for logged-in sharers

### Mobile Experience
- Native share sheet on iOS/Android
- Fallback to copy button on desktop
