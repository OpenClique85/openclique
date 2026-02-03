
# Fix Quest Classification and Enable External Quest Sharing

## Status: ✅ COMPLETED

## Overview

This plan addressed two related issues:
1. **Quests appearing as "Past" incorrectly** - Fixed! Multi-day quests now show correctly based on end_datetime
2. **Sharing quests with non-OpenClique users** - Fixed! Links now use PUBLISHED_URL and Auth accepts ?quest=slug parameter

---

## Implementation Summary

### Part 1: Fixed Quest Temporal Classification ✅

**Changes made:**
- Updated `src/components/profile/QuestsTab.tsx` with three-way classification:
  - **Today / Live**: Quests starting today OR currently running (between start and end)
  - **Upcoming**: Future quests
  - **Past**: Quests whose `end_datetime` has passed

- Added new "Today / Happening Now" section with live stats

### Part 2: External Quest Sharing ✅

**Changes made:**
- Fixed `src/components/ShareQuestButton.tsx`:
  - Now uses `getPublishedUrl()` from `@/lib/config` for consistent links
  - Works for both logged-in users (with referral tracking) and anonymous users
  - Added native share support for mobile devices

- Updated `src/pages/Auth.tsx`:
  - Now accepts `?quest=slug` parameter
  - After signup, redirects to `/quests/{slug}` instead of `/profile`
  - Shows contextual message about the quest redirect

### New Components ✅

- Created `src/components/profile/ActiveQuestCard.tsx`:
  - Rich card with live signup/squad counts via `useQuestStats`
  - Journey timeline visualization
  - Share and Recruit Friend buttons
  - Popular badge for 5+ signups

---

## Files Modified

| File | Changes |
|------|---------|
| `src/components/profile/QuestsTab.tsx` | Three-way temporal classification, Today/Live section, uses ActiveQuestCard |
| `src/components/ShareQuestButton.tsx` | Uses PUBLISHED_URL, native share, works without auth |
| `src/pages/Auth.tsx` | Handles `?quest=slug` for post-signup redirect |

## Files Created

| File | Purpose |
|------|---------|
| `src/components/profile/ActiveQuestCard.tsx` | Rich card with live stats and action buttons |

---

## Expected Results

### Quest Classification
- "Party at Moontower" (Feb 2-28) → Shows in **"Today / Happening Now"** during the event ✅
- "Trivia Night" (Feb 3, 7pm-11pm) → Shows in **"Today / Happening Now"** on Feb 3 ✅
- Quest that ended → Shows in **"Past Quests"** ✅

### External Sharing
- Any user can generate shareable quest links ✅
- Links work for non-users (public quest detail pages) ✅
- After signup, users are redirected to the quest they were viewing ✅
- Referral tracking works for logged-in sharers ✅

### Mobile Experience
- Native share sheet on iOS/Android ✅
- Fallback to copy button on desktop ✅

