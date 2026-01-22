# OpenClique Codebase Guide

> **For Non-Developers**: This guide explains how the codebase is organized so you can find and edit content easily.

---

## 📁 Folder Structure Overview

```
src/
├── assets/              ← Images, logos, photos
├── components/          ← Reusable UI building blocks
├── constants/           ← ⭐ EDIT CONTENT HERE (text, links, data)
├── hooks/               ← Shared logic (don't touch unless developer)
├── lib/                 ← Utility functions (don't touch)
├── pages/               ← Full page layouts
└── test/                ← Testing files (don't touch)
```

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
| `Pilot.tsx` | `/pilot` | User signup |
| `Partners.tsx` | `/partners` | Partner signup |
| `WorkWithUs.tsx` | `/work-with-us` | Jobs/volunteer |
| `CreatorsHub.tsx` | `/creators` | Creator landing |
| `ContentCreatorsPage.tsx` | `/creators/content-creators` | Influencer info |
| `QuestCreatorsPage.tsx` | `/creators/quest-creators` | Quest designer info |
| `Privacy.tsx` | `/privacy` | Privacy policy |
| `Terms.tsx` | `/terms` | Terms of service |

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
