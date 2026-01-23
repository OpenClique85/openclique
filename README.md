# OpenClique

> **Community-powered quests that help Austin newcomers discover their city and find their people.**

[![Built with Lovable](https://img.shields.io/badge/Built%20with-Lovable-ff69b4)](https://lovable.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://react.dev/)

## 🌟 Overview

OpenClique is a gamified social platform that connects Austin newcomers through curated group experiences ("quests"). Users earn XP, unlock achievements, and build meaningful connections while exploring the city.

### Key Features

- **Quest Catalog**: Browse and join curated group experiences
- **Gamification System**: XP, levels, achievements, and streaks
- **Squad Formation**: AI-assisted group matching
- **Creator Portal**: Tools for experience hosts
- **Sponsor Portal**: Business partnership management
- **Admin Console**: Operations dashboard

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/openclique.git
cd openclique

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

## 📁 Project Structure

```
openclique/
├── src/
│   ├── assets/          # Static images and media
│   ├── components/      # React components
│   │   ├── admin/       # Admin dashboard (QuestsManager, SignupsManager, etc.)
│   │   ├── creators/    # Creator portal components
│   │   ├── sponsors/    # Sponsor portal components
│   │   ├── profile/     # User profile (ProfileGamificationSection)
│   │   └── ui/          # shadcn/ui primitives
│   ├── constants/       # Content configuration & quest data
│   ├── hooks/           # Custom hooks (useUserLevel, useUserAchievements, etc.)
│   ├── pages/           # Page components
│   └── integrations/    # Auto-generated Supabase types (DO NOT EDIT)
├── supabase/
│   ├── functions/       # Edge functions
│   └── migrations/      # Database migrations
├── CONTRIBUTING.md      # Contribution guidelines
└── src/CODEBASE_GUIDE.md # Detailed developer documentation
```

## 🎮 Gamification Architecture

The gamification system incentivizes quest participation:

```
Quest Completed → award_quest_xp() → Global XP + Tree XP → Auto-unlock Achievements
```

### Key Tables
| Table | Purpose |
|-------|---------|
| `user_xp` | Total XP per user |
| `user_tree_xp` | XP per progression tree (culture/wellness/connector) |
| `level_thresholds` | Level definitions and XP requirements |
| `achievement_templates` | Achievement criteria and rewards |
| `user_achievements` | Unlocked achievements per user |

### Key Hooks
| Hook | Returns |
|------|---------|
| `useUserLevel()` | `{ level, name, currentXP, progressPercent }` |
| `useUserTreeXP()` | `{ treeXP: { culture, wellness, connector } }` |
| `useUserAchievements()` | `{ achievements, unlockedCount }` |

## 🔧 Technology Stack

| Category | Technology |
|----------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui |
| Backend | Lovable Cloud (Supabase) |
| State | TanStack Query v5 |
| Routing | React Router v6 |
| Testing | Vitest |

## 📖 Documentation

- **[Codebase Guide](src/CODEBASE_GUIDE.md)** - Comprehensive developer documentation
- **[Contributing](CONTRIBUTING.md)** - How to contribute to this project
- **[Lovable Docs](https://docs.lovable.dev)** - Platform documentation

## 🔀 Development Workflow

### Branch Naming
```
feature/add-streak-bonuses
fix/xp-calculation-bug
refactor/extract-gamification
```

### Commit Messages
```
feat: add achievement auto-unlock on XP award
fix: prevent double XP award on status update
docs: update gamification documentation
```

### Pull Request Checklist
- [ ] Tests pass (`npm test`)
- [ ] No TypeScript errors (`npm run build`)
- [ ] UI tested on mobile and desktop
- [ ] Documentation updated if needed

## 🚢 Deployment

### Preview
Changes pushed to any branch are automatically deployed to preview URLs.

### Production
1. Open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID)
2. Click **Share → Publish**
3. Changes are deployed to `openclique.lovable.app`

### Custom Domain
Navigate to **Project > Settings > Domains** to connect a custom domain.

## 🔒 Security

- All tables use Row Level Security (RLS)
- API keys are managed via Lovable Cloud secrets
- User data is protected by `auth.uid()` checks

## 📬 Support

- Create an issue for bugs or feature requests
- See [CONTRIBUTING.md](CONTRIBUTING.md) for development help

---

Built with ❤️ in Austin, TX
