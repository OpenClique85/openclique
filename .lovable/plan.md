
# Consolidated Help Center & FAQ System

## Overview

This plan addresses FAQ redundancy, creates a searchable Help Center with glossary, and improves navigation to keep the ribbon clean and focused.

---

## Part 1: Audit & Consolidation

### Current FAQ Redundancy

| Location | Content Source | Status |
|----------|---------------|--------|
| Homepage | `FAQ` array (5 generic) | Keep as teaser, link to full Help |
| About page | Same `FAQ` component | **Remove** - redirect to Help Center |
| How It Works | None | **Add consolidated FAQ section** |
| Work With Us | `WORK_WITH_US_PAGE.faq` | Keep - role-specific |
| Creators | `CREATORS_PAGE.faq` | Keep - creator-specific |

### Consolidation Strategy

1. **How It Works becomes the authoritative FAQ destination** with all platform FAQs
2. Homepage shows 3-4 teaser questions with "See all FAQs →" link
3. About page removes FAQ section entirely
4. Audience-specific FAQs (creators, volunteers) stay on their respective pages

---

## Part 2: Enhanced How It Works Page

### New Structure

```text
┌─────────────────────────────────────────────────────────────────┐
│                         HOW IT WORKS                            │
├─────────────────────────────────────────────────────────────────┤
│ Hero Section (existing)                                         │
├─────────────────────────────────────────────────────────────────┤
│ The Journey - 4 Steps (existing, COLLAPSIBLE)                  │
│   [▼ Expand to see all steps]                                  │
├─────────────────────────────────────────────────────────────────┤
│ Your Quest Journey - PathCarousel (existing)                   │
├─────────────────────────────────────────────────────────────────┤
│ Your Progression - Timeline (existing)                          │
├─────────────────────────────────────────────────────────────────┤
│ Meet BUGGS (existing)                                           │
├─────────────────────────────────────────────────────────────────┤
│ ★ NEW: FAQ Section (Consolidated)                              │
│   - Searchable input                                            │
│   - Category tabs: General | Quests | Matching | Safety | Costs │
│   - Accordion with all FAQs                                     │
├─────────────────────────────────────────────────────────────────┤
│ ★ NEW: Glossary Section                                        │
│   - Searchable A-Z terms                                        │
│   - Quest, Clique, XP, BUGGS, etc.                             │
├─────────────────────────────────────────────────────────────────┤
│ CTA Section (existing)                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 3: Searchable Help Center Components

### 3.1 Consolidated FAQ Data Structure

Update `content.ts` with categorized FAQs:

```typescript
export const HELP_CENTER = {
  categories: [
    { id: 'general', label: 'General', icon: 'HelpCircle' },
    { id: 'quests', label: 'Quests', icon: 'Compass' },
    { id: 'matching', label: 'Matching & Cliques', icon: 'Users' },
    { id: 'safety', label: 'Safety & Privacy', icon: 'Shield' },
    { id: 'costs', label: 'Costs & Pricing', icon: 'CreditCard' },
  ],
  
  faqs: [
    // General
    { category: 'general', question: 'What exactly is a quest?', answer: '...' },
    { category: 'general', question: 'What cities are you in?', answer: '...' },
    
    // Quests
    { category: 'quests', question: 'How long do quests last?', answer: '...' },
    { category: 'quests', question: 'Can I bring friends?', answer: '...' },
    
    // Matching
    { category: 'matching', question: 'How does matching work?', answer: '...' },
    { category: 'matching', question: 'What is a clique?', answer: '...' },
    
    // Safety
    { category: 'safety', question: 'How is my data used?', answer: '...' },
    { category: 'safety', question: 'How do I report someone?', answer: '...' },
    
    // Costs
    { category: 'costs', question: 'How much does it cost?', answer: '...' },
    { category: 'costs', question: 'Are there refunds?', answer: '...' },
  ],
  
  glossary: [
    { term: 'Quest', definition: 'A time-bound, real-world mission...' },
    { term: 'Clique', definition: 'A temporary small group...' },
    { term: 'XP', definition: 'Experience points earned...' },
    { term: 'BUGGS', definition: 'Behavioral Utility for Group Guidance...' },
    { term: 'Meta-Quest', definition: 'Multi-quest progression...' },
    // ... more terms
  ],
};
```

### 3.2 SearchableHelpSection Component

```text
┌───────────────────────────────────────────────────────┐
│ Frequently Asked Questions                            │
├───────────────────────────────────────────────────────┤
│ 🔍 [Search questions...]                             │
├───────────────────────────────────────────────────────┤
│ [All] [General] [Quests] [Matching] [Safety] [Costs] │
├───────────────────────────────────────────────────────┤
│ ▸ What exactly is a quest?                           │
│ ▸ How does matching work?                            │
│ ▸ What cities are you in?                            │
│ ▸ How is my data used?                               │
│ ▸ ...                                                │
└───────────────────────────────────────────────────────┘
```

Features:
- Fuzzy search across questions AND answers
- Category filtering via tabs
- Smooth accordion expand/collapse
- "Didn't find your answer?" → Opens support ticket

### 3.3 Glossary Component

```text
┌───────────────────────────────────────────────────────┐
│ Glossary                                              │
├───────────────────────────────────────────────────────┤
│ 🔍 [Search terms...]                                 │
├───────────────────────────────────────────────────────┤
│ B                                                     │
│   BUGGS - Behavioral Utility for Group Guidance...   │
│ C                                                     │
│   Clique - A temporary small group formed for...     │
│ M                                                     │
│   Meta-Quest - Multi-quest progression that...       │
│ Q                                                     │
│   Quest - A time-bound, real-world mission with...   │
│ X                                                     │
│   XP - Experience points earned by completing...     │
└───────────────────────────────────────────────────────┘
```

---

## Part 4: Homepage HowItWorksMini Enhancement

### Make Collapsible Option

The `HowItWorksMini` section on the homepage will remain as-is but:
1. Keep it visible by default (important for first-time visitors)
2. Add a subtle "Learn more →" link to `/how-it-works`

No collapsible needed on homepage - it's already a teaser section.

### FAQ Teaser on Homepage

Replace full FAQ with condensed teaser (3 questions max):

```text
┌───────────────────────────────────────────────────────┐
│ Quick Questions                                       │
├───────────────────────────────────────────────────────┤
│ ▸ What exactly is a quest?                           │
│ ▸ How does matching work?                            │
│ ▸ How much does it cost?                             │
├───────────────────────────────────────────────────────┤
│           [See All FAQs →]  (links to /how-it-works) │
└───────────────────────────────────────────────────────┘
```

---

## Part 5: Navigation Cleanup

### Current Navbar (Crowded)
```
Home | Quests | Pricing | How It Works | About | [Get Involved ▼] | [Find People] | [My Hub]
```

### Recommended Changes

1. **Keep "How It Works"** - this becomes the Help Center destination
2. **Rename to "Help" in nav** (optional) - or keep as "How It Works" with Help integrated
3. **Add "Help" to footer** - alternative entry point
4. **Remove FAQ from About page** - reduces redundancy

### Footer Enhancement

Add Help Center link:

```text
Links                    Connect
─────                    ───────
For Businesses           hello@...
Help Center ← NEW        Get Help
Privacy                  [Social icons]
Terms
```

---

## Part 6: Files to Create

| File | Purpose |
|------|---------|
| `src/components/help/SearchableHelpSection.tsx` | FAQ with search and category filters |
| `src/components/help/GlossarySection.tsx` | Searchable A-Z glossary |
| `src/components/help/FAQTeaser.tsx` | Condensed FAQ for homepage |
| `src/components/help/index.ts` | Barrel exports |

## Part 7: Files to Modify

| File | Changes |
|------|---------|
| `src/constants/content.ts` | Add `HELP_CENTER` with categorized FAQs and glossary |
| `src/pages/HowItWorks.tsx` | Add SearchableHelpSection and GlossarySection |
| `src/pages/Index.tsx` | Replace `<FAQ />` with `<FAQTeaser />` |
| `src/pages/About.tsx` | Remove `<FAQ />` component |
| `src/components/Footer.tsx` | Add "Help Center" link |

---

## Part 8: Glossary Terms (Initial Set)

| Term | Definition |
|------|------------|
| **Quest** | A time-bound, real-world adventure for a small group (3-6 people). Each quest has clear objectives and is designed to spark genuine connection. |
| **Clique** | Your squad - a small group of people you quest with. Cliques can be temporary (one quest) or recurring (your regular crew). |
| **BUGGS** | Behavioral Utility for Group Guidance & Structure - your AI guide that handles logistics, icebreakers, and gentle nudges. |
| **XP** | Experience points earned by completing quests, giving feedback, and engaging with the platform. XP tracks your OpenClique journey. |
| **Meta-Quest** | A monthly challenge that tracks progress across multiple quests and activities. Complete meta-quests to earn bonus rewards. |
| **Squad** | Another term for your clique - the people matched to complete a quest together. |
| **Creator** | Someone who designs and hosts quests. Creators build their reputation through ratings and can be discovered by brands. |
| **Sponsor** | A brand or venue that partners with OpenClique to host or sponsor quests. |
| **Friend Code** | A unique code you can share to add people directly to your contacts list. |
| **LFG** | "Looking for Group" - a broadcast feature to invite your contacts to join open quest slots. |
| **Contacts** | Your personal roster of OpenClique users you've connected with - like a friend list for future adventures. |

---

## Implementation Phases

### Phase 1: Content Consolidation
1. Create `HELP_CENTER` data structure in `content.ts`
2. Migrate existing FAQs into categorized format
3. Write initial glossary terms

### Phase 2: Help Components
4. Build `SearchableHelpSection.tsx` with fuzzy search
5. Build `GlossarySection.tsx` with alphabetical grouping
6. Build `FAQTeaser.tsx` for homepage

### Phase 3: Page Updates
7. Update `HowItWorks.tsx` to include FAQ and Glossary sections
8. Update `Index.tsx` to use `FAQTeaser` instead of full `FAQ`
9. Remove `FAQ` from `About.tsx`
10. Add Help Center link to `Footer.tsx`

---

## Technical Notes

### Search Implementation

Use simple string matching for MVP:

```typescript
const filterFAQs = (query: string, category: string) => {
  return faqs.filter(faq => {
    const matchesCategory = category === 'all' || faq.category === category;
    const matchesSearch = !query || 
      faq.question.toLowerCase().includes(query.toLowerCase()) ||
      faq.answer.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesSearch;
  });
};
```

### Alphabetical Glossary Grouping

```typescript
const groupedTerms = glossary.reduce((acc, item) => {
  const letter = item.term[0].toUpperCase();
  if (!acc[letter]) acc[letter] = [];
  acc[letter].push(item);
  return acc;
}, {} as Record<string, typeof glossary>);
```

---

## Summary

This plan:
1. **Eliminates FAQ redundancy** by consolidating to How It Works page
2. **Creates a searchable Help Center** with categories and fuzzy search
3. **Adds a Glossary** with platform terminology
4. **Keeps navigation clean** - no new top-level nav items
5. **Improves discoverability** via search and categorization
