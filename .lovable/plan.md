
# Eventbrite OAuth Token Security Fix

## Problem

The `eventbrite_connections` table stores sensitive OAuth tokens (`access_token`, `refresh_token`) in plaintext. While RLS restricts access to only the owning user, these tokens are still exposed in SELECT queries and could leak through:
- SQL injection vulnerabilities
- Database backup exposure
- Admin access abuse

## Solution Overview

Create a secure view that excludes token columns and restrict direct table SELECT access to service-role only (edge functions).

## Implementation

### 1. Database Migration

Create a security-hardened view and update RLS policies:

```sql
-- Create a safe view that excludes sensitive token columns
CREATE VIEW public.eventbrite_connections_safe 
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  org_id,
  eventbrite_user_id,
  eventbrite_email,
  connected_at,
  last_sync_at,
  is_active,
  token_expires_at
FROM public.eventbrite_connections;

-- Enable RLS on the view (inherits from base table via security_invoker)
ALTER VIEW public.eventbrite_connections_safe SET (security_invoker = true);

-- Drop the existing user SELECT policy on base table
DROP POLICY IF EXISTS "Users can view their own Eventbrite connections" 
  ON public.eventbrite_connections;

-- Create SELECT policy on the SAFE VIEW for users
CREATE POLICY "Users can view their own Eventbrite connections"
ON public.eventbrite_connections_safe
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

**Note**: The edge functions use `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS, so they retain full access to tokens for OAuth operations.

### 2. Update Client Hook

Modify `src/hooks/useEventbrite.ts` to query the safe view:

| Change | Description |
|--------|-------------|
| Line 47 | Change `from('eventbrite_connections')` to `from('eventbrite_connections_safe')` |
| Lines 105-108 | Keep using base table for UPDATE (disconnect) - RLS still allows this |

The UPDATE operation still works on the base table because the existing "Users can update their own Eventbrite connections" policy remains in place.

### 3. Security Marking

Delete the security finding after implementation:
- `eventbrite_oauth_tokens` (Internal ID)

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/XXXXX.sql` | Create | View creation and RLS policy updates |
| `src/hooks/useEventbrite.ts` | Edit | Query safe view instead of base table |

## Technical Details

### Why a View Instead of Column-Level Security?

PostgreSQL doesn't support column-level RLS. Options considered:

1. **Secure View (chosen)**: Simple, no schema changes, client code change is minimal
2. **Encrypt tokens**: Adds complexity, still need decryption for edge functions
3. **Move tokens to separate table**: More invasive schema change

### Edge Function Access

Edge functions (`eventbrite-oauth-callback`, `import-eventbrite-event`) use the service role key which bypasses RLS entirely. They continue to have full access to:
- Write tokens during OAuth callback
- Read tokens for API calls (currently using `EVENTBRITE_PRIVATE_TOKEN` env var instead)

### Client Access Pattern

| Operation | Table/View | Allowed |
|-----------|-----------|---------|
| SELECT connection status | `eventbrite_connections_safe` | Yes (no tokens) |
| UPDATE to disconnect | `eventbrite_connections` | Yes (RLS allows) |
| INSERT | `eventbrite_connections` | Yes (RLS allows) |
| DELETE | `eventbrite_connections` | Yes (RLS allows) |
| SELECT tokens | `eventbrite_connections` | No (policy removed) |

## Verification

After implementation:
1. Client queries return connection status without exposing tokens
2. Disconnect functionality continues to work
3. Edge functions can still store/read tokens
4. Security scan should show finding resolved
