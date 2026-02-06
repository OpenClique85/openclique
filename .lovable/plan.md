

# Enhanced Install Page: QR Code + Smart Device Detection

## Overview

Redesign the `/install` page to work in **two contexts**:
1. **Desktop/Print** — Show a QR code that visitors can scan with their phone
2. **Mobile** — Show smart, platform-specific install instructions (iOS vs Android)

This makes the page useful for both social sharing (texts, emails) and physical materials (event posters, cards).

---

## What Users Will See

### On Desktop (or when sharing the link in print materials)

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                    Install OpenClique                        │
│                                                              │
│              ┌─────────────────────────┐                    │
│              │                         │                    │
│              │      [QR CODE]          │                    │
│              │                         │                    │
│              │   openclique.lovable.app│                    │
│              │                         │                    │
│              └─────────────────────────┘                    │
│                                                              │
│         Scan with your phone's camera to install            │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Zap  Instant Access — Launch from your home screen     │ │
│  │ Bell Stay Updated — Get notified about your squads     │ │
│  │ Wifi Works Offline — Browse quests without internet    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│                    ← Back to app                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### On iPhone/iPad

```
┌─────────────────────────────────────────────────────────────┐
│                    Install OpenClique                        │
│        Add to your home screen for the best experience       │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ Zap  Instant Access                                  │   │
│   │ Bell Stay Updated                                    │   │
│   │ Wifi Works Offline                                   │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  Install on iPhone/iPad                              │   │
│   │                                                      │   │
│   │  1. Tap the Share button (bottom of Safari)          │   │
│   │  2. Tap "Add to Home Screen"                         │   │
│   │  3. Tap "Add" to confirm                             │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
│                    ← Back to app                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### On Android (with Chrome install support)

```
┌─────────────────────────────────────────────────────────────┐
│                    Install OpenClique                        │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ Zap  Instant Access                                  │   │
│   │ Bell Stay Updated                                    │   │
│   │ Wifi Works Offline                                   │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  Install on Android                                  │   │
│   │                                                      │   │
│   │  Click below to add OpenClique to your home screen.  │   │
│   │                                                      │   │
│   │  ┌─────────────────────────────────────────────┐    │   │
│   │  │         Install OpenClique                  │    │   │
│   │  └─────────────────────────────────────────────┘    │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
│                    ← Back to app                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Changes

### 1. Add QR Code Generation

Install the `qrcode.react` library to generate QR codes client-side. The QR code will point to:
- `https://openclique.lovable.app/install`

This ensures anyone scanning gets taken straight to the install page on their phone.

### 2. Smart Device Detection

Use the existing `useIsMobile` hook and `usePWAInstall` hook to determine:

| Condition | What to show |
|-----------|--------------|
| Desktop browser | QR code prominently + benefits |
| iOS mobile | iOS-specific instructions (Share > Add to Home Screen) |
| Android + Chrome (installable) | Big "Install" button that triggers native prompt |
| Android + other browser | Manual instructions for Chrome menu |

### 3. Fix Scrolling Bug

The current page doesn't scroll properly on smaller devices. We'll:
- Add `overflow-y-auto` to the content container
- Use `pb-safe` for safe area padding at bottom
- Ensure the "Back to app" button is always reachable

---

## Technical Implementation

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Install.tsx` | Complete redesign with QR code section + device-aware layouts |
| `package.json` | Add `qrcode.react` dependency |

### New Dependencies

```json
"qrcode.react": "^4.2.0"
```

This is a lightweight (~10KB) React component for generating QR codes with no server-side requirements.

### Updated Install Page Structure

```text
Install.tsx
├── Already Installed State (unchanged)
├── Desktop View
│   ├── QR Code (large, scannable)
│   ├── URL text below QR
│   ├── "Scan to install" instruction
│   └── Benefits list (compact)
└── Mobile View
    ├── Header with benefits
    └── Platform-specific instructions
        ├── iOS: Manual 3-step instructions
        └── Android: Install button OR manual steps
```

### Device Detection Logic

```typescript
const isMobile = useIsMobile();
const { isIOS, isInstallable } = usePWAInstall();

// Desktop: show QR
// Mobile + iOS: show Safari instructions  
// Mobile + Android + installable: show Install button
// Mobile + Android + not installable: show Chrome menu instructions
```

---

## Why This Works for OpenClique

- **Event-ready** — Print the page or screenshot the QR for flyers, posters, table cards
- **Text/email friendly** — Share the `/install` link and it just works on mobile
- **Zero friction** — No app store, no waiting for approval, instant install
- **Platform-smart** — Users see exactly what they need, nothing confusing

---

## Summary of Changes

| Category | Details |
|----------|---------|
| **New dependency** | `qrcode.react` for client-side QR generation |
| **Modified file** | `src/pages/Install.tsx` — redesigned with QR + smart detection |
| **Bug fix** | Scrolling issue on mobile — add proper overflow handling |
| **QR target URL** | `https://openclique.lovable.app/install` |

