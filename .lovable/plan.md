
# Fix Invite Code URLs and Admin Access

## Problem Summary

1. **Invite links point to wrong domain**: When copying invite links from the admin panel (or anywhere), they use `window.location.origin` which returns the current domain (e.g., Lovable preview URL) instead of the production URL `https://openclique.lovable.app`

2. **Anthony's access**: Anthony (anthony.cami@openclique.net) already has the `admin` role in the database. When he visits the Creator Dashboard, the auto-provisioning logic will create his creator profile automatically.

---

## Root Cause

Multiple components generate invite links using `window.location.origin`:

| File | Line | Current Code |
|------|------|--------------|
| `InviteCodesManager.tsx` | 63 | `${window.location.origin}/auth?club=${code}` |
| `InviteCodesManager.tsx` | 346 | `const origin = window.location.origin` |
| `InviteCodesTab.tsx` | 185 | `${window.location.origin}/auth?club=${code}` |
| `SocialChairOnboarding.tsx` | 118 | `${window.location.origin}/auth?org_invite=...` |
| `CliqueSettingsModal.tsx` | 147 | `${window.location.origin}/join/...` |
| `CliqueDetail.tsx` | 232 | `${window.location.origin}/join/...` |
| `CliqueCreate.tsx` | 166, 181 | `${window.location.origin}/join/...` |
| `useFriendInvite.ts` | 84 | `${window.location.origin}/auth?invite=...` |

Only `LinksManager.tsx` correctly uses a hardcoded `PUBLISHED_URL`.

---

## Solution

### Phase 1: Create Centralized URL Config

Create a shared utility that provides the correct production URL:

```text
File: src/lib/config.ts

- Export PUBLISHED_URL constant: 'https://openclique.lovable.app'
- Export helper function: getPublishedUrl(path: string) => full URL
```

### Phase 2: Update All Invite Link Generators

Update 8 files to import and use the centralized config:

1. `src/components/admin/InviteCodesManager.tsx`
   - Replace `window.location.origin` with `PUBLISHED_URL`
   - Update `getInviteUrl()` function
   - Update `OrgCodesSection` copy function
   
2. `src/components/clubs/InviteCodesTab.tsx`
   - Update `getInviteUrl()` function

3. `src/components/clubs/SocialChairOnboarding.tsx`
   - Update `copyInviteLink()` function

4. `src/components/cliques/CliqueSettingsModal.tsx`
   - Update invite link generation

5. `src/pages/CliqueDetail.tsx`
   - Update `handleCopyInviteLink()`

6. `src/pages/CliqueCreate.tsx`
   - Update invite link display and copy

7. `src/hooks/useFriendInvite.ts`
   - Update `shareLink` generation

8. `src/components/admin/LinksManager.tsx`
   - Import from centralized config (remove local constant)

### Phase 3: Verify Anthony's Access

Anthony already has the `admin` role. The existing auto-provisioning logic in `CreatorDashboard.tsx` will:
- Detect he's an admin without a creator profile
- Auto-create his creator profile with status `active`
- Add `quest_creator` role

No database changes needed - he just needs to visit `/creator` once.

---

## Technical Details

### New File: src/lib/config.ts

```typescript
export const PUBLISHED_URL = 'https://openclique.lovable.app';

export function getPublishedUrl(path: string): string {
  return `${PUBLISHED_URL}${path.startsWith('/') ? path : '/' + path}`;
}
```

### Example Update: InviteCodesManager.tsx

```typescript
// Before
const getInviteUrl = (code: string, type: InviteCodeType) => {
  const origin = window.location.origin;
  switch (type) {
    case 'creator':
      return `${origin}/creators/onboard?token=${code}`;
    // ...
  }
};

// After
import { PUBLISHED_URL } from '@/lib/config';

const getInviteUrl = (code: string, type: InviteCodeType) => {
  switch (type) {
    case 'creator':
      return `${PUBLISHED_URL}/creators/onboard?token=${code}`;
    // ...
  }
};
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/config.ts` | Centralized app configuration |

## Files to Modify

| File | Changes |
|------|---------|
| `InviteCodesManager.tsx` | Use `PUBLISHED_URL` for all invite links |
| `InviteCodesTab.tsx` | Use `PUBLISHED_URL` |
| `SocialChairOnboarding.tsx` | Use `PUBLISHED_URL` |
| `CliqueSettingsModal.tsx` | Use `PUBLISHED_URL` |
| `CliqueDetail.tsx` | Use `PUBLISHED_URL` |
| `CliqueCreate.tsx` | Use `PUBLISHED_URL` |
| `useFriendInvite.ts` | Use `PUBLISHED_URL` |
| `LinksManager.tsx` | Import from config (DRY) |

---

## Verification Steps

After implementation:
1. Go to Admin > Codes & Keys
2. Create a new invite code
3. Click copy link - should be `https://openclique.lovable.app/...`
4. Test from preview environment to confirm it still uses production URL
5. Have Anthony visit `/creator` to auto-provision his creator profile
