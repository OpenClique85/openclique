
# Revised Plan: In-Chat Photo Upload + Enhanced Feedback System

## Summary

This plan integrates **in-chat photo uploads** with admin approval, **enhanced feedback questions** (NPS, venue, clique member selection), and an **"End Quest" admin action** that triggers the feedback flow. Key improvements over the original proposal:

- **Streamlined feedback**: 12 core questions instead of 17 (reduces abandonment)
- **Default photo approval**: Photos auto-approve unless flagged (reduces admin bottleneck)
- **Auto-save drafts**: localStorage-based persistence for feedback forms
- **Smart reminders**: Only send if feedback status is not 'completed'

---

## Phase 1: Database Schema Updates

### 1.1 Add Media Columns to `squad_chat_messages`

```sql
ALTER TABLE squad_chat_messages 
ADD COLUMN IF NOT EXISTS media_url text,
ADD COLUMN IF NOT EXISTS media_type text CHECK (media_type IN ('image', 'video')),
ADD COLUMN IF NOT EXISTS is_proof_submission boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS proof_status text DEFAULT 'approved' CHECK (proof_status IN ('pending', 'approved', 'rejected'));
```

**Note**: Default `proof_status = 'approved'` reduces admin workload. Admins can reject if needed.

### 1.2 Extend `feedback` Table for NPS & Venue Questions

```sql
ALTER TABLE feedback
ADD COLUMN IF NOT EXISTS nps_score integer CHECK (nps_score BETWEEN 0 AND 10),
ADD COLUMN IF NOT EXISTS would_invite_friend boolean,
ADD COLUMN IF NOT EXISTS venue_interest_rating integer CHECK (venue_interest_rating BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS venue_revisit_intent text,
ADD COLUMN IF NOT EXISTS sponsor_enhancement text,
ADD COLUMN IF NOT EXISTS venue_improvement_notes text,
ADD COLUMN IF NOT EXISTS preferred_clique_members uuid[];
```

### 1.3 Extend `feedback_requests` for Expiry & Reminders

```sql
ALTER TABLE feedback_requests
ADD COLUMN IF NOT EXISTS instance_id uuid REFERENCES quest_instances(id),
ADD COLUMN IF NOT EXISTS expires_at timestamptz,
ADD COLUMN IF NOT EXISTS reminder_sent_3d boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_sent_6d boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS started_at timestamptz,
ADD COLUMN IF NOT EXISTS completion_time_seconds integer;
```

---

## Phase 2: In-Chat Photo Upload (User Side)

### 2.1 New Component: `ChatMediaPicker.tsx`

Location: `src/components/squads/ChatMediaPicker.tsx`

**Features**:
- Camera capture button (mobile-optimized)
- Gallery/file selection button
- Image preview before send
- Optional "Submit as Quest Proof" toggle
- Client-side image compression (max 2MB)
- Upload to existing `ugc-media` storage bucket

**UI Flow**:
1. User taps camera icon next to send button
2. Selects photo from camera/gallery
3. Preview appears with optional "Quest Proof" checkbox
4. Sends message with attached image

### 2.2 Modify `SquadWarmUpRoom.tsx`

**Changes**:
- Import and render `ChatMediaPicker` next to chat input
- Update `sendMessage` mutation to handle `media_url` and `is_proof_submission`
- Render image messages with photo preview in chat bubbles
- Photos marked as proof show a "Proof Submitted" badge

### 2.3 Modify `useSquadWarmUp.ts`

**Changes**:
- Add `sendMessageWithMedia` mutation that accepts optional `mediaUrl`, `mediaType`, `isProof`
- Handle storage upload within the hook or expect pre-uploaded URL

---

## Phase 3: Admin Run of Show Enhancements

### 3.1 Replace Quick Actions with Quest Objectives Panel

Location: Modify `src/components/admin/pilot/RunOfShowControls.tsx`

**Remove**: Current "Quick Actions" card (lines 419-451)

**Add**: New `QuestObjectivesPanel` component

**Features**:
- Display objectives from `quest_instances.objectives` (parsed from newline-separated or JSON)
- Show as checklist items for admin reference
- Each objective displays completion status if trackable

### 3.2 New Component: `ProofGalleryPanel.tsx`

Location: `src/components/admin/pilot/ProofGalleryPanel.tsx`

**Features**:
- Grid of photos from `squad_chat_messages` where `is_proof_submission = true`
- Filter by clique dropdown
- Each photo shows: thumbnail, submitter name, timestamp, current status
- Quick approve/reject buttons (updates `proof_status`)
- Photos default to approved; admin can reject flagged content
- Link to related objective if available

### 3.3 New Component: `EndQuestDialog.tsx`

Location: `src/components/admin/pilot/EndQuestDialog.tsx`

**Trigger**: New "End Quest & Send Feedback" button in Run of Show

**Flow**:
1. Confirmation modal shows participant count
2. On confirm:
   - Update `quest_instances.status` to 'completed'
   - Create `feedback_requests` for all active participants:
     - Set `instance_id` and `quest_id`
     - Set `expires_at` to 7 days from now
     - Set `status` to 'pending'
   - Send system chat message to all cliques: "Quest complete! Check your profile to give feedback and earn XP."
3. Show success with response tracking card

### 3.4 Feedback Response Tracker

Add to Run of Show controls:

**Display**:
- "Feedback Response Rate: 18/23 (78%)" - live updated
- Status breakdown: Completed / In Progress / Not Started

---

## Phase 4: Enhanced Feedback Form

### 4.1 Streamlined 12-Question Flow

Keep existing 4-step structure but enhance with new questions:

**Step 1: Quick Pulse (Enhanced)**
- Star rating 1-5 (existing)
- "Would you do another quest like this?" (existing)
- Feelings multi-select (existing)
- **NEW**: NPS 0-10 slider: "How likely to join another OpenClique quest?"
- **NEW**: "Would you invite a friend?" Yes/No

**Step 2: Quest & Group (Enhanced)**
- What worked best/weakest (existing)
- Length rating (existing)
- Confusion notes (existing)
- Comfort score (existing)
- **NEW**: "Would you quest with this group again?" with options:
  - "Yes, with everyone!"
  - "Yes, with some members" → triggers member selector
  - "Maybe, if quest is interesting"
  - "Probably not"
- **NEW**: `CliqueMemberSelector` - shows avatars of clique members only (from `squad_members` + `profiles`)

**Step 2B: Venue & Sponsor (New Optional Step)**
- Star rating: "How interested in [Venue Name]?"
- "Visit again?" Yes/No/Already regular
- If sponsor: "Did [Brand] enhance experience?" 4 options
- Optional text: "What would improve venue/brand quest?"

**Step 3: Pricing (existing)**
- Keep as-is

**Step 4: Testimonial (existing)**
- Keep as-is

### 4.2 New Component: `CliqueMemberSelector.tsx`

Location: `src/components/feedback/CliqueMemberSelector.tsx`

**Props**: `squadId`, `currentUserId`, `onSelect`

**Features**:
- Fetch clique members from `squad_members` for the user's squad
- Display avatar + name for each member
- Multi-select checkboxes
- Store selected member IDs in `feedback.preferred_clique_members`

### 4.3 Auto-Save Draft (localStorage)

**Modify `FeedbackFlow.tsx`**:
- Save form state to `localStorage` with key `feedback_draft_${questId}`
- Restore on page load if draft exists
- Clear draft on successful submission
- Auto-save every 30 seconds

### 4.4 XP Calculation Update

| Source | XP |
|--------|-----|
| Step 1 (Quick Pulse + NPS) | 30 XP |
| Step 2 (Quest/Group + Clique) | 50 XP |
| Step 2B (Venue/Sponsor) | 20 XP |
| Step 3 (Pricing) | 50 XP |
| Step 4 (Testimonial) | 100 XP |

**Total possible**: ~250 XP

### 4.5 Progress Bar Enhancement

**Modify `FeedbackProgress.tsx`**:
- Show XP earned so far as animated counter
- Display "Earn up to 250 XP" at start

---

## Phase 5: User Access Points

### 5.1 Profile Hub - Pending Actions

**Modify profile page or create `PendingActionsSection.tsx`**:
- Query `feedback_requests` where `user_id = current_user` AND `status != 'full_complete'` AND `expires_at > now()`
- Display card with quest icon, name, XP reward, days remaining badge
- Click navigates to `/feedback/${questId}`

### 5.2 Quest History Enhancement

- Show "Give Feedback" button if feedback_request exists and not complete
- Show "Feedback Submitted" after completion

---

## File Changes Summary

### New Files (6)
| File | Purpose |
|------|---------|
| `src/components/squads/ChatMediaPicker.tsx` | In-chat photo upload UI |
| `src/components/admin/pilot/QuestObjectivesPanel.tsx` | Quest objectives checklist for admin |
| `src/components/admin/pilot/ProofGalleryPanel.tsx` | Photo proof review grid |
| `src/components/admin/pilot/EndQuestDialog.tsx` | End quest confirmation + feedback trigger |
| `src/components/feedback/CliqueMemberSelector.tsx` | Clique member multi-select |
| `src/components/feedback/FeedbackStepVenue.tsx` | Venue/sponsor questions |

### Modified Files (7)
| File | Changes |
|------|---------|
| `src/components/squads/SquadWarmUpRoom.tsx` | Add ChatMediaPicker, render image messages |
| `src/hooks/useSquadWarmUp.ts` | Add sendMessageWithMedia mutation |
| `src/components/admin/pilot/RunOfShowControls.tsx` | Replace Quick Actions with Objectives + Proof Gallery + End Quest button |
| `src/pages/FeedbackFlow.tsx` | Add NPS, venue step, auto-save, member selection |
| `src/components/feedback/FeedbackStep1.tsx` | Add NPS slider and invite friend question |
| `src/components/feedback/FeedbackStep2.tsx` | Add clique member selection |
| `src/components/feedback/FeedbackProgress.tsx` | Show XP earned counter |

### Database Migrations (3)
1. Add media columns to `squad_chat_messages`
2. Add NPS/venue/member columns to `feedback`
3. Add expiry/reminder columns to `feedback_requests`

---

## Implementation Order

1. **Database migrations** - Foundation for all features
2. **ChatMediaPicker + SquadWarmUpRoom update** - User-facing photo upload
3. **ProofGalleryPanel + QuestObjectivesPanel** - Admin can see photos and objectives
4. **EndQuestDialog** - Admin can trigger feedback
5. **Enhanced feedback steps** - NPS, venue, clique member selection
6. **Auto-save + Progress bar** - UX polish
7. **Pending Actions in profile** - User can find their feedback requests

---

## Technical Notes

### Storage
- Reuse existing `ugc-media` bucket
- Client-side compression before upload (max 2MB)
- Store only URLs in database

### Real-time
- Admin proof gallery auto-refreshes via Supabase realtime on `squad_chat_messages`
- Image messages appear instantly via existing chat subscription

### Privacy
- Clique member preferences stored in `feedback.preferred_clique_members` as UUID array
- Used only for matching algorithms, not displayed publicly

### Risk Mitigations Applied
- Default photo approval reduces admin bottleneck
- 12 questions instead of 17 reduces form abandonment
- localStorage auto-save prevents data loss
- Reminder logic checks status before sending
