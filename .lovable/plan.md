
# PWA Implementation Plan for OpenClique

## Overview

Transform OpenClique into an installable Progressive Web App that users can add to their home screen. The app will work offline, load fast, and feel native while maintaining full connection to the backend.

---

## What Users Will Get

- **Install from browser** — Tap "Add to Home Screen" (iOS) or see install prompt (Android/Chrome)
- **App icon on phone** — OpenClique icon sits alongside other apps
- **Full-screen experience** — No browser chrome, feels like a native app
- **Offline support** — Core pages cached, graceful offline messaging
- **Fast loading** — Service worker caches assets for instant startup

---

## Technical Implementation

### 1. Install vite-plugin-pwa

Add the PWA plugin that handles service worker generation, manifest creation, and caching strategies.

```
vite-plugin-pwa
```

### 2. Configure vite.config.ts

Add PWA plugin with:
- **App manifest** — Name, icons, colors, display mode
- **Service worker** — Auto-generated with Workbox
- **Caching strategy** — Cache-first for assets, network-first for API calls
- **Offline fallback** — Show cached content when offline

### 3. Create PWA Icons

Generate required icon sizes in `/public`:
- `pwa-192x192.png` — Standard icon
- `pwa-512x512.png` — Splash screen / high-res
- `apple-touch-icon-180x180.png` — iOS home screen

### 4. Update index.html

Add mobile-optimized meta tags:
- `apple-mobile-web-app-capable` — Enable standalone mode on iOS
- `apple-mobile-web-app-status-bar-style` — Status bar theming
- `theme-color` — Browser UI color matching brand
- Apple touch icon link

### 5. Create Install Page (`/install`)

Dedicated page with:
- Platform detection (iOS vs Android)
- Step-by-step install instructions with visuals
- "Add to Home Screen" prompt trigger (Android/Chrome)
- Benefits of installing (notifications, quick access)

### 6. Add Install Prompt Component

Show a dismissible banner/prompt:
- Detect if app is installable but not installed
- Show on key moments (after signup, quest join)
- Remember dismissal in localStorage

### 7. Offline UI Component

Create an offline indicator:
- Detect network status
- Show toast/banner when offline
- Queue actions for when back online (future enhancement)

---

## File Changes

### New Files (4)
| File | Purpose |
|------|---------|
| `public/pwa-192x192.png` | App icon (192x192) |
| `public/pwa-512x512.png` | High-res icon (512x512) |
| `public/apple-touch-icon-180x180.png` | iOS icon |
| `src/pages/Install.tsx` | Install instructions page |
| `src/components/pwa/InstallPrompt.tsx` | Install banner component |
| `src/components/pwa/OfflineIndicator.tsx` | Offline status display |
| `src/hooks/usePWAInstall.ts` | Install prompt logic |

### Modified Files (4)
| File | Changes |
|------|---------|
| `vite.config.ts` | Add VitePWA plugin configuration |
| `index.html` | Add PWA meta tags and apple-touch-icon |
| `src/App.tsx` | Add Install route and OfflineIndicator |
| `package.json` | Add vite-plugin-pwa dependency |

---

## PWA Manifest Configuration

```json
{
  "name": "OpenClique",
  "short_name": "OpenClique",
  "description": "You've got a squad waiting. Find your people, join adventures.",
  "theme_color": "#7c3aed",
  "background_color": "#0f0f0f",
  "display": "standalone",
  "scope": "/",
  "start_url": "/",
  "icons": [
    { "src": "pwa-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "pwa-512x512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "pwa-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

---

## Service Worker Strategy

| Resource Type | Strategy | Reason |
|---------------|----------|--------|
| Static assets (JS, CSS, images) | Cache-first | Fast loads, versioned by build |
| HTML pages | Network-first | Always fresh content |
| API calls (Supabase) | Network-only | Real-time data required |
| Fonts | Cache-first | Rarely change |

---

## Install Flow UX

**Android/Chrome:**
1. User visits site → Browser shows install banner
2. Or: User taps menu → "Install App"
3. App added to home screen

**iOS Safari:**
1. User visits `/install` page
2. See step-by-step: "Tap Share → Add to Home Screen"
3. Visual guide with screenshots

---

## Testing Checklist

- [ ] PWA installs on Android Chrome
- [ ] PWA installs on iOS Safari (manual steps)
- [ ] App launches in standalone mode (no browser chrome)
- [ ] Offline indicator shows when disconnected
- [ ] Cached pages load when offline
- [ ] Install prompt appears at appropriate moments
- [ ] Icons display correctly on home screen

---

## Future Enhancements (Not in This PR)

- **Push notifications** — Requires service worker + backend setup
- **Background sync** — Queue offline actions
- **App shortcuts** — Quick actions from long-press on icon
