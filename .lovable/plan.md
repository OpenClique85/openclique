
# Tutorial Quest: Solo Walkthrough with Strong Nudge

## Overview
A self-contained, solo interactive tutorial that teaches users the core quest mechanics (lobby, ice-breaker prompt, photo submission, quest timeline) through a guided walkthrough narrated by BUGGS. It requires no admin involvement -- users start and complete it entirely on their own.

## Database Changes

### Add columns to `profiles` table
- `tutorial_quest_completed_at` (timestamptz, nullable) -- when the tutorial quest was finished
- `tutorial_quest_step` (int, default 0) -- tracks progress so users can resume
- `tutorial_quest_dismissed_count` (int, default 0) -- how many times the nudge banner was dismissed (stops showing after 3)

No new tables needed. The existing `award_xp` RPC handles XP rewards.

---

## New Files

### 1. `src/pages/TutorialQuest.tsx`
Full-page protected route at `/tutorial-quest`. Contains:
- A progress bar (5 dots) at the top
- Step content area in the center
- Back/Next navigation at the bottom
- "Skip Tutorial" link in the top-right corner (with confirmation dialog)
- Mobile-first layout (works great on all screen sizes)
- On completion: calls `award_xp` with 50 XP, sets `tutorial_quest_completed_at`, navigates to `/quests`

### 2. `src/components/tutorial-quest/TutorialQuestBanner.tsx`
Pinned banner shown at the top of the Quests page for users who haven't completed the tutorial. Features:
- BUGGS face image (from `buggs-face.png`) with speech bubble
- "Complete your training quest to get the most out of OpenClique!"
- Primary CTA: "Start Training Quest" linking to `/tutorial-quest`
- "Skip for now" dismiss button (increments `tutorial_quest_dismissed_count`)
- Hidden after 3 dismissals or after completion
- Warm, inviting design matching the app's teal/amber palette

### 3. `src/components/tutorial-quest/TutorialLobbyStep.tsx`
Simulated clique lobby showing:
- A mock clique card with 4 fake members (avatar placeholders, names, one trait badge each)
- BUGGS narrates: "This is your clique. Before each quest, you'll see who you're adventuring with."
- Highlights the member list, clique name, and role badges with subtle callouts
- "Got it" button to proceed

### 4. `src/components/tutorial-quest/TutorialPromptStep.tsx`
Ice-breaker practice:
- Shows a prompt card: "What's a food you could eat every day and never get tired of?"
- Text input area (requires 10+ characters to enable Next)
- BUGGS: "Before each quest, you'll answer a fun prompt so your clique gets to know you."
- Input is not saved anywhere -- purely practice

### 5. `src/components/tutorial-quest/TutorialPhotoStep.tsx`
Photo upload practice:
- Shows a camera/upload UI matching the real proof submission pattern
- Prompt: "Show us your current view -- wherever you are right now!"
- Accepts a photo via file input or camera (mobile)
- Photo is displayed as a preview but NOT persisted to storage
- BUGGS: "During quests, you submit photos as proof of completion."

### 6. `src/components/tutorial-quest/TutorialTimelineStep.tsx`
Quest journey walkthrough:
- Shows a vertical timeline with 4 stages: Recruiting, Warm-up, Live, Completed
- Each stage has a brief description of what happens
- Current stage is highlighted (animated)
- BUGGS: "Every quest follows this journey. You'll always know where you are."

### 7. `src/components/tutorial-quest/TutorialCompleteStep.tsx`
Celebration screen:
- Confetti-style animation (CSS keyframes, no external library)
- Large "You earned 50 XP!" badge with sparkle icon
- BUGGS (hopping pose): "You're ready! Go find your first real quest."
- Two CTAs: "Browse Quests" (primary) and "Set Up Profile" (secondary outline)

### 8. `src/components/admin/TutorialQuestAnalytics.tsx`
Admin analytics panel showing:
- Total users who completed the tutorial quest
- Completion rate (completed / total registered users)
- Average step reached (for users who dropped off)
- Dismissal rate (how many users dismissed the banner 3 times)
- Simple table of recent completions (user, date, time to complete)
- Data sourced directly from `profiles` table queries

---

## Modified Files

### `src/App.tsx`
- Add lazy import for `TutorialQuest` page
- Add protected route: `/tutorial-quest`

### `src/pages/Quests.tsx`
- Import and render `TutorialQuestBanner` above the quest content (after the header, before loading/quest rows)
- Banner only shows for authenticated users who haven't completed the tutorial

### `src/components/admin/AdminSectionNav.tsx`
- Add "Tutorial Analytics" tab to the "Growth" section

### `src/pages/Admin.tsx`
- Import `TutorialQuestAnalytics`
- Add `case 'tutorial-analytics'` to the `renderContent` switch

---

## BUGGS Integration
Each tutorial step uses the BUGGS face image (`src/assets/buggs-face.png`) displayed as a small avatar (40x40) with a speech bubble beside it. The completion step uses the hopping pose (`buggs-hopping.png`) for celebration. This matches the existing BUGGS patterns used in the Quests page and BuggsFloating component.

---

## Mobile-First Design
- All step components use responsive padding (`px-4 md:px-8`)
- Progress dots are touch-friendly (min 44px tap targets)
- Photo step uses `accept="image/*" capture="environment"` for native camera on mobile
- Navigation buttons are full-width on mobile, inline on desktop
- Banner on Quests page stacks vertically on small screens

---

## Privacy and Data
- No real quest entries, signups, or squad records are created
- The practice prompt answer is held in local component state only
- The practice photo is displayed as a blob URL preview, never uploaded
- Only profile columns are updated: `tutorial_quest_completed_at`, `tutorial_quest_step`, `tutorial_quest_dismissed_count`
- XP is awarded once via the existing `award_xp` RPC
