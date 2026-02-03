
# Execute Mobile UX Fixes + Homepage CTA Clarity

Based on my analysis of the codebase, here are the specific changes ready for implementation:

## 1. Tutorial Prompt - Fix Mobile Nav Collision
**File**: `src/components/tutorial/TutorialPrompt.tsx` (line 35)

| Current | Fixed |
|---------|-------|
| `fixed bottom-4 right-4 z-50` | `fixed bottom-20 md:bottom-4 right-4 z-[60]` |

The `bottom-20` (80px) clears the MobileActionBar (64px + safe area) on small screens. Z-index increased to 60 to appear above the nav bar.

---

## 2. Homepage CTA - "Join Now" Clarity
**File**: `src/constants/content.ts` (line 223)

| Current | Fixed |
|---------|-------|
| `primaryCta: "Find Your Quest"` | `primaryCta: "Join Now — It's Free"` |

**File**: `src/components/Hero.tsx` (line 122)

| Current | Fixed |
|---------|-------|
| `<Link to="/quests">` | `<Link to="/auth?signup=true">` |

---

## 3. Auth Page - Default to Sign Up Tab
**File**: `src/pages/Auth.tsx` (line 410)

Add `signup` flag handling and swap tab order:
```tsx
const signupFlag = searchParams.get('signup') === 'true';
// ...
<Tabs defaultValue={signupFlag || inviteCode || questSlug ? "signup" : "signin"}>
  <TabsList className="grid w-full grid-cols-2">
    <TabsTrigger value="signup">Sign Up</TabsTrigger>
    <TabsTrigger value="signin">Sign In</TabsTrigger>
  </TabsList>
```

---

## 4. Quest Join Redirect Fix
**File**: `src/pages/QuestDetail.tsx` (line 269)

| Current | Fixed |
|---------|-------|
| `navigate('/my-quests')` | `navigate('/profile?tab=quests')` |

---

## 5. FindPeopleSection Text Overflow
**File**: `src/components/profile/FindPeopleSection.tsx` (line 148-149)

| Current | Fixed |
|---------|-------|
| `text-xs text-muted-foreground` | `text-xs text-muted-foreground hidden sm:inline` |
| `'Search by @username or friend code'` | `'Search by @username or code'` |

---

## 6. ContinueYourJourney Responsive Grid
**File**: `src/components/progression/ContinueYourJourney.tsx` (line 172)

| Current | Fixed |
|---------|-------|
| `grid gap-4 md:grid-cols-3` | `grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` |

---

## 7. Profile Page Tabs - Icon-Only on Mobile
**File**: `src/pages/Profile.tsx` (lines 135-156)

Change to icon-only tabs on mobile with responsive text:
```tsx
<TabsList className="grid w-full grid-cols-5 h-auto">
  <TabsTrigger value="cliques" className="flex items-center gap-1 px-2 py-2 sm:gap-2 sm:px-3">
    <Users className="h-4 w-4 shrink-0" />
    <span className="hidden sm:inline text-xs sm:text-sm">Cliques</span>
  </TabsTrigger>
  {/* Same pattern for all 5 tabs */}
</TabsList>
```

---

## Summary of Files to Modify

| File | Change |
|------|--------|
| `src/components/tutorial/TutorialPrompt.tsx` | Add mobile bottom padding + z-index |
| `src/constants/content.ts` | Change CTA to "Join Now — It's Free" |
| `src/components/Hero.tsx` | Link to `/auth?signup=true` |
| `src/pages/Auth.tsx` | Handle `?signup=true`, swap tab order |
| `src/pages/QuestDetail.tsx` | Fix redirect to `/profile?tab=quests` |
| `src/components/profile/FindPeopleSection.tsx` | Hide helper text on mobile |
| `src/components/progression/ContinueYourJourney.tsx` | Responsive grid layout |
| `src/pages/Profile.tsx` | Icon-only tabs on mobile |

Click **Approve** to implement these changes.
