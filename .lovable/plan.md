# Legal Compliance & User Safety Implementation Plan

## Executive Summary

This plan implements comprehensive legal compliance, user consent flows, and safety features across OpenClique. The goal is to be transparent, user-friendly, and fully compliant with privacy laws (CCPA, state laws) while protecting both users and the company from liability.

---

## Audit Results: What Already Exists

### ✅ Already Implemented

| Feature | Status | Location |
|---------|--------|----------|
| **Privacy Policy** | Comprehensive | `src/pages/Privacy.tsx` - Location, data export, deletion, retention covered |
| **Terms of Service** | Good foundation | `src/pages/Terms.tsx` - Safety, liability, community guidelines |
| **Account Deletion** | Complete | 7-day grace period, exit survey, data export via edge function |
| **Data Export** | Complete | `export-user-data` edge function |
| **Consent Logging** | Exists | `user_consent_log` table with type, version, IP hash, withdrawal |
| **Support Tickets** | Robust | Full ticket system with categories, SLA tracking, admin dashboard |
| **Moderation Flags** | Exists | `moderation_flags` table + `ModerationDashboard` admin component |
| **Admin Panel** | Extensive | PilotControlRoom, SupportDashboard, ModerationDashboard, 50+ admin components |
| **Location Consent** | Just added | Privacy Policy and Terms of Service updated |
| **User Trust Scores** | Exists | Trust score system in ModerationDashboard |
| **PII Lockdown** | Implemented | SECURITY DEFINER functions, RLS policies, consent-gated access |

### ❌ Missing (Needs Implementation)

| Feature | Priority | Effort | Notes |
|---------|----------|--------|-------|
| **Age Verification (DOB)** | 🔴 Critical | Medium | No `date_of_birth` in profiles, no signup verification |
| **User Blocking** | 🔴 Critical | Medium | No `user_blocks` table, no UI |
| **SOS Alerts** | 🟡 High | Medium | No emergency alert system for quest safety |
| **Assumption of Risk (Expanded)** | 🟡 High | Low | Terms has safety section but needs legal expansion |
| **Dispute Resolution** | 🟡 High | Low | No arbitration clause in Terms |
| **Check-in Location Columns** | 🟢 Medium | Low | Need `check_in_lat`, `check_in_lng`, `check_in_method` |
| **Location Auto-Delete Job** | 🟢 Medium | Low | 90-day retention policy mentioned but not enforced |
| **Safety Guidelines Modal** | 🟢 Medium | Low | Exists in Terms but no in-app modal for quest signup |

---

## Phase 1: Database Schema Changes

### 1.1 Profiles Table Updates

Add age verification fields:

```sql
-- Add age verification to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS age_verified_at timestamptz;

-- Add constraint to require DOB for new accounts
COMMENT ON COLUMN public.profiles.date_of_birth IS 'User date of birth for 18+ verification. PII - never expose to other users.';

-- Create function to calculate age
CREATE OR REPLACE FUNCTION public.calculate_age(dob date)
RETURNS integer AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM age(CURRENT_DATE, dob))::integer;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### 1.2 User Blocks Table

Create blocking infrastructure:

```sql
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- Enable RLS
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- Users can only see their own blocks
CREATE POLICY "Users can view own blocks"
  ON public.user_blocks FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create blocks"
  ON public.user_blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can remove own blocks"
  ON public.user_blocks FOR DELETE
  USING (auth.uid() = blocker_id);

-- Function to check if user is blocked
CREATE OR REPLACE FUNCTION public.is_blocked(user_a uuid, user_b uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_blocks
    WHERE (blocker_id = user_a AND blocked_id = user_b)
       OR (blocker_id = user_b AND blocked_id = user_a)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

### 1.3 SOS Alerts Table

Emergency alert system:

```sql
CREATE TABLE IF NOT EXISTS public.sos_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id uuid REFERENCES public.quests(id),
  instance_id uuid REFERENCES public.quest_instances(id),
  location_lat double precision,
  location_lng double precision,
  location_accuracy double precision,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'false_alarm')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id),
  resolution_notes text
);

-- Enable RLS
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;

-- Users can create alerts
CREATE POLICY "Users can create own alerts"
  ON public.sos_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view own alerts
CREATE POLICY "Users can view own alerts"
  ON public.sos_alerts FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view and update all alerts (via admin role check)
-- Note: Admin access handled via SECURITY DEFINER functions

-- Index for active alerts
CREATE INDEX idx_sos_alerts_active ON public.sos_alerts(status, created_at DESC)
  WHERE status = 'active';
```

### 1.4 Check-in Location Columns

Extend quest_signups:

```sql
-- Add location check-in fields to quest_signups
ALTER TABLE public.quest_signups
  ADD COLUMN IF NOT EXISTS check_in_method text 
    CHECK (check_in_method IN ('manual', 'location', 'qr_code', 'photo')),
  ADD COLUMN IF NOT EXISTS check_in_lat double precision,
  ADD COLUMN IF NOT EXISTS check_in_lng double precision,
  ADD COLUMN IF NOT EXISTS location_consent_given boolean DEFAULT false;

-- Round location coordinates for privacy (called during check-in)
CREATE OR REPLACE FUNCTION public.round_coordinates(lat double precision, lng double precision)
RETURNS point AS $$
BEGIN
  -- Round to 2 decimal places (~1km accuracy)
  RETURN point(ROUND(lng::numeric, 2)::double precision, ROUND(lat::numeric, 2)::double precision);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### 1.5 Location Data Auto-Delete (Scheduled)

90-day retention policy:

```sql
-- Function to auto-delete old location data (run weekly via pg_cron or edge function)
CREATE OR REPLACE FUNCTION public.cleanup_old_location_data()
RETURNS integer AS $$
DECLARE
  rows_updated integer;
BEGIN
  UPDATE quest_signups
  SET 
    check_in_lat = NULL,
    check_in_lng = NULL,
    check_in_method = CASE 
      WHEN check_in_method = 'location' THEN 'manual_historic'
      ELSE check_in_method
    END
  WHERE 
    check_in_lat IS NOT NULL
    AND checked_in_at < now() - interval '90 days';
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Phase 2: Terms of Service Additions

### 2.1 New Section: "Eligibility" (Add before "Pilot Program")

```tsx
{/* ============ SECTION: Eligibility ============ */}
<section id="eligibility">
  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
    Eligibility
  </h2>
  <p className="mb-4">
    {BRAND.name} is intended for adults aged 18 and older. By creating an account, you represent and warrant that:
  </p>
  <ul className="list-disc pl-6 space-y-2 mt-4">
    <li>You are at least 18 years of age</li>
    <li>You have provided your accurate date of birth during registration</li>
    <li>You have the legal capacity to enter into this agreement</li>
    <li>You will not allow anyone under 18 to use your account</li>
  </ul>
  <p className="mt-4">
    We collect your date of birth to verify eligibility. This information is kept private and is never 
    shared with other users. If we determine that you provided a false date of birth or are under 18, 
    your account will be terminated.
  </p>
</section>
```

### 2.2 New Section: "Assumption of Risk" (Add after "Safety & Trust")

```tsx
{/* ============ SECTION: Assumption of Risk ============ */}
<section id="assumption-of-risk">
  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
    Assumption of Risk
  </h2>
  <p className="mb-4">
    {BRAND.name} facilitates real-world meetups with other users you have not met before. 
    By participating in quests, you acknowledge and expressly agree:
  </p>
  
  <h3 className="font-display text-lg font-semibold text-foreground mt-6 mb-3">
    Your Safety Responsibilities
  </h3>
  <ul className="list-disc pl-6 space-y-2">
    <li><strong>You</strong> are solely responsible for your own safety and well-being</li>
    <li><strong>You</strong> should meet in public, well-lit, populated areas</li>
    <li><strong>You</strong> should inform a friend or family member of your plans</li>
    <li><strong>You</strong> should never share sensitive personal information (home address, financial details) with users you just met</li>
    <li><strong>You</strong> should leave any situation that feels uncomfortable</li>
    <li><strong>You</strong> should report concerning behavior to {BRAND.name} immediately</li>
  </ul>
  
  <h3 className="font-display text-lg font-semibold text-foreground mt-6 mb-3">
    What We Do NOT Do
  </h3>
  <ul className="list-disc pl-6 space-y-2">
    <li>We do <strong>NOT</strong> conduct criminal background checks on users</li>
    <li>We do <strong>NOT</strong> verify identities beyond email confirmation and age verification</li>
    <li>We do <strong>NOT</strong> supervise or monitor quests in-person</li>
    <li>We do <strong>NOT</strong> guarantee the safety, conduct, or intentions of any user</li>
    <li>We do <strong>NOT</strong> guarantee that quests will occur as planned</li>
  </ul>
  
  <p className="mt-4 font-semibold">
    By using {BRAND.name}, you voluntarily assume all risks associated with meeting other users 
    in person, including but not limited to risks of personal injury, property damage, emotional 
    distress, or any other harm that may result from interactions with other users.
  </p>
</section>
```

### 2.3 Expand "Limitation of Liability" Section

```tsx
{/* ============ SECTION: Limitation of Liability ============ */}
<section>
  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
    Limitation of Liability
  </h2>
  <p className="mb-4">
    To the maximum extent permitted by applicable law:
  </p>
  
  <p className="mb-4">
    <strong>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE"</strong> without warranties of 
    any kind, whether express or implied, including but not limited to implied warranties of 
    merchantability, fitness for a particular purpose, and non-infringement.
  </p>
  
  <p className="mb-4">
    {BRAND.name} and its founders, employees, partners, and affiliates shall <strong>NOT</strong> be 
    liable for any:
  </p>
  <ul className="list-disc pl-6 space-y-2">
    <li>Personal injury, assault, or physical harm occurring during or after quests</li>
    <li>Property damage, theft, or loss</li>
    <li>Emotional distress, harassment, or psychological harm</li>
    <li>Actions, conduct, or statements of other users</li>
    <li>Service interruptions, data loss, or technical failures</li>
    <li>Indirect, incidental, special, consequential, or punitive damages</li>
    <li>Lost profits, data, or opportunities</li>
  </ul>
  
  <p className="mt-4">
    <strong>Maximum Liability:</strong> If, notwithstanding the above limitations, {BRAND.name} is 
    found liable to you for any reason, our total liability shall not exceed one hundred dollars ($100) 
    or the total amount you have paid us in the twelve (12) months preceding the claim, whichever is greater.
  </p>
  
  <p className="mt-4 text-sm">
    Some jurisdictions do not allow the exclusion of certain warranties or limitations on liability. 
    In such jurisdictions, our liability shall be limited to the greatest extent permitted by law.
  </p>
</section>
```

### 2.4 New Section: "Dispute Resolution" (Add before "Changes to Terms")

```tsx
{/* ============ SECTION: Dispute Resolution ============ */}
<section id="dispute-resolution">
  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
    Dispute Resolution & Governing Law
  </h2>
  
  <p className="mb-4">
    These Terms are governed by the laws of the State of Texas, without regard to its conflict of law principles.
  </p>
  
  <h3 className="font-display text-lg font-semibold text-foreground mt-6 mb-3">
    Informal Resolution
  </h3>
  <p className="mb-4">
    Before filing any formal dispute, you agree to contact us at{' '}
    <a href="mailto:hello@openclique.com" className="text-primary hover:underline">
      hello@openclique.com
    </a>{' '}
    and attempt to resolve the dispute informally for at least 30 days.
  </p>
  
  <h3 className="font-display text-lg font-semibold text-foreground mt-6 mb-3">
    Binding Arbitration
  </h3>
  <p className="mb-4">
    Any dispute that cannot be resolved informally shall be resolved through binding arbitration 
    in Austin, Texas, rather than in court. You and {BRAND.name} both waive the right to a jury 
    trial or to participate in a class action lawsuit.
  </p>
  
  <h3 className="font-display text-lg font-semibold text-foreground mt-6 mb-3">
    Exceptions
  </h3>
  <p>
    Either party may seek injunctive or other equitable relief in court if necessary to protect 
    intellectual property rights or confidential information, or to prevent imminent harm.
  </p>
</section>
```

---

## Phase 3: Privacy Policy Additions

### 3.1 New Section: "Age Requirements" (Add after "Our Commitment")

```tsx
{/* ============ SECTION: Age Requirements ============ */}
<section>
  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
    Age Requirements
  </h2>
  <p>
    {BRAND.name} is intended for adults aged 18 and older. During signup, we collect your 
    date of birth to verify your age. This information:
  </p>
  <ul className="list-disc pl-6 space-y-2 mt-4">
    <li>Is required to create an account</li>
    <li>Is used only for age verification</li>
    <li>Is never shared with other users</li>
    <li>Is stored securely and protected by our privacy policies</li>
  </ul>
  <p className="mt-4">
    <strong>We do not knowingly collect data from anyone under 18.</strong> If we discover 
    that a user is under 18, their account will be terminated and their data deleted.
  </p>
</section>
```

### 3.2 Update "Data Retention" Section

Add location auto-delete information:

```tsx
<li>
  <strong>Location data:</strong> Check-in location coordinates are automatically deleted 
  after 90 days, regardless of account status. Only approximate location (~1km accuracy) 
  is ever stored.
</li>
```

---

## Phase 4: UI Components

### 4.1 Age Verification Screen

**New file:** `src/components/onboarding/AgeVerification.tsx`

Features:
- Date of birth input (MM/DD/YYYY)
- Real-time age calculation
- Clear explanation of why we ask
- Friendly rejection for users under 18
- Stores `date_of_birth` and `age_verified_at` in profiles

### 4.2 User Blocking

**New files:**
- `src/components/users/BlockUserDialog.tsx`
- `src/components/users/BlockedUsersSettings.tsx`
- `src/hooks/useUserBlocks.ts`

Integration points:
- User profile pages (report/block option)
- Squad chat participant list
- Quest participant views
- Settings > Privacy > Blocked Users

### 4.3 SOS Alert Button

**New files:**
- `src/components/safety/SOSButton.tsx`
- `src/components/safety/SOSConfirmDialog.tsx`
- `src/components/safety/SOSSuccessScreen.tsx`

Features:
- Floating red button on active quest pages
- Two-step confirmation (prevent accidents)
- Auto-request location on confirm
- Immediate notification to admin
- Emergency resources displayed (911)
- Resolves via admin dashboard

### 4.4 Safety Guidelines Modal

**New file:** `src/components/safety/SafetyGuidelinesModal.tsx`

Show on:
- First quest signup (mandatory read)
- Quest detail pages (optional access)
- Settings > Safety (reference)

Content:
- Meet in public places
- Tell someone your plans
- Trust your instincts
- Report concerns
- Emergency contacts

---

## Phase 5: Admin Dashboard Enhancements

### 5.1 SOS Alerts Panel

**Add to:** `src/components/admin/ModerationDashboard.tsx`

New tab: "SOS Alerts"
- Real-time list of active alerts (high priority)
- User info, quest context, location map link
- Quick resolve buttons (resolved / false alarm)
- Audit trail of actions

### 5.2 Age Verification Audit

**Add to:** Admin user detail views

Show:
- Date of birth (admin only)
- Age at registration
- Verification timestamp
- Flag if potentially fraudulent

### 5.3 Block Management

**Add to:** Admin user shadow mode / user detail

Show:
- Users this person has blocked
- Users who have blocked this person
- Block/unblock on behalf of user (for moderation)

---

## Phase 6: Consent Flows

### 6.1 Signup Consent Checklist

Update signup/onboarding flow:

1. **Welcome screen**
2. **Age verification** (DOB input, 18+ check)
3. **Terms agreement** (checkbox, not pre-checked)
   - Key points summary
   - Links to full documents
   - Explicit "I Agree" action
4. **Optional permissions**
   - Location for check-ins (opt-in)
   - Email notifications (opt-in with defaults)
5. **Safety brief** (first-time read)
6. **Continue to profile creation**

### 6.2 Check-in Consent Flow

When user taps "Check In":

1. **Method selection dialog**
   - Manual check-in (no location)
   - Location-verified check-in
   - QR code scan
   - Photo upload

2. **If location selected:**
   - Clear explanation of what we collect
   - What we will/won't do
   - Browser permission request
   - Fallback to manual if denied

3. **Both methods award same XP**

---

## Implementation Order

### Sprint 1: Legal Foundation (Policies + Schema)
1. Database migration (DOB, blocks, SOS, check-in columns)
2. Terms of Service updates (Eligibility, Risk, Liability, Arbitration)
3. Privacy Policy updates (Age, Location retention)

### Sprint 2: Core Safety (Age + Blocking)
4. Age verification component + signup integration
5. User blocking infrastructure + UI
6. Blocked user enforcement in matching/visibility

### Sprint 3: Emergency & Admin (SOS + Dashboard)
7. SOS alert system (button, flow, database)
8. Admin SOS dashboard panel
9. Admin age verification audit views

### Sprint 4: Consent Polish (Flows + Guidelines)
10. Check-in method selection with consent
11. Safety guidelines modal
12. Onboarding consent checklist updates

### Sprint 5: Cleanup & Testing
13. Location auto-delete scheduled job
14. Security testing (age bypass, block enforcement)
15. Legal document review with counsel

---

## Security Verification Checklist

After implementation, verify:

### Age Verification
- [ ] User under 18 cannot create account
- [ ] User cannot skip age verification step
- [ ] Date of birth is hidden from other users via RLS
- [ ] Age is calculated dynamically, not stored as static
- [ ] Admin can see DOB for moderation

### User Blocking
- [ ] Blocked user cannot see blocker's profile
- [ ] Blocked user cannot message blocker
- [ ] Blocked users not matched in same squad
- [ ] Blocked user doesn't know they're blocked
- [ ] User can unblock from settings

### SOS Alerts
- [ ] Alert sends immediately on confirm
- [ ] Location captured if available
- [ ] Admin receives high-priority notification
- [ ] Alert appears in moderation dashboard
- [ ] Resolution creates audit trail

### Location Privacy
- [ ] Location is optional for check-in
- [ ] Coordinates rounded to ~1km
- [ ] Other users cannot see check-in location
- [ ] Auto-delete job runs successfully
- [ ] 90-day old locations actually deleted

### Legal Documents
- [ ] Privacy Policy covers all data collection
- [ ] Terms includes liability limitations
- [ ] Arbitration clause present
- [ ] Age eligibility stated
- [ ] Documents dated with last update
- [ ] User must actively agree during signup

---

## Questions for Legal Review

Before implementation, confirm with counsel:

1. Is the arbitration clause enforceable in all target states?
2. Are the liability limitations adequate for real-world meetup risks?
3. Is date of birth collection compliant with state privacy laws?
4. Should we add a "Parental Consent" flow for 16-17 year olds, or strictly 18+?
5. Are there additional disclosures required for CCPA "right to know"?
6. Should SOS alert data be retained longer for potential legal proceedings?

---

## Success Metrics

### User Safety
- Time to resolve SOS alerts: < 15 minutes
- Block feature adoption: Track usage
- Safety guidelines read rate: > 90% of new users

### Compliance
- Zero underage accounts discovered post-implementation
- 100% consent logging for Terms agreement
- Location data deleted on schedule

### User Experience
- Signup completion rate: Monitor for drop-off at age verification
- Check-in method preference: Track location vs manual split
- Block feature abuse: Monitor false blocking patterns

---

## Appendix: Existing Infrastructure to Reuse

| System | How to Integrate |
|--------|-----------------|
| `moderation_flags` table | Add SOS alerts as high-priority flag type |
| `user_consent_log` table | Log Terms agreement, age verification consent |
| `support_tickets` | Link SOS alerts to tickets for follow-up |
| `ModerationDashboard` | Add SOS Alerts tab |
| `admin_audit_log` | Log all moderation actions on blocks/SOS |
| `notifications` system | Alert admins on SOS |
| `profiles_public` view | Exclude blocked users automatically |
