# OpenClique Codebase Guide

> **For Non-Developers & New Engineers**: This guide explains how the codebase is organized so you can find and edit content easily. For detailed architecture docs, see `/docs/`.

---

## 🚀 Quick Start for New Engineers

```bash
# 1. Clone the repository
git clone https://github.com/your-org/openclique.git
cd openclique

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Run tests
npm test
```

### Environment Setup
The project uses Lovable Cloud (Supabase-powered backend). Environment variables are auto-configured. If you need to add new secrets, use the Lovable secrets manager.

---

## 📁 Folder Structure Overview

```
src/
├── assets/              ← Images, logos, photos
├── components/          ← Reusable UI building blocks
│   ├── admin/           ← Admin dashboard components
│   ├── creators/        ← Creator portal components
│   ├── feedback/        ← Post-quest feedback flow
│   ├── forms/           ← Application forms
│   ├── profile/         ← User profile sections
│   ├── progression/     ← Quest progression tree UI
│   ├── quest-builder/   ← Creator quest wizard
│   ├── rewards/         ← Sponsor rewards components
│   ├── sponsors/        ← Sponsor portal components
│   ├── squads/          ← Squad management UI
│   └── ui/              ← shadcn/ui primitives (don't edit)
├── constants/           ← ⭐ EDIT CONTENT HERE (text, links, data)
│   └── quests/          ← Quest catalog by category
├── hooks/               ← Custom React hooks
│   ├── useAuth.tsx      ← Authentication context
│   ├── useUserLevel.ts  ← XP/Level calculations
│   ├── useUserTreeXP.ts ← Progression tree XP
│   └── ...              ← Other shared logic
├── integrations/        ← Auto-generated (DO NOT EDIT)
│   └── supabase/        ← Types & client
├── lib/                 ← Utility functions
├── pages/               ← Full page layouts
└── test/                ← Testing files
```

---

## 🎮 Gamification System Architecture

### Overview
The gamification system incentivizes quest participation through XP, levels, achievements, and streaks.

### Database Tables
| Table | Purpose |
|-------|---------|
| `user_xp` | Total XP per user |
| `xp_transactions` | XP award history with source tracking |
| `user_tree_xp` | XP per progression tree (culture/wellness/connector) |
| `level_thresholds` | Level names and XP requirements |
| `achievement_templates` | Achievement definitions with criteria |
| `user_achievements` | User's unlocked achievements |
| `streak_rules` | Streak definitions (weekly/monthly) |
| `user_streaks` | User's active streaks |

### Key Database Functions
```sql
-- Award XP after quest completion (auto-checks achievements)
award_quest_xp(p_user_id UUID, p_quest_id UUID) → INTEGER

-- Check and unlock any qualified achievements
check_and_unlock_achievements(p_user_id UUID) → TABLE

-- Get user's current level info
get_user_level(p_user_id UUID) → TABLE
```

### Achievement Criteria Types
```typescript
// Supported criteria in achievement_templates.criteria JSONB:
{ type: 'quest_count', count: 5 }           // Complete N quests
{ type: 'tree_xp', tree: 'culture', amount: 100 }  // Tree-specific XP
{ type: 'total_xp', amount: 500 }           // Overall XP threshold
{ type: 'feedback_count', count: 3 }        // Feedback submissions
```

### XP Flow Diagram
```
Quest Completed (Admin marks 'completed')
        ↓
SignupsManager.updateStatus()
        ↓
supabase.rpc('award_quest_xp', { user_id, quest_id })
        ↓
┌───────────────────────────────────────┐
│  award_quest_xp()                     │
│  1. Get quest.base_xp & tree_id       │
│  2. award_xp() → global XP            │
│  3. award_tree_xp() → tree XP         │
│  4. check_and_unlock_achievements()   │
└───────────────────────────────────────┘
        ↓
Toast: "+50 XP awarded, 3 achievements unlocked!"
```

### React Hooks
| Hook | Purpose | Returns |
|------|---------|---------|
| `useUserLevel()` | Current level, XP, progress | `{ level, name, currentXP, progressPercent }` |
| `useUserTreeXP()` | XP per tree | `{ treeXP: { culture, wellness, connector } }` |
| `useUserAchievements()` | All achievements + unlock status | `{ achievements, unlockedCount }` |
| `useUserStreaks()` | Active streaks | `{ streaks, totalActiveStreaks }` |

---

## ⭐ Where to Edit Content (No Coding Required)

### Text, Headlines, Descriptions
**File:** `src/constants/content.ts`

This is the main file for all website copy. Use Ctrl+F to search for text you want to change.

| Section | What It Controls |
|---------|------------------|
| `BRAND` | Company name, tagline, description |
| `NAV_LINKS` | Navigation menu items |
| `FORM_URLS` | Google Form signup links |
| `SOCIAL_LINKS` | Instagram, LinkedIn URLs |
| `HERO` | Homepage headline and buttons |
| `BENEFITS` | Homepage benefit cards |
| `FAQ` | Frequently asked questions |

### Quest Information
**Folder:** `src/constants/quests/`

| File | What It Controls |
|------|------------------|
| `culture-quests.ts` | Arts, music, film quests |
| `wellness-quests.ts` | Fitness, health quests |
| `connector-quests.ts` | Social, hobby quests |
| `page-config.ts` | Quests page title and description |
| `index.ts` | Order of quests on the page |

---

## 🖼️ Where to Find/Add Images

### Image Locations
```
src/assets/
├── austin/              ← Austin lifestyle photos
├── quests/              ← Quest-specific images
├── team/                ← Team member photos
├── traction/            ← Press/award photos
├── buggs-*.png          ← Mascot images
└── logo.png             ← Main logo
```

### How to Add a New Image
1. Add the image file to the appropriate folder
2. In your component/content file, import it:
   ```typescript
   import myImage from "@/assets/folder/image-name.jpg";
   ```
3. Use it in the code:
   ```typescript
   <img src={myImage} alt="Description" />
   ```

---

## 📄 Page Files

Each page on the website has its own file in `src/pages/`:

| File | URL | Purpose |
|------|-----|---------|
| `Index.tsx` | `/` | Homepage |
| `HowItWorks.tsx` | `/how-it-works` | Process explanation |
| `About.tsx` | `/about` | Company story |
| `Quests.tsx` | `/quests` | Quest catalog |
| `Profile.tsx` | `/profile` | User dashboard + gamification |
| `MyQuests.tsx` | `/my-quests` | User's quest signups |
| `Admin.tsx` | `/admin` | Admin operations console |
| `CreatorDashboard.tsx` | `/creator/dashboard` | Creator portal |
| `SponsorDashboard.tsx` | `/sponsor/dashboard` | Sponsor portal |

---

## 🎨 Styling & Colors

### Brand Colors (defined in `tailwind.config.ts` and `src/index.css`)

| Color Name | Usage | CSS Variable |
|------------|-------|--------------|
| `primary` | Main teal/brand color | `--primary` |
| `sunset` | Orange (partners) | `--sunset` |
| `creator` | Purple (creators) | `--creator` |
| `navy` | Dark blue (work with us) | `--navy` |
| `foreground` | Main text color | `--foreground` |
| `muted-foreground` | Secondary text | `--muted-foreground` |
| `background` | Page background | `--background` |

### Using Colors in Code
```typescript
// Use Tailwind classes with color names:
className="text-primary"           // Teal text
className="bg-sunset"              // Orange background
className="text-muted-foreground"  // Gray secondary text
```

---

## 🧩 Key Components

### Layout Components
| Component | Purpose |
|-----------|---------|
| `Navbar.tsx` | Top navigation bar |
| `Footer.tsx` | Page footer |
| `Hero.tsx` | Homepage banner |

### Content Components
| Component | Purpose |
|-----------|---------|
| `QuestCard.tsx` | Individual quest display |
| `BenefitsSection.tsx` | Homepage benefits grid |
| `FAQ.tsx` | Expandable FAQ section |
| `CTASection.tsx` | Call-to-action blocks |

### Gamification Components
| Component | Purpose |
|-----------|---------|
| `ProfileGamificationSection.tsx` | Full gamification display on profile |
| `XPBadge.tsx` | Compact XP display |

### UI Components (in `components/ui/`)
These are pre-built, reusable elements. Generally don't edit these:
- `button.tsx` - All buttons
- `card.tsx` - Card containers
- `dialog.tsx` - Modal popups
- `dropdown-menu.tsx` - Dropdown menus

---

## 🔧 Common Tasks

### Change a Button Label
1. Find which page the button is on
2. Check if text comes from `src/constants/content.ts`
3. Edit the text in the content file, or in the component directly

### Add a New FAQ
1. Open `src/constants/content.ts`
2. Find the `FAQ` section
3. Add a new object: `{ question: "Your question?", answer: "Your answer." }`

### Change Google Form URL
1. Open `src/constants/content.ts`
2. Find `FORM_URLS` section
3. Replace the URL in quotes

### Add a New Quest
1. Open the appropriate category file in `src/constants/quests/`
2. Copy an existing quest object
3. Update all fields with new quest info
4. Quest automatically appears on the site

### Add a New Achievement (Admin)
1. Go to Admin Console → Gamification → Achievements
2. Click "Add Achievement"
3. Fill in name, description, icon, criteria, and XP reward
4. Save - it's automatically available for unlock

---

## 🔒 Authentication & Roles

### Role-Based Access
| Role | Access | How to Assign |
|------|--------|---------------|
| `admin` | Full admin console | Add to `user_roles` table |
| `creator` | Creator portal | Approve creator application |
| `sponsor` | Sponsor portal | Approve sponsor application |

### Protected Routes
```typescript
// Example: Check if user is admin
const { isAdmin } = useAuth();
if (!isAdmin) return <AccessDenied />;
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- src/test/example.test.ts
```

---

## 📝 Git Workflow

### Branch Naming
```
feature/add-streak-bonuses
fix/xp-calculation-bug
refactor/signups-manager
```

### Commit Messages
```
feat: add achievement auto-unlock on XP award
fix: prevent double XP award on status update
refactor: extract gamification hooks
docs: update codebase guide with gamification
```

### Pull Request Checklist
- [ ] Tests pass locally
- [ ] No TypeScript errors
- [ ] UI tested on mobile and desktop
- [ ] Database migrations reviewed
- [ ] Documentation updated if needed

---

## 💡 Tips

1. **Always save after editing** - Changes appear immediately in preview
2. **Use Ctrl+Z to undo** - If you break something, undo it
3. **Don't delete commas** - JavaScript needs them between items
4. **Keep quotes around text** - Text must be in "quotes" or 'quotes'
5. **Test on mobile** - Use browser dev tools to check mobile view

---

## 🆘 Need Help?

If something breaks:
1. Check the browser console for errors (F12 → Console tab)
2. Use Ctrl+Z to undo recent changes
3. Ask a developer to review the error message

---

*Last updated: January 2025*
