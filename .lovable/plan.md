
# Waitlist-Gated Launch: "Join the Waitlist" + Beta User Access

## Overview

Transform the homepage from open signup to a **waitlist-first model** where:
1. **General visitors** → "Join the Waitlist" (email capture, no account yet)
2. **Beta users with invite codes** → "Beta Access" button → normal auth flow
3. **Existing users** → "Sign In" (unchanged)

This creates a lead capture funnel while keeping the pilot invite-code-gated.

---

## What Users Will See

### Homepage Hero & CTA Section

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│           You've got a clique waiting.                       │
│           You just haven't met them yet.                     │
│                                                              │
│   ┌─────────────────────┐   ┌─────────────────────┐         │
│   │  Join the Waitlist  │   │    Beta Access      │         │
│   │    (primary CTA)    │   │   (outline button)  │         │
│   └─────────────────────┘   └─────────────────────┘         │
│                                                              │
│              Already have an account? Sign in →              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Waitlist Modal Flow

When clicking "Join the Waitlist":

```
┌─────────────────────────────────────────────────────────────┐
│                   Join the Waitlist                          │
│                                                              │
│   We're launching in Austin. Be the first to know            │
│   when we open up new spots.                                 │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  Email *                                             │   │
│   │  yourname@email.com                                  │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  Name (optional)                                     │   │
│   │  First name or nickname                              │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
│   What brings you to OpenClique?                             │
│   [ ] New to Austin, looking to meet people                  │
│   [ ] Remote worker seeking IRL connections                  │
│   [ ] Looking for hobby/activity groups                      │
│   [ ] Just curious about the concept                         │
│                                                              │
│   How did you hear about us? (optional)                      │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  Friend referral, Instagram, etc.                    │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
│              ┌─────────────────────────┐                    │
│              │    Join the Waitlist    │                    │
│              └─────────────────────────┘                    │
│                                                              │
│   Have an invite code? Enter it here →                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

After submission:

```
┌─────────────────────────────────────────────────────────────┐
│                         You're in! 🎉                        │
│                                                              │
│   We'll let you know when we're ready to welcome you.        │
│   Keep an eye on your inbox for updates and early access.    │
│                                                              │
│   In the meantime:                                           │
│   • Follow us on Instagram for Austin event highlights       │
│   • Browse upcoming quests (no account needed)               │
│                                                              │
│              ┌─────────────────────────┐                    │
│              │    Browse Quests →      │                    │
│              └─────────────────────────┘                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Admin Panel: Waitlist Manager

New tab in **Growth** section → "Waitlist"

```
┌─────────────────────────────────────────────────────────────┐
│  Waitlist                                       [Export CSV] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Total: 247  │  This Week: 34  │  Converted: 12             │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Search by email or name...                           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Email              │ Name    │ Interest     │ Joined   │ │
│  ├────────────────────┼─────────┼──────────────┼──────────┤ │
│  │ alex@example.com   │ Alex    │ New to town  │ Feb 5    │ │
│  │ sam@gmail.com      │ —       │ Remote work  │ Feb 4    │ │
│  │ jordan@company.co  │ Jordan  │ Hobbies      │ Feb 3    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Export formats:**
- **CSV download** — Compatible with Gmail contacts, Mailchimp, etc.
- Columns: email, name, interest, referral_source, joined_at

---

## Technical Implementation

### 1. Database: New `waitlist` Table

```sql
CREATE TABLE public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  interest TEXT,                    -- What brings you here
  referral_source TEXT,             -- How did you hear about us
  created_at TIMESTAMPTZ DEFAULT now(),
  converted_at TIMESTAMPTZ,         -- When they became a real user
  converted_user_id UUID REFERENCES auth.users(id),
  notes TEXT                        -- Admin notes
);

-- RLS: Only admins can read, anyone can insert their own
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist" 
  ON public.waitlist FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins can view waitlist" 
  ON public.waitlist FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update waitlist" 
  ON public.waitlist FOR UPDATE 
  USING (public.has_role(auth.uid(), 'admin'));
```

### 2. New Components

| File | Purpose |
|------|---------|
| `src/components/WaitlistModal.tsx` | Modal with form for email capture |
| `src/components/admin/WaitlistManager.tsx` | Admin panel view + export |

### 3. Modified Components

| File | Changes |
|------|---------|
| `src/components/Hero.tsx` | Replace "Join Now" with "Join the Waitlist" + add "Beta Access" button |
| `src/components/CTASection.tsx` | Same changes as Hero |
| `src/constants/content.ts` | Update `HERO.primaryCta` to "Join the Waitlist" |
| `src/components/admin/AdminSectionNav.tsx` | Add "Waitlist" tab to Growth section |
| `src/pages/Admin.tsx` | Wire up WaitlistManager component |

### 4. Form Validation (zod)

```typescript
const waitlistSchema = z.object({
  email: z.string().email("Please enter a valid email").max(255),
  name: z.string().max(100).optional(),
  interest: z.string().max(50).optional(),
  referral_source: z.string().max(200).optional(),
});
```

### 5. Export Edge Function

An edge function `export-waitlist` that:
- Queries the waitlist table
- Returns CSV with proper headers
- Only accessible to admins

---

## Changes Summary

| Category | Files |
|----------|-------|
| **New Database** | `waitlist` table with RLS |
| **New Components** | `WaitlistModal.tsx`, `WaitlistManager.tsx` |
| **New Edge Function** | `export-waitlist` (CSV export) |
| **Modified - Homepage** | `Hero.tsx`, `CTASection.tsx` |
| **Modified - Content** | `content.ts` (CTA text) |
| **Modified - Admin** | `AdminSectionNav.tsx`, `Admin.tsx` |

---

## User Flows After Implementation

### Flow A: New Visitor
1. Lands on homepage
2. Clicks "Join the Waitlist"
3. Fills in email + optional info
4. Sees success message
5. Data stored in `waitlist` table
6. Can still browse quests (public)

### Flow B: User with Invite Code
1. Lands on homepage
2. Clicks "Beta Access"
3. Enters invite code + creates account
4. Gains full access to platform

### Flow C: Existing Beta User
1. Lands on homepage
2. Clicks "Sign In" link (or "Beta Access")
3. Normal login flow

### Flow D: Admin Exports List
1. Goes to Admin → Growth → Waitlist
2. Sees all entries with search/filter
3. Clicks "Export CSV"
4. Downloads file, imports to Mailchimp/Gmail

---

## Why This Approach Works for OpenClique

- **Builds anticipation** — Waitlist creates scarcity and FOMO
- **Collects warm leads** — Email list for announcements
- **Filters for intent** — Interest field shows who's serious
- **Maintains exclusivity** — Invite codes still gate actual access
- **Export-friendly** — Works with any email tool you already use
- **Low friction** — No password needed for waitlist

