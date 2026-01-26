
# User Privacy, Data Control & Account Management System

## Overview

This plan implements a comprehensive user control system covering privacy settings, notification preferences, data management, account deletion with feedback collection, and confirmation emails. The goal is to provide users with full transparency and control over their data while maintaining a seamless, trustworthy experience.

---

## What You'll Get

1. **Full Settings Page** - A dedicated `/settings` page replacing the "Coming Soon" badges
2. **Privacy Controls** - Granular visibility settings for profile, activity, and matching
3. **Notification Preferences** - Email and in-app notification opt-in/opt-out controls
4. **Data Export** - Download all your data in JSON format
5. **Account Deletion Flow** - Multi-step confirmation with feedback collection
6. **Exit Survey** - Capture reasons for leaving to improve the product
7. **Confirmation Email** - Automated email confirming account deletion
8. **Updated Legal Pages** - Enhanced Privacy Policy and Terms reflecting new features

---

## System Architecture

```text
+------------------+     +-------------------+     +--------------------+
|   MeTab          | --> |  Settings Page    | --> |  Delete Account    |
|  (Quick Links)   |     |  /settings        |     |  Multi-step Flow   |
+------------------+     +-------------------+     +--------------------+
                               |                           |
                    +----------+----------+                |
                    |          |          |                |
               +--------+ +--------+ +--------+     +-------------+
               |Privacy | |Notif.  | |Data    |     | Feedback    |
               |Settings| |Prefs   | |Export  |     | Collection  |
               +--------+ +--------+ +--------+     +-------------+
                                                          |
                                                   +-------------+
                                                   | Edge Func   |
                                                   | delete-acct |
                                                   +-------------+
                                                          |
                                                   +-------------+
                                                   | Confirm     |
                                                   | Email       |
                                                   +-------------+
```

---

## Phase 1: Database Schema Updates

### 1.1 Add Notification Preferences Column
Extend the `profiles` table with notification preferences:

```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "email_quest_recommendations": true,
  "email_quest_reminders": true,
  "email_squad_updates": true,
  "email_marketing": false,
  "in_app_quest_recommendations": true,
  "in_app_squad_updates": true,
  "in_app_general": true
}'::jsonb;
```

### 1.2 Add Privacy Settings Column
Extend the `profiles` table with privacy controls:

```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{
  "profile_visibility": "public",
  "show_activity_history": true,
  "allow_matching": true,
  "show_in_squad_lists": true,
  "show_xp_and_badges": true
}'::jsonb;
```

### 1.3 Create Account Deletion Feedback Table
Track exit feedback for product improvement:

```sql
CREATE TABLE public.account_deletion_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  display_name TEXT,
  reasons TEXT[] DEFAULT '{}',
  other_reason TEXT,
  feedback TEXT,
  would_return BOOLEAN,
  data_exported BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Only service role can access
ALTER TABLE public.account_deletion_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.account_deletion_feedback
  FOR ALL USING (false);
```

### 1.4 Create Account Deletion Requests Table
Track deletion requests for audit and processing:

```sql
CREATE TABLE public.account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  processed_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own requests" ON public.account_deletion_requests
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create requests" ON public.account_deletion_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can cancel requests" ON public.account_deletion_requests
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');
```

---

## Phase 2: Settings Page & Components

### 2.1 Create Settings Page (`/settings`)

**File: `src/pages/Settings.tsx`**

A comprehensive settings page with tabbed sections:
- **Profile** - Basic info, display name (links to ProfileEditModal)
- **Privacy** - Visibility controls, matching preferences
- **Notifications** - Email and in-app notification toggles
- **Data** - Export data, view data summary
- **Account** - Delete account, deactivation options

### 2.2 Privacy Settings Component

**File: `src/components/settings/PrivacySettings.tsx`**

Controls include:
- Profile visibility (public/squad-only/private)
- Show activity history to squad members
- Allow AI-based matching
- Appear in squad member lists
- Show XP, badges, and level publicly

### 2.3 Notification Preferences Component

**File: `src/components/settings/NotificationPreferences.tsx`**

Toggle controls for:
- Email: Quest recommendations, reminders, squad updates, marketing
- In-app: Recommendations, squad updates, general announcements
- Include "Unsubscribe from all" quick action

### 2.4 Data Management Component

**File: `src/components/settings/DataManagement.tsx`**

Features:
- "Download My Data" button (exports profile, preferences, activity)
- Data summary showing what we store
- Link to Privacy Policy

---

## Phase 3: Account Deletion Flow

### 3.1 Delete Account Modal

**File: `src/components/settings/DeleteAccountModal.tsx`**

Multi-step flow:
1. **Inform** - Explain what deletion means, 7-day grace period
2. **Feedback** - Exit survey with reason checkboxes
3. **Export** - Option to download data before deletion
4. **Confirm** - Type "DELETE" to confirm, final warning

### 3.2 Exit Survey Options

Reason checkboxes:
- "I'm not using the app enough"
- "I didn't find quests I was interested in"
- "Privacy concerns"
- "Moving away from Austin"
- "Found another community"
- "The app was confusing to use"
- "Bad experience with a squad"
- "Other" (with text field)

Additional fields:
- "What could we have done better?" (optional text)
- "Would you consider returning in the future?" (yes/maybe/no)

### 3.3 Deletion Edge Function

**File: `supabase/functions/delete-account/index.ts`**

This function handles the complete account deletion:

1. **Validate request** - Verify user identity and confirmation
2. **Store feedback** - Save exit survey to `account_deletion_feedback`
3. **Export data** (if requested) - Generate JSON export
4. **Delete user data** from all tables:
   - `notifications`, `feedback`, `quest_signups`
   - `squad_members`, `xp_transactions`, `user_xp`, `user_tree_xp`
   - `user_traits`, `user_badges`, `user_achievements`
   - `user_streaks`, `user_social_energy`, `trust_scores`
   - `identity_snapshots`, `draft_traits`, `referrals`
   - `support_tickets`, `ticket_messages`
   - `clique_*` tables, `squad_*` tables
   - `ugc_submissions`, `participant_proofs`
   - And all other user-linked tables
5. **Delete profile** - Remove from `profiles` table
6. **Delete auth user** - Remove from `auth.users`
7. **Send confirmation email** - Via Resend

### 3.4 Confirmation Email Template

Add to `supabase/functions/send-email/index.ts`:

```typescript
account_deleted: (vars) => `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #6b7280; margin: 0;">Account Deleted</h1>
    </div>
    <p style="font-size: 16px; color: #333;">Hey ${escapeHtml(vars.display_name || "there")},</p>
    <p style="font-size: 16px; color: #333;">Your OpenClique account has been successfully deleted as requested.</p>
    
    <div style="background: #f3f4f6; border-left: 4px solid #6b7280; padding: 15px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>What's been removed:</strong></p>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
        <li>Your profile and preferences</li>
        <li>Quest signup history</li>
        <li>Squad memberships</li>
        <li>XP, badges, and achievements</li>
        <li>All associated data</li>
      </ul>
    </div>
    
    ${vars.data_exported === 'true' ? `
      <p style="font-size: 14px; color: #666;">
        ✅ You downloaded a copy of your data before deletion.
      </p>
    ` : ''}
    
    <p style="font-size: 14px; color: #666;">
      We're sad to see you go. If you ever want to return, you're always welcome 
      to create a new account.
    </p>
    
    <p style="font-size: 14px; color: #666;">
      If you didn't request this deletion, please contact us immediately at 
      <a href="mailto:hello@openclique.com">hello@openclique.com</a>.
    </p>
    
    <p style="font-size: 14px; color: #666;">— The OpenClique Team</p>
  </div>
`
```

---

## Phase 4: Data Export Feature

### 4.1 Export Data Edge Function

**File: `supabase/functions/export-user-data/index.ts`**

Generates a comprehensive JSON export containing:
- Profile information (name, email, preferences)
- Quest history (signups, completions)
- Squad memberships and roles
- XP and achievement history
- Feedback submitted
- Notification history

Export is downloadable as `openclique-data-export-{date}.json`

### 4.2 Data Summary Component

Shows users a breakdown of what data we have:
- Profile data (preferences, matching info)
- Activity data (quests joined, squads formed)
- Engagement data (XP, badges, streaks)
- Communications (notifications received)

---

## Phase 5: Update MeTab & Navigation

### 5.1 Update MeTab Quick Settings

Replace "Coming Soon" badges with functional links:

```typescript
// Privacy - now links to settings
<Link to="/settings?tab=privacy">
  <Button variant="outline" size="sm">Manage</Button>
</Link>

// Add Account section
<div className="py-4 flex items-center justify-between">
  <div className="flex items-center gap-3">
    <Database className="h-5 w-5 text-muted-foreground" />
    <div>
      <p className="font-medium">Your Data</p>
      <p className="text-sm text-muted-foreground">Export or delete your data</p>
    </div>
  </div>
  <Link to="/settings?tab=data">
    <Button variant="outline" size="sm">Manage</Button>
  </Link>
</div>
```

### 5.2 Add Route to Route Manifest

```typescript
{ 
  path: '/settings', 
  page: 'Settings', 
  protection: 'authenticated', 
  description: 'User settings, privacy, and account management',
  category: 'user' 
}
```

---

## Phase 6: Legal Page Updates

### 6.1 Update Privacy Policy

Add sections for:
- Self-service data deletion
- Data export rights
- Notification preferences
- Privacy controls
- 7-day deletion grace period

### 6.2 Update Terms of Service

Add sections for:
- Account deletion terms
- Data retention after deletion
- Right to cancel deletion within 7 days

---

## Technical Details

### Files to Create

| File | Purpose |
|------|---------|
| `src/pages/Settings.tsx` | Main settings page with tabs |
| `src/components/settings/PrivacySettings.tsx` | Privacy toggle controls |
| `src/components/settings/NotificationPreferences.tsx` | Email/in-app preferences |
| `src/components/settings/DataManagement.tsx` | Export and data summary |
| `src/components/settings/DeleteAccountModal.tsx` | Multi-step deletion flow |
| `src/components/settings/AccountSettings.tsx` | Account section with delete button |
| `src/hooks/useSettings.ts` | Hook for fetching/updating settings |
| `supabase/functions/delete-account/index.ts` | Account deletion handler |
| `supabase/functions/export-user-data/index.ts` | Data export generator |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/profile/MeTab.tsx` | Add functional links, remove "Coming Soon" |
| `src/constants/routeManifest.ts` | Add `/settings` route |
| `src/App.tsx` | Add Settings route |
| `supabase/functions/send-email/index.ts` | Add `account_deleted` template |
| `src/pages/Privacy.tsx` | Add self-service deletion section |
| `src/pages/Terms.tsx` | Add account deletion terms |
| `src/types/profile.ts` | Add notification/privacy preference types |

### Database Migrations

1. Add `notification_preferences` column to `profiles`
2. Add `privacy_settings` column to `profiles`
3. Create `account_deletion_feedback` table
4. Create `account_deletion_requests` table

---

## User Experience Flow

### Accessing Settings
1. User navigates to Profile > Me tab
2. Clicks "Manage" next to Privacy, Notifications, or Data
3. Lands on Settings page with appropriate tab selected

### Deleting Account
1. User goes to Settings > Account tab
2. Clicks "Delete Account" button
3. **Step 1**: Reads explanation of what deletion means
4. **Step 2**: Fills out exit survey (optional but encouraged)
5. **Step 3**: Option to export data before deletion
6. **Step 4**: Types "DELETE" to confirm
7. Account enters 7-day grace period
8. Receives confirmation email
9. Can cancel within 7 days via email link
10. After 7 days, deletion is permanent

### Cancelling Deletion
- Link in confirmation email allows cancellation
- Can also cancel from Settings if still logged in
- Clear messaging about grace period

---

## Security Considerations

- Account deletion requires re-authentication
- 7-day grace period prevents accidental deletion
- Exit feedback stored without PII linkage (uses email hash)
- Data export requires authentication
- Deletion confirmation email sent to verified email
- All operations logged in audit trail

---

## Success Metrics

After implementation, we can track:
- Exit survey completion rate
- Top reasons for leaving
- Data export usage
- Deletion cancellation rate
- "Would return" sentiment
