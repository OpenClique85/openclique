
# Mobile UX Critical Fixes + Homepage CTA Clarity

## Overview

This plan addresses three categories of issues reported during user testing:

1. **Mobile collision issues** - Tutorial popup blocked by bottom nav
2. **Quest flow problems** - Wrong redirects, stale UI state
3. **Homepage CTA clarity** - "Join Now" instead of "Find Your Quest", clear sign-up emphasis for first-time users

---

## Issues & Solutions

### Issue 1: Tutorial Prompt Blocked by Mobile Nav

**Problem**: The `TutorialPrompt` uses `bottom-4` positioning, placing it directly behind the `MobileActionBar` (which is 64px + safe area). Users can only click the very top edge.

**Solution**: Add mobile-specific bottom positioning to clear the nav bar.

**File**: `src/components/tutorial/TutorialPrompt.tsx`

| Current | Fixed |
|---------|-------|
| `fixed bottom-4 right-4 z-50` | `fixed bottom-20 md:bottom-4 right-4 z-[60]` |

The `bottom-20` (80px) clears the 64px nav bar plus safe area on mobile. The `z-[60]` ensures it appears above the nav (z-50).

---

### Issue 2: Quest Join Redirects to Wrong Page

**Problem**: After joining a quest, users are redirected to `/my-quests` (line 269 in QuestDetail.tsx), but this page no longer exists. The Profile Hub at `/profile?tab=quests` is now the canonical location.

**Solution**: Update the redirect path.

**File**: `src/pages/QuestDetail.tsx` (line 269)

| Current | Fixed |
|---------|-------|
| `navigate('/my-quests')` | `navigate('/profile?tab=quests')` |

Also update the "View My Quests" button (line 566) to navigate to the correct path.

---

### Issue 3: Homepage CTA - "Join Now" Clarity

**Problem**: The primary CTA says "Find Your Quest" which is browse-focused. First-time visitors need a clearer call to sign up. The "Sign Up" vs "Sign In" distinction is also unclear.

**Solution**: Update the Hero section to have a stronger "Join Now" CTA that leads directly to the auth page with signup pre-selected.

**File**: `src/constants/content.ts` (HERO object)

| Current | Fixed |
|---------|-------|
| `primaryCta: "Find Your Quest"` | `primaryCta: "Join Now — It's Free"` |

**File**: `src/components/Hero.tsx`

Change the primary CTA from linking to `/quests` to `/auth?signup=true`:
```tsx
<Link to="/auth?signup=true">{HERO.primaryCta}</Link>
```

**File**: `src/pages/Auth.tsx`

Handle `?signup=true` query param to default to the Sign Up tab:
```tsx
const signupFlag = searchParams.get('signup');
// ...
<Tabs defaultValue={signupFlag || inviteCode ? "signup" : "signin"}>
```

---

### Issue 4: Sign Up Tab More Prominent

**Problem**: First-time users see "Sign In" as the default tab, which is confusing. Sign Up should be more prominent for new users.

**Solution**: In addition to the `?signup=true` flag handling above, make visual improvements to the auth page:

**File**: `src/pages/Auth.tsx`

- Change the tab order to put "Sign Up" first (leftmost position)
- Update tab styling to highlight Sign Up more prominently when it's the default
- Change the card description for sign-up focused contexts

---

### Issue 5: FindPeopleSection Text Overflow

**Problem**: The "Search by @username or friend code" text overflows on small mobile screens.

**Solution**: Add responsive text handling.

**File**: `src/components/profile/FindPeopleSection.tsx` (lines 148-149)

```tsx
// Current
<span className="text-xs text-muted-foreground">
  {searchOpen ? 'Close' : 'Search by @username or friend code'}
</span>

// Fixed
<span className="text-xs text-muted-foreground hidden sm:inline">
  {searchOpen ? 'Close' : 'Search by @username or code'}
</span>
```

---

### Issue 6: ContinueYourJourney Too Dense on Mobile

**Problem**: The 3-column grid of progression trees is too dense on mobile, and the "Begin Your Adventure" section is redundant with the quests section.

**Solution**: Make the grid responsive and simplify mobile view.

**File**: `src/components/progression/ContinueYourJourney.tsx` (line 172)

```tsx
// Current
<div className="grid gap-4 md:grid-cols-3 mb-6">

// Fixed - stack on mobile, 2 cols on tablet, 3 on desktop
<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-6">
```

Also simplify the encouragement card for mobile by hiding the extra description.

---

### Issue 7: Profile Page Tab Overflow

**Problem**: The 5-tab TabsList overflows on small screens, making tabs hard to tap.

**Solution**: Use icon-only on mobile with horizontal scroll as fallback.

**File**: `src/pages/Profile.tsx` (lines 135-156)

```tsx
// Add horizontal scroll wrapper
<TabsList className="grid w-full grid-cols-5 overflow-x-auto">
  <TabsTrigger value="cliques" className="flex items-center gap-1 px-2 sm:gap-2 sm:px-3">
    <Users className="h-4 w-4 shrink-0" />
    <span className="hidden sm:inline text-xs sm:text-sm">Cliques</span>
  </TabsTrigger>
  {/* ... same pattern for other tabs */}
</TabsList>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/tutorial/TutorialPrompt.tsx` | Add `bottom-20 md:bottom-4` and increase z-index |
| `src/pages/QuestDetail.tsx` | Fix redirects from `/my-quests` to `/profile?tab=quests` |
| `src/constants/content.ts` | Change `primaryCta` to "Join Now — It's Free" |
| `src/components/Hero.tsx` | Link primary CTA to `/auth?signup=true` |
| `src/pages/Auth.tsx` | Handle `?signup=true` param, swap tab order |
| `src/components/profile/FindPeopleSection.tsx` | Hide helper text on mobile |
| `src/components/progression/ContinueYourJourney.tsx` | Responsive grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` |
| `src/pages/Profile.tsx` | Icon-only tabs on mobile with horizontal scroll |

---

## Technical Details

### TutorialPrompt Z-Index Calculation
- MobileActionBar: `z-50`
- TutorialPrompt (new): `z-[60]`
- This ensures the tutorial appears above the nav bar

### Auth Page Tab Default Logic
```tsx
const signupFlag = searchParams.get('signup') === 'true';
const defaultTab = signupFlag || inviteCode || questSlug ? 'signup' : 'signin';
```

### Profile Tabs Mobile Layout
On screens < 640px (sm breakpoint):
- Show only icons (no labels)
- Each tab gets equal 20% width via `grid-cols-5`
- Ensure minimum tap target of 44px height

---

## Expected Results

After implementation:
- Tutorial prompt appears above the mobile nav and is fully clickable
- After joining a quest, users land on their quest hub in the profile
- Homepage has a clear "Join Now" CTA that goes directly to sign up
- Sign Up is the default/first tab for new visitors
- Mobile layouts have proper spacing with no text overflow
- Profile tabs are usable on all screen sizes
