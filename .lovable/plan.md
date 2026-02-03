
# Solo Squad Simulation - Admin Testing Console

## Overview

This feature creates a complete testing environment where a single admin can simulate the full squad experience (chat, check-in, verification, rewards) using AI-powered bot personas instead of logging in/out of multiple test accounts.

---

## How It Works

```text
┌─────────────────────────────────────────────────────────────────┐
│                    SOLO SQUAD SIMULATOR                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   🧑 You     │  │  🤖 Bot 1    │  │  🤖 Bot 2    │          │
│  │   (Admin)    │  │  "Luna"      │  │  "Max"       │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   SQUAD CHAT                             │   │
│  │  [You]: Hey everyone! Excited for this quest!           │   │
│  │  [Luna 🤖]: Same here! First time doing something like  │   │
│  │            this. Should be fun!                          │   │
│  │  [Max 🤖]: Looking forward to meeting you all IRL!      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Type message...]                              [Send]          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  SIMULATION CONTROLS                                     │   │
│  │  [✓] Bots auto-reply to your messages                   │   │
│  │  [Trigger Check-in] [Award XP] [Complete Quest]         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Solo Simulation Edge Function

Creates a test squad with the admin + 2 bot "members":

- Creates a test quest instance (if needed)
- Creates a squad with the admin as a real member
- Creates 2-3 synthetic bot members (stored as special profiles)
- Bots have `is_synthetic: true` flag in profiles table

### 2. Bot Chat Response System

When admin sends a message:
- A simple rule-based bot generates contextual replies
- Replies are delayed 2-5 seconds to feel natural
- Bot messages appear with a 🤖 badge in chat
- Bots respond to icebreaker prompts automatically

### 3. Simulation Control Panel

Admin tools to:
- **Trigger bot messages** - Make bots chat without waiting
- **Simulate check-in** - Mark bots as checked in
- **Award XP** - Test the reward flow for all members
- **Complete quest** - Transition squad to completed state
- **Reset simulation** - Clear and start fresh

---

## Implementation Details

### Part 1: Database Changes

Add a column to identify synthetic test users:

```sql
-- Add synthetic flag to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS is_synthetic BOOLEAN DEFAULT false;

-- Add simulation tracking to squads
ALTER TABLE quest_squads
  ADD COLUMN IF NOT EXISTS is_simulation BOOLEAN DEFAULT false;
```

### Part 2: Synthetic Bot Profiles

Create 3 reusable bot personas:

| Name | Personality | Avatar |
|------|-------------|--------|
| Luna Martinez | Enthusiastic first-timer, asks questions | 🌙 |
| Max Chen | Experienced adventurer, supportive | ⛰️ |
| Riley Kim | Quiet observer, thoughtful responses | 📚 |

### Part 3: Edge Function - Create Solo Simulation

```text
POST /functions/v1/create-solo-simulation

Request:
{
  "botCount": 2,           // 1-3 bots
  "questType": "hiking"    // optional - picks/creates appropriate quest
}

Response:
{
  "success": true,
  "squadId": "uuid",
  "instanceId": "uuid",
  "members": [
    { "userId": "admin-id", "name": "You", "isBot": false },
    { "userId": "bot-luna", "name": "Luna Martinez", "isBot": true },
    { "userId": "bot-max", "name": "Max Chen", "isBot": true }
  ]
}
```

### Part 4: Bot Response Logic

Simple pattern-based responses:

```typescript
const BOT_RESPONSES = {
  greeting: [
    "Hey! Excited to meet everyone! 👋",
    "Hello squad! Can't wait for this adventure!",
    "Hi all! First time doing something like this 😊"
  ],
  enthusiasm: [
    "This is going to be so much fun!",
    "I've been looking forward to this all week!",
    "Love the energy in this group already!"
  ],
  question: [
    "What should we bring?",
    "Anyone been to this location before?",
    "What time are we meeting exactly?"
  ],
  ready: [
    "I'm all set! See you there!",
    "Ready to go! 🎒",
    "Confirmed and excited!"
  ]
};

// Bot responds based on message content keywords
function generateBotReply(userMessage: string, botPersonality: string): string {
  if (userMessage.includes('?')) {
    return pickRandom(BOT_RESPONSES.enthusiasm);
  }
  if (userMessage.includes('ready') || userMessage.includes('confirm')) {
    return pickRandom(BOT_RESPONSES.ready);
  }
  // etc.
}
```

### Part 5: Admin UI Component

New section in Dev Tools:

```text
┌─────────────────────────────────────────────────────────────────┐
│ 🧪 Solo Squad Simulator                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Test the complete squad experience solo with AI bots.          │
│                                                                 │
│ Bot Count: [2 ▼]    Quest Type: [Random ▼]                     │
│                                                                 │
│ [🚀 Create Solo Simulation]                                    │
│                                                                 │
│ ─────────────────────────────────────────────────────────────  │
│                                                                 │
│ Active Simulation: "Trail Blazers" 🟢                          │
│ Members: You + Luna 🤖 + Max 🤖                                 │
│                                                                 │
│ [Open Squad Chat] [View in Pilot] [End Simulation]             │
│                                                                 │
│ Quick Actions:                                                  │
│ [Trigger Bot Reply] [Check-in All] [Award XP] [Complete]       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/create-solo-simulation/index.ts` | Creates test squad with admin + bots |
| `supabase/functions/simulate-bot-reply/index.ts` | Generates contextual bot responses |
| `src/components/admin/SoloSquadSimulator.tsx` | Admin UI for simulation controls |
| `src/constants/botPersonas.ts` | Bot profiles and response patterns |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/DevToolsSection.tsx` | Add Solo Squad Simulator section |
| `supabase/config.toml` | Add function configurations |

---

## User Flow

1. **Admin opens Dev Tools** → Sees "Solo Squad Simulator" card
2. **Clicks "Create Solo Simulation"** → Edge function creates squad with admin + 2 bots
3. **Opens squad chat** → Sees themselves + bot members, can send messages
4. **Bots auto-reply** → Within 2-5 seconds, bots respond contextually
5. **Tests features:**
   - Send messages → Bots reply
   - Trigger check-in → All members marked as checked in
   - Award XP → XP flows to all members (bots excluded from leaderboards)
   - Complete quest → Squad transitions to completed state
6. **End simulation** → Cleans up test data or archives squad

---

## Safety & Cleanup

- Simulation squads are marked `is_simulation: true`
- Bot profiles are marked `is_synthetic: true`
- Both excluded from:
  - Public leaderboards
  - Analytics/metrics
  - Recommendation algorithms
- Cleanup function removes all simulation data on demand

---

## Technical Notes

### Bot Message Timing

```typescript
// Add realistic delays to bot responses
const delay = 2000 + Math.random() * 3000; // 2-5 seconds
setTimeout(() => sendBotMessage(), delay);
```

### Chat Integration

Bots send messages via the existing `squad_chat_messages` table:
- `sender_type: 'user'` (appear as real users)
- But `sender_id` points to synthetic profile
- Admin chat viewer shows 🤖 badge for synthetic users

### XP Handling

When testing XP awards:
- Real admin receives actual XP
- Bot XP is tracked but excluded from rankings
- `is_synthetic` flag on profiles filters them out

---

## Summary

This Solo Squad Simulator enables:

1. **Full chat testing** - Send messages, bots reply naturally
2. **Check-in testing** - Simulate the entire check-in flow
3. **Reward testing** - Verify XP, badges, achievements work
4. **Quest completion** - Test the end-to-end journey

All from a single admin account, no browser tab switching required.
