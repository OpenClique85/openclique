

# Add Location Data Consent Language to Policies

## Overview

This plan adds clear, user-friendly consent language about approximate location data and geolocation check-in features to both the Privacy Policy and Terms of Service pages. The language follows OpenClique's privacy-first principles: location sharing is always optional, users control when to share, and we explain exactly how the data is used.

---

## Changes to Privacy Policy (`src/pages/Privacy.tsx`)

### 1. Add New Section: "Location Data" (after "What We Collect & Why")

**Insert after line 118:**

A dedicated section explaining location data collection with these key points:

| Topic | Content |
|-------|---------|
| **What we collect** | Approximate location (city-level for quest discovery) and optional precise location (for check-in verification) |
| **When we collect** | City at signup (required); precise GPS only at check-in (optional, user-initiated) |
| **How we use it** | Show local quests; verify quest attendance if you choose location check-in |
| **How long we keep it** | City: while account active; Precise GPS: converted to approximate coordinates immediately, not stored precisely |
| **Your control** | You can always use manual or photo check-in instead; location is never required for check-in |

**Proposed copy:**

```text
Location Data

We collect location information to help you discover and attend local quests:

• City-level location: When you sign up, you provide your city so we can show 
  quests happening near you. This is visible on your profile based on your 
  visibility settings.

• Approximate check-in location (optional): If you choose to use geolocation 
  check-in when arriving at a quest, we may collect your approximate location 
  to verify attendance. This is entirely optional — you can always check in 
  using manual confirmation, QR code, or photo upload instead.

How we handle your location data:

• We never share your precise location with other users
• Precise GPS coordinates (if collected during check-in) are converted to 
  approximate location and the precise data is discarded
• Your city is the only location information visible to other members (based 
  on your privacy settings)
• We do not track your location in the background or when you're not actively 
  checking in
• You can update your city at any time in your profile settings

You can manage your location preferences through your device's permissions. 
Denying location access will not prevent you from using OpenClique — 
alternative check-in methods are always available.
```

---

## Changes to Terms of Service (`src/pages/Terms.tsx`)

### 1. Add New Section: "Location Data & Check-In" (after "User Conduct" section)

**Insert after line 104:**

A section explaining the terms around location-based features:

**Proposed copy:**

```text
Location Data & Check-In

OpenClique offers optional location-based features to enhance your quest 
experience:

• Quest Discovery: We use your city to show relevant local quests
• Check-In Verification: When you arrive at a quest, you may check in using 
  various methods:
  - Manual check-in (tap a button)
  - QR code scan (scan host's code)
  - Photo upload (share proof of attendance)
  - Geolocation check-in (share your approximate location)

By using geolocation check-in, you consent to OpenClique temporarily accessing 
your device's location to verify you are at or near the quest venue. This 
location data:

• Is used only to confirm attendance
• Is immediately converted to approximate coordinates
• Is not stored in precise form
• Is not shared with other users

You are never required to use geolocation. Alternative check-in methods are 
always available. If you deny location permission on your device, you can 
still participate in all quests using other check-in methods.

For details on how we handle your location data, see our Privacy Policy.
```

---

## Implementation Details

### Files to Modify

| File | Action | Lines |
|------|--------|-------|
| `src/pages/Privacy.tsx` | Add "Location Data" section | After line 118 (after "What We Collect" section closing) |
| `src/pages/Terms.tsx` | Add "Location Data & Check-In" section | After line 104 (after "User Conduct" section closing) |

### Section Placement Rationale

| Page | Position | Why |
|------|----------|-----|
| **Privacy Policy** | After "What We Collect & Why" | Location is a data type, so it logically follows the general data collection section |
| **Terms of Service** | After "User Conduct" | Check-in is a user action/feature, so it fits with the conduct/usage sections |

---

## Key Privacy Principles Preserved

These additions align with OpenClique's privacy-first approach:

1. **Optional by design** — Geolocation is never required; alternatives always exist
2. **Minimal collection** — Only approximate data retained; precise GPS discarded
3. **Transparency** — Users know exactly what's collected and why
4. **User control** — Users choose their check-in method each time
5. **No background tracking** — Location only accessed during active check-in
6. **No sharing** — Location never visible to other users

---

## Technical Notes

- Both files use the same component structure with `<section>` elements
- Follow existing heading hierarchy: `<h2>` for section title, `<ul>` for lists
- Maintain consistent styling with `font-display`, `text-foreground`, etc.
- No database or schema changes needed — this is purely policy text

