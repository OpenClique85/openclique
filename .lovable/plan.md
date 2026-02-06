
# Plan: BUGGS PWA Icon + Clique Chat System

## Overview
Two main changes are needed:
1. **PWA Icon Update**: Replace current icon with BUGGS face + "OC" branding
2. **Clique Chat System**: Enable persistent cliques (like "Bagel Boys") to have group chat lobbies with quest suggestion capabilities

---

## Part 1: PWA Icon Update

### What Needs to Change
The current PWA icon is a purple gradient with people silhouettes. You want BUGGS (the bunny mascot) with "OC" text above him.

### Implementation
1. **Create new icon assets** based on the uploaded BUGGS face image with "OC" text added
   - `public/pwa-192x192.png` - 192x192 version
   - `public/pwa-512x512.png` - 512x512 version  
   - `public/apple-touch-icon-180x180.png` - iOS version
   - `public/favicon.png` - Browser tab icon

2. **Design specifications**:
   - Background: Light/white circle with mint/teal border ring (as shown in uploaded image)
   - "OC" text positioned above BUGGS head
   - BUGGS face centered in the icon

**Note**: This requires creating new graphic assets. You'll need to provide or approve a designed icon with the "OC" text added above BUGGS before I can implement it.

---

## Part 2: Clique Chat System

### Current Architecture
- `squads` table = **persistent cliques** (like "Bagel Boys")
- `quest_squads` table = **temporary instance-based groups** (for specific quest runs)
- `squad_chat_messages.squad_id` currently references ONLY `quest_squads`
- Persistent cliques have NO chat functionality

### What's Needed
Enable persistent cliques to have their own group chat lobbies where members can:
- Send/receive real-time messages
- Suggest quests to the group
- View member activity

### Database Changes
A new `clique_chat_messages` table will be created for persistent clique chat (keeping existing `squad_chat_messages` for quest-based groups):

```text
┌─────────────────────────────────────┐
│       clique_chat_messages          │
├─────────────────────────────────────┤
│ id (uuid, primary key)              │
│ clique_id (uuid) → squads.id        │
│ sender_id (uuid) → profiles.id      │
│ message (text)                      │
│ sender_type (text)                  │
│ created_at (timestamp)              │
│ is_pinned (boolean)                 │
│ thread_id (uuid, self-reference)    │
│ reactions (jsonb)                   │
│ media_url (text)                    │
│ media_type (text)                   │
└─────────────────────────────────────┘
```

RLS policies:
- Members can read messages from their own cliques
- Members can insert messages to their own cliques
- Admins have full access

### Frontend Changes

1. **Add Chat Tab to CliqueDetail page** (`src/pages/CliqueDetail.tsx`)
   - Add 5th tab: "Chat" with MessageSquare icon
   - Include chat component and quest suggestion button

2. **Create CliquePersistentChat component** (`src/components/cliques/CliquePersistentChat.tsx`)
   - Real-time chat using Supabase realtime
   - Message display with sender names and timestamps
   - Input field with send button
   - Auto-scroll to latest messages

3. **Integrate SuggestQuestModal in chat view**
   - Button to open quest suggestion modal
   - Already exists at `src/components/cliques/SuggestQuestModal.tsx`

4. **Update component exports** (`src/components/cliques/index.ts`)

---

## Technical Implementation Details

### Files to Create
- `src/components/cliques/CliquePersistentChat.tsx` - New chat component for persistent cliques

### Files to Modify
- `src/pages/CliqueDetail.tsx` - Add Chat tab with chat component and quest suggestion
- `src/components/cliques/index.ts` - Export new component
- PWA icon files in `public/` directory

### Database Migration
New table and RLS policies for `clique_chat_messages`

---

## Sequence of Work

1. Database migration to create `clique_chat_messages` table with RLS
2. Create `CliquePersistentChat` component
3. Update `CliqueDetail.tsx` to add Chat tab
4. Update component exports
5. Create new PWA icon assets (pending your approval of design)

---

## Questions Before Proceeding

For the PWA icon: Would you like me to proceed with the BUGGS face image you uploaded and add "OC" text above it programmatically, or do you have a finished icon design ready to use?
