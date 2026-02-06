
# Public User Profile System

## Problem
Users can set their preferences (social style, interests, goals, vibe preferences, etc.) but these never appear publicly. When viewing other users in cliques or search results, you only see their name and city. There's no way to get a sense of who someone is before joining a group with them.

## Solution Overview
Create a rich public profile view that shows:
- Basic info (name, username, area, member since)
- Social vibe indicators (group size preference, energy level, etc.)
- Quest interests and preferences
- Public traits (from the algorithm)
- XP level and featured badges (if privacy allows)

All of this will respect user privacy settings.

---

## Database Changes

### 1. Create Enhanced Public Profile View
Replace the minimal `profiles_public` view with a richer one that includes:

```text
profiles_public (enhanced view)
├── id, display_name, username, city, created_at
├── visibility_level (from privacy_settings)
├── public_preferences (filtered JSONB with only shareable data)
│   ├── interests (quest types they like)
│   ├── social_style (group size, vibe preference)
│   ├── context_tags (new to city, remote/WFH, etc.)
│   └── demographics (area, school if show_school_publicly=true)
└── show_xp_and_badges flag
```

The view will:
- Return full data for "public" visibility users
- Return limited data for "squad-only" users (only visible to clique members - handled by frontend)
- Return placeholder for "private" users

### 2. Create Public User Traits View
A new `user_traits_public` view that joins `user_traits` with `trait_library` but only returns traits marked as `visibility = 'public'`:

```text
user_traits_public
├── user_id
├── trait_slug
├── display_name (from trait_library)
├── emoji
├── category
└── importance
```

---

## Frontend Changes

### 1. New Component: `UserPublicProfileDrawer`
**Location:** `src/components/social/UserPublicProfileDrawer.tsx`

A slide-out drawer (using Vaul) that displays:

```text
┌─────────────────────────────────────────┐
│  [Avatar]  Display Name      [@username]│
│            📍 East Austin               │
│            Member since Jan 2026        │
├─────────────────────────────────────────┤
│  💬 Social Vibe                         │
│  ┌─────┐ ┌─────┐ ┌─────┐               │
│  │Small│ │Chill│ │Slow │               │
│  │Group│ │Vibe │ │Warm │               │
│  └─────┘ └─────┘ └─────┘               │
├─────────────────────────────────────────┤
│  ✨ Interests                           │
│  🍽️ Food & Drink  🎵 Live Music        │
│  🌳 Outdoors                            │
├─────────────────────────────────────────┤
│  🧠 Algorithm Traits                    │
│  🏠 Cozy Energy  ⚖️ Balanced Explorer   │
├─────────────────────────────────────────┤
│  🏆 Level 4 • 450 XP                    │
│  [Badge] [Badge]                        │
├─────────────────────────────────────────┤
│  [Add Contact] [Invite to Clique] [Poke]│
└─────────────────────────────────────────┘
```

### 2. New Hook: `useUserPublicProfile`
**Location:** `src/hooks/useUserPublicProfile.ts`

Fetches:
- Public profile data from `profiles_public`
- Public traits from `user_traits_public`
- XP/level if privacy allows
- Featured badges if privacy allows

### 3. Integration Points
Update these locations to use the new drawer:
- `UserSearch.tsx` - the `handleViewProfile` function
- `CliqueDetail.tsx` - clicking on member names
- `UserSearchCard.tsx` - clicking the card
- `FindPeopleSection.tsx` - search results

---

## Privacy Enforcement

The system will respect these privacy settings:

| Privacy Setting | Effect on Public Profile |
|-----------------|-------------------------|
| `profile_visibility: public` | Full profile visible |
| `profile_visibility: squad-only` | Only visible to clique members |
| `profile_visibility: private` | Shows "Private User" placeholder |
| `show_xp_and_badges: false` | Hides XP level and badges |
| `demographics.show_school_publicly: false` | Hides school info |

Individual traits respect their own `visibility` field.

---

## Files to Create

1. `src/components/social/UserPublicProfileDrawer.tsx` - Main drawer component
2. `src/hooks/useUserPublicProfile.ts` - Data fetching hook
3. Database migration for enhanced `profiles_public` view
4. Database migration for new `user_traits_public` view

## Files to Modify

1. `src/pages/UserSearch.tsx` - Wire up drawer
2. `src/pages/CliqueDetail.tsx` - Add clickable member names
3. `src/components/social/UserSearchCard.tsx` - Already supports onClick, no change needed
4. `src/components/profile/FindPeopleSection.tsx` - Wire up drawer

---

## Technical Details

### View Security
Both views use `security_invoker = true` to respect RLS policies.

### Badge Display
Featured badges are limited to 3 to keep the UI clean.

### Preference Mapping
The drawer will map preference keys to human-readable labels:
- `small_3_5` → "Small groups (3-5)"
- `vibe_preference: 2` → "Chill vibes"
- `remote_wfh` → "Remote/WFH"

### Loading States
Skeleton loading for smooth UX while fetching profile data.
