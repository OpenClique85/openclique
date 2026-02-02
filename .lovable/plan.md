
# Add Apple Sign-In OAuth Provider

## Overview

Adding Apple as a second OAuth option alongside the existing Google sign-in. Lovable Cloud already supports Apple OAuth through the managed authentication system.

## Changes Required

### 1. Update Auth Hook (`src/hooks/useAuth.tsx`)

Add a new `signInWithApple` function that uses the same Lovable Cloud integration:

| Change | Details |
|--------|---------|
| Add interface property | `signInWithApple: () => Promise<{ error: Error \| null }>` |
| Add function | Create `signInWithApple` using `lovable.auth.signInWithOAuth("apple", ...)` |
| Export in context | Include in `AuthContext.Provider` value |

### 2. Update Auth Page (`src/pages/Auth.tsx`)

Add the Apple sign-in button below the Google button:

| Change | Details |
|--------|---------|
| Destructure | Add `signInWithApple` from `useAuth()` |
| Add handler | Create `handleAppleSignIn` function with error handling |
| Add button | Apple-styled button with Apple logo SVG |

## UI Design

The social login section will show both options:

```
─────── Or continue with ───────

[ 🔵 Continue with Google  ]
[ ⬛ Continue with Apple   ]
```

The Apple button will follow Apple's brand guidelines:
- Black background with white text
- Official Apple logo SVG

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useAuth.tsx` | Add `signInWithApple` function and export it in context |
| `src/pages/Auth.tsx` | Import `signInWithApple`, add handler and Apple button |

## Technical Details

### Auth Hook Addition

```typescript
// In AuthContextType interface
signInWithApple: () => Promise<{ error: Error | null }>;

// New function
const signInWithApple = async () => {
  const { error } = await lovable.auth.signInWithOAuth("apple", {
    redirect_uri: window.location.origin,
  });
  return { error: error as Error | null };
};
```

### Apple Button Component

The button will use:
- `variant="outline"` with custom black background styling
- Official Apple logo SVG (monochrome white)
- Consistent spacing with the Google button

## Why This Works

The `src/integrations/lovable/index.ts` file already accepts `"google" | "apple"` as valid provider options (line 9). Lovable Cloud manages Apple OAuth credentials automatically, just like Google.
