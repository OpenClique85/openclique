# Contributing to OpenClique

Welcome! This guide will help you get started contributing to the OpenClique platform.

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
│   │   ├── admin/       # Admin dashboard
│   │   ├── creators/    # Creator portal
│   │   ├── sponsors/    # Sponsor portal
│   │   ├── profile/     # User profile sections
│   │   └── ui/          # shadcn/ui primitives
│   ├── constants/       # Content and configuration
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components
│   └── integrations/    # Auto-generated (DO NOT EDIT)
├── supabase/
│   ├── functions/       # Edge functions
│   └── migrations/      # Database migrations
└── docs/                # Additional documentation
```

## 🔧 Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Lovable Cloud (Supabase)
- **State**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Testing**: Vitest

## 📝 Development Guidelines

### Code Style

- Use TypeScript strict mode
- Follow existing patterns in the codebase
- Use semantic color tokens from the design system
- Keep components focused and small
- Extract reusable logic into hooks

### Component Documentation

Every component file should have a documentation header:

```typescript
/**
 * =============================================================================
 * COMPONENT NAME
 * =============================================================================
 * 
 * Purpose: Brief description of what this component does.
 * 
 * Props:
 *   - propName: Description of prop
 * 
 * Database Dependencies:
 *   - table_name: How it's used
 * 
 * Location: Where this component appears in the app
 * 
 * @component ComponentName
 * =============================================================================
 */
```

### Hook Documentation

```typescript
/**
 * =============================================================================
 * HOOK NAME
 * =============================================================================
 * 
 * Purpose: What this hook provides.
 * 
 * Usage:
 *   const { data, isLoading } = useHookName();
 * 
 * Database Dependencies:
 *   - table_name: Relationship to data
 * 
 * Related Files:
 *   - path/to/related/file.tsx
 * 
 * @module hooks/useHookName
 * =============================================================================
 */
```

### Database Migrations

When adding database changes:

1. Use the Lovable migration tool (never edit `types.ts` directly)
2. Include comprehensive SQL comments
3. Add RLS policies for security
4. Test with both authenticated and unauthenticated users

Example migration:

```sql
-- =============================================================================
-- MIGRATION: Add feature_name
-- =============================================================================
-- Purpose: Brief description
-- Tables Affected: table1, table2
-- =============================================================================

CREATE TABLE public.my_table (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- ... columns
);

-- Enable RLS
ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "..." ON public.my_table FOR SELECT USING (...);
```

## 🔀 Git Workflow

### Branch Naming

```
feature/add-achievement-badges
fix/xp-calculation-overflow
refactor/extract-gamification-hooks
docs/update-readme
chore/update-dependencies
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add achievement auto-unlock on XP award
fix: prevent double XP award on repeated status update
refactor: extract ProfileGamificationSection component
docs: add gamification system documentation
test: add useUserLevel hook tests
chore: update React Query to v5
```

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear commits
3. Ensure all tests pass: `npm test`
4. Ensure no TypeScript errors: `npm run build`
5. Create a PR with a clear description
6. Request review from a team member

### PR Checklist

- [ ] Tests pass locally (`npm test`)
- [ ] No TypeScript errors (`npm run build`)
- [ ] UI tested on mobile and desktop
- [ ] Database migrations reviewed for security
- [ ] Documentation updated if needed
- [ ] No console.log statements in production code

## 🎮 Gamification System

The gamification system is central to OpenClique. Key concepts:

### XP Flow
```
Quest completed → award_quest_xp() → global XP + tree XP → check achievements
```

### Achievement Criteria Types
```typescript
{ type: 'quest_count', count: 5 }           // Complete N quests
{ type: 'tree_xp', tree: 'culture', amount: 100 }  // Tree-specific XP
{ type: 'total_xp', amount: 500 }           // Overall XP threshold
{ type: 'feedback_count', count: 3 }        // Feedback submissions
```

### Key Hooks
- `useUserLevel()` - Level and XP progress
- `useUserTreeXP()` - XP per progression tree
- `useUserAchievements()` - Achievement unlock status
- `useUserStreaks()` - Activity streaks

## 🧪 Testing

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run specific file
npm test -- src/hooks/useUserLevel.test.ts

# Run with coverage
npm run test:coverage
```

### Test File Naming
- Component tests: `ComponentName.test.tsx`
- Hook tests: `useHookName.test.ts`
- Utility tests: `utilName.test.ts`

## 🔒 Security

- Never commit API keys or secrets
- Always add RLS policies to new tables
- Use parameterized queries (Supabase handles this)
- Validate user input on both client and server
- Check `auth.uid()` in RLS policies for user data

## ❓ Getting Help

- Check the [Codebase Guide](src/CODEBASE_GUIDE.md)
- Look at existing similar components/hooks
- Ask in the team Slack channel
- Create an issue for bugs or feature requests

## 📚 Additional Resources

- [React Docs](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Supabase Docs](https://supabase.com/docs)
