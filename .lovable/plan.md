
# Enterprise Portal Enhancement: Club Dashboard, Invite Codes, and Clique Organization Tracking

## Summary

This plan addresses three interconnected requirements:

1. **Fix the 404 Dashboard Route**: The `/org/:slug/dashboard` route is missing from `App.tsx`, causing a 404 when Social Chairs click "Dashboard" from their org card in My Hub.

2. **Enhanced Invite Code System**: Generate and store invite codes within club info that are accessible from both the Social Chair Dashboard and the Admin Portal under "Keys and Codes".

3. **Clique Organization Tracking in Admin Panel**: Add organization/club visibility to the `EnterpriseCliquesTab` so admins can see which club/org each clique belongs to.

---

## Part 1: Fix the 404 Dashboard Route

**Problem**: The `OrganizationsTab.tsx` (line 363) links to `/org/${org.slug}/dashboard`, but `App.tsx` only has `/org/:slug` pointing to `OrgPortal` without a `/dashboard` sub-route.

**Solution**: Create a dedicated `ClubDashboardPage` that renders the Social Chair dashboard with proper authorization checks.

### File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/App.tsx` | Edit | Add route `/org/:slug/dashboard` pointing to new `ClubDashboardPage` |
| `src/pages/ClubDashboardPage.tsx` | Create | New page that fetches org by slug and renders `SocialChairDashboard` |

### Route Addition in App.tsx

```text
/org/:slug/dashboard -> ClubDashboardPage (protected)
```

### ClubDashboardPage Structure

- Fetch organization by slug from URL params
- Verify user has `social_chair`, `admin`, or `org_admin` role in that organization
- If authorized, render `SocialChairDashboard` with the org's ID and name
- If not authorized, show access denied message
- Include back navigation to the org portal

---

## Part 2: Database Schema Updates for Invite Codes

The `org_invite_codes` table is missing columns that the UI expects.

### Database Migration

Add missing columns to `org_invite_codes`:

```text
- label: TEXT (optional) - Human-readable label for the code (e.g., "Spring 2026 Cohort")
- auto_assign_role: TEXT DEFAULT 'member' - Role to assign when code is redeemed
```

---

## Part 3: Organization Tracking for Cliques

Currently, cliques in the Enterprise Portal don't show which organization they belong to. The relationship can be derived from:

1. `squads.org_code` - Direct link to organization slug
2. `squads.origin_quest_id` -> `quests.org_id` - Indirect link through originating quest

### File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/enterprise/EnterpriseCliquesTab.tsx` | Edit | Add organization filter tabs and display org name in clique table |

### Updated Query Strategy

Modify the cliques query to join with organizations:

1. Join `squads` with `organizations` via `org_code` (if set)
2. OR join through `quests` table using `origin_quest_id` -> `quests.org_id`
3. Add an "Organization" column to the cliques table
4. Add filter tabs at the top: "All" | "{Org 1}" | "{Org 2}" | "Unaffiliated"

### UI Enhancement

- Add organization filter dropdown or tabs
- Display organization badge in each clique row
- Group cliques by organization when filtering

---

## Part 4: Club Detail View Enhancement

The `ClubDetailView` in the Enterprise Portal should show the club's invite codes.

### File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/enterprise/ClubDetailView.tsx` | Edit | Add "Invite Codes" tab showing all codes for this club |

---

## Technical Details

### New Page: ClubDashboardPage.tsx

```text
Structure:
- Import SocialChairDashboard from @/components/clubs
- Use useParams to get slug
- Query organizations table for org by slug
- Query profile_organizations to check user role
- Render SocialChairDashboard if authorized
- Include Navbar, Footer, and back navigation
```

### EnterpriseCliquesTab Organization Enhancement

```text
Changes to the query:
1. SELECT squads.*, org.name as org_name, org.id as org_id
2. LEFT JOIN organizations org ON squads.org_code = org.slug
3. OR use subquery to get org via origin_quest_id -> quests.org_id

New state:
- selectedOrgId: string | 'all' | 'unaffiliated'

UI additions:
- Filter dropdown for organizations
- "Organization" column in table
- Badge showing org name or "Independent" for unaffiliated cliques
```

### Database Migration SQL

```text
ALTER TABLE public.org_invite_codes 
ADD COLUMN IF NOT EXISTS label TEXT,
ADD COLUMN IF NOT EXISTS auto_assign_role TEXT DEFAULT 'member';
```

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/App.tsx` | Edit | Add `/org/:slug/dashboard` protected route |
| `src/pages/ClubDashboardPage.tsx` | Create | Dashboard page wrapper with auth checks |
| `src/components/enterprise/EnterpriseCliquesTab.tsx` | Edit | Add organization column and filter |
| `src/components/enterprise/ClubDetailView.tsx` | Edit | Add invite codes section |
| Database migration | Create | Add `label` and `auto_assign_role` to `org_invite_codes` |

---

## User Experience Flow

### For Social Chairs
1. Navigate to My Hub -> Organizations tab
2. Click on their club card
3. See "Dashboard" button (existing)
4. Click Dashboard -> Navigate to `/org/{slug}/dashboard`
5. See comprehensive Social Chair control panel with events, cliques, invite codes, and broadcast tools

### For Platform Admins in Enterprise Portal
1. Navigate to Enterprise Portal -> Cliques tab
2. See organization filter at the top
3. Filter by specific organization or "Unaffiliated"
4. See organization name displayed for each clique
5. Click into Club Detail View to see that club's invite codes

---

## Permissions & Access Control

- **Social Chair Dashboard**: Only accessible to users with `social_chair`, `admin`, or `org_admin` role in the specific organization
- **Enterprise Portal**: Only accessible to platform admins (existing protection)
- **Invite Codes**: Created by social chairs, viewable by platform admins in the "Keys and Codes" section
