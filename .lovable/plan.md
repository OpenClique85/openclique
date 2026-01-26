
# Complete Organizations, Clubs & Admin Enhancement Plan

## Overview

This plan addresses a comprehensive overhaul of the organization/club system, admin console restructuring, and documentation updates. The goal is to make it "dead easy" to join clubs like "Marketing Club" or "Operations Club" while providing club leaders with powerful management tools and rolling up analytics to the UT Austin enterprise level.

---

## Part 1: My Organizations Tab on Profile Hub

### Current State
- Profile Hub has 3 tabs: Cliques | Quests | Me
- Users have no visibility into their organization memberships from their hub
- No way to redeem club codes directly from the profile

### Implementation

**New Component: `src/components/profile/OrganizationsTab.tsx`**

Features:
- Display all organizations user belongs to (from `profile_organizations`)
- Show club cards with: name, role, member count, and recent quests
- "Redeem Club Code" button with modal input
- Quests from user's organizations displayed in a dedicated section
- Visual distinction between umbrella orgs (e.g., UT Austin) and clubs (e.g., GBAT)

**Profile.tsx Changes:**
- Add 4th tab: "Organizations" or integrate into existing tabs
- Add Building2 icon for Organizations tab
- Tab URL param: `?tab=orgs`

**Mobile Action Bar Update:**
- Consider adding Organizations as a navigation option or keeping it within Profile

---

## Part 2: Social Chair Onboarding Flow

### Purpose
Guide new club admins through setting up their dashboard after receiving a creator code.

### New Components

**`src/components/clubs/SocialChairOnboarding.tsx`**

Multi-step wizard:
1. **Welcome Step**: Explain the Social Chair role and what they can do
2. **Dashboard Tour**: Highlight key features (event management, clique ops, broadcasts)
3. **Generate Invite Code**: Walk through creating their first club invite code
4. **Create First Quest**: Template selection and quick quest creation
5. **Completion**: Celebration and link to full dashboard

**Trigger Points:**
- When a user with `social_chair` role visits `/org/[slug]` for the first time
- Track onboarding completion in `profile_organizations` or `user_onboarding` table
- Add `social_chair_onboarded_at` column or use localStorage

**SocialChairDashboard.tsx Updates:**
- Add "Invite Codes" tab alongside Cliques and Broadcast
- Show generated codes with quick copy buttons
- Display code usage stats

---

## Part 3: Codes & Keys Organization in Admin

### Current State
- Invite codes are in "Growth > Invite Codes"
- Organization invite codes (`org_invite_codes`) are not visible in admin
- No unified view of all access codes across the platform

### Implementation

**Rename & Restructure "Invite Codes" to "Codes & Keys"**

New tab structure within `InviteCodesManager.tsx`:
1. **Platform Codes**: admin, tester, early_access, creator, sponsor codes (existing)
2. **Organization Codes**: All `org_invite_codes` grouped by org
3. **Friend Invites**: From `friend_invites` table (quest-specific recruit codes)

**New Features:**
- Filter by: code type, organization, status (active/expired)
- Quick copy buttons for code and full invite URL
- Search across all code types
- Org codes show: org name, uses count, expiration
- Generate org-specific codes directly from admin (not just from Social Chair dashboard)

**AdminSectionNav.tsx Update:**
- Rename "Invite Codes" to "Codes & Keys"

---

## Part 4: Organization View vs Enterprise View

### Current State
- Single "Organizations" tab showing all orgs flat
- No distinction between umbrella orgs and child clubs
- No aggregate analytics for enterprise accounts

### Implementation

**Update AdminSectionNav.tsx:**
```
Organizations
  ├── Clubs & Orgs      (non-umbrella organizations, child clubs)
  ├── Enterprise View   (umbrella orgs like UT Austin with rollup analytics)
  └── Applications      (existing)
```

**New Component: `src/components/admin/EnterpriseOrgsManager.tsx`**

Features:
- List all umbrella organizations (`is_umbrella = true`)
- For each umbrella, show:
  - Child clubs count and list
  - Total members across all child clubs
  - Active quests count
  - Clique formation rate
  - Quest completion rate
- Drill-down to individual club stats
- Contract/billing information (from enterprise pricing fields)
- Verified domains management

**OrgsManager.tsx Updates:**
- Add filter: "Umbrellas Only" / "Clubs Only"
- Display `parent_org_id` relationship (show parent org name)
- Add `is_umbrella` toggle in create/edit modal
- Add `verified_domains` array editor
- Add `social_chair` to member role dropdown options
- Show enterprise tier/pricing status if applicable

---

## Part 5: Delete Cliques Functionality

### Current State
- CliquesManager only allows viewing and archiving
- No way to permanently delete cliques

### Implementation

**Database: New RPC `delete_clique`**

```sql
CREATE OR REPLACE FUNCTION delete_clique(p_clique_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_active_members INTEGER;
BEGIN
  -- Check for active members
  SELECT COUNT(*) INTO v_active_members
  FROM squad_members 
  WHERE persistent_squad_id = p_clique_id 
  AND status = 'active';
  
  IF v_active_members > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot delete clique with active members. Archive first.');
  END IF;
  
  -- Delete related records
  DELETE FROM squad_chat_messages WHERE squad_id = p_clique_id;
  DELETE FROM squad_quest_invites WHERE squad_id = p_clique_id;
  DELETE FROM clique_role_assignments WHERE clique_id = p_clique_id;
  DELETE FROM squad_members WHERE persistent_squad_id = p_clique_id;
  
  -- Delete the clique
  DELETE FROM squads WHERE id = p_clique_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**CliquesManager.tsx Updates:**
- Add "Delete" button (only visible for archived cliques or those with 0 active members)
- Confirmation dialog with warning about permanent deletion
- Call `delete_clique` RPC on confirmation

---

## Part 6: Remove Squad Directory

### Current State
- SquadsDirectory shows instance-based squads (quest_squads)
- CliquesManager shows persistent cliques (squads table)
- This creates confusion as "cliques" is the new terminology

### Implementation

**AdminSectionNav.tsx Changes:**
Remove `squads-directory` from the tabs array:
```typescript
// REMOVE from squads-cliques section:
{ id: 'squads-directory', label: 'Squad Directory' },
```

**Admin.tsx Changes:**
- Remove `SquadsDirectory` import
- Remove `case 'squads-directory'` from renderContent switch

**Keep File:**
- Keep `SquadsDirectory.tsx` file for now (might be useful for audit/legacy)
- Or mark as deprecated with comment

---

## Part 7: Admin Structure Cleanup

### Navigation Reorganization

**Final AdminSectionNav Structure:**

```
Quests Manager
  ├── All Quests
  ├── Active Instances
  └── Archives

Approvals & Ops
  ├── Quest Approvals
  ├── Ops Alerts
  └── Audit Log

Squads & Cliques
  ├── Cliques (with delete capability)
  ├── Comparison
  ├── Health
  └── Archival

Organizations
  ├── Clubs & Orgs (non-umbrella, with parent org display)
  ├── Enterprise View (NEW - umbrella analytics)
  └── Applications

Support
  ├── Ticket Inbox
  ├── Direct Messages
  ├── Flags & Trust
  ├── Analytics
  └── Issue Categories

Partners
  ├── Creators
  ├── Sponsors
  ├── Testimonials
  ├── Creator View
  └── Sponsor View

Content
  ├── UGC Gallery
  └── Testimonials

Communications
  ├── Messaging
  ├── Notification Console
  ├── WhatsApp
  └── Signup Links

Payments & Premium
  ├── Pilot Demand
  ├── Tier Accounts
  ├── Applications
  └── ARR Forecasting

Growth
  ├── Codes & Keys (RENAMED, expanded)
  ├── Friend Referrals
  ├── Onboarding Feedback
  └── Analytics

Identity System
  ├── Trait Library
  ├── Emerging Traits
  ├── User Inspector
  ├── AI Inference Logs
  └── AI Prompts

Gamification
  ├── XP & Levels
  ├── Achievements
  ├── Badges
  └── Streaks

Ops & Dev
  ├── Shadow Mode
  ├── Event Timeline
  ├── Flow Debugger
  ├── Manual Overrides
  ├── Feature Flags
  ├── Security Tools
  └── Dev Tools

Documentation
  ├── System Docs
  ├── Operations Playbooks
  └── Export Handoff Pack
```

---

## Part 8: Documentation Updates

### System Docs Updates (DocsManager)

**Add New Documents:**

| Category | Subcategory | Title |
|----------|-------------|-------|
| flow | organization | Organization & Club Join Flow |
| flow | social_chair | Social Chair Onboarding Flow |
| rule | organizations | Club Hierarchy & Permissions |
| security | rbac | Organization Role Matrix (add social_chair, org_admin) |

**Update Existing:**
- "RBAC Permission Matrix" - Add social_chair and org_admin roles
- "Product Overview" - Add section on enterprise/club model

### Operations Playbooks Updates (DocsPlaybookManager)

**Add New Documents:**

| Category | Subcategory | Title |
|----------|-------------|-------|
| playbook | club_onboarding | Club Leader Onboarding Runbook |
| playbook | enterprise_setup | Enterprise Account Setup Guide |
| process | club_management | Club Code Distribution Process |
| sla | enterprise | Enterprise Support SLA |

### Export Handoff Pack Updates (DocsExportPanel)

**Add to CTO sections:**
- Organization hierarchy documentation
- Club management flows

**Add to COO sections:**
- Enterprise setup playbook
- Club leader onboarding process

---

## Files Summary

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/profile/OrganizationsTab.tsx` | My Organizations tab for Profile Hub |
| `src/components/clubs/SocialChairOnboarding.tsx` | Multi-step onboarding wizard |
| `src/components/admin/EnterpriseOrgsManager.tsx` | Enterprise umbrella analytics |
| `supabase/migrations/XXXXXX_delete_clique.sql` | Add delete_clique RPC |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Profile.tsx` | Add Organizations tab |
| `src/components/admin/AdminSectionNav.tsx` | Remove squads-directory, rename invite-codes, add enterprise-view |
| `src/pages/Admin.tsx` | Update routing for new structure |
| `src/components/admin/OrgsManager.tsx` | Add umbrella toggle, parent_org selector, verified domains, social_chair role |
| `src/components/admin/CliquesManager.tsx` | Add delete functionality |
| `src/components/admin/InviteCodesManager.tsx` | Add org_invite_codes tab, rename to Codes & Keys |
| `src/components/clubs/SocialChairDashboard.tsx` | Add invite codes tab, onboarding check |

### Files to Remove from Navigation (Keep Files)

| File | Reason |
|------|--------|
| `src/components/admin/SquadsDirectory.tsx` | Redundant with CliquesManager, removed from nav |

---

## Technical Considerations

### Database Schema (Already Exists)
- `organizations.is_umbrella` - Boolean for enterprise umbrellas
- `organizations.parent_org_id` - FK for club-to-umbrella relationship
- `organizations.verified_domains` - Text array for email domain verification
- `org_invite_codes` - Table for organization-specific invite codes
- `profile_organizations.role` - Includes social_chair, org_admin

### Analytics Rollup Query (for Enterprise View)
```sql
WITH umbrella_stats AS (
  SELECT 
    o.id as umbrella_id,
    o.name as umbrella_name,
    COUNT(DISTINCT child.id) as club_count,
    COUNT(DISTINCT po.profile_id) as total_members,
    COUNT(DISTINCT q.id) as total_quests
  FROM organizations o
  LEFT JOIN organizations child ON child.parent_org_id = o.id
  LEFT JOIN profile_organizations po ON po.org_id = child.id
  LEFT JOIN quests q ON q.org_id = child.id AND q.status = 'open'
  WHERE o.is_umbrella = true
  GROUP BY o.id, o.name
)
SELECT * FROM umbrella_stats;
```

### RLS Considerations
- Ensure `social_chair` role has proper access to `org_invite_codes` (already in place)
- Enterprise admins need visibility across child orgs

---

## Implementation Order

1. **Database Migration** - Add delete_clique RPC
2. **Admin Cleanup** - Remove Squad Directory from nav, rename Invite Codes
3. **OrgsManager Enhancement** - Add umbrella fields, parent org, verified domains
4. **Enterprise View** - Create EnterpriseOrgsManager component
5. **Codes & Keys** - Expand InviteCodesManager with org codes
6. **CliquesManager** - Add delete functionality
7. **Profile Organizations Tab** - Create OrganizationsTab component
8. **Social Chair Onboarding** - Create onboarding wizard
9. **Documentation** - Update system docs and playbooks
10. **Testing** - End-to-end flow verification

---

## User Journey: Club Leader Setup

1. Admin creates "GBAT" org under UT Austin umbrella in admin panel
2. Admin generates creator code with type "organization" for GBAT
3. GBAT leader receives code, signs up, redeems code
4. GBAT leader is assigned `social_chair` role by admin
5. On first visit to `/org/gbat`, Social Chair Onboarding starts
6. GBAT leader completes onboarding, generates member invite codes
7. GBAT leader shares codes with club members
8. Members redeem codes, appear in GBAT's member list
9. GBAT leader creates quests, members receive notifications
10. Analytics roll up to UT Austin enterprise view
