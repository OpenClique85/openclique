/**
 * Hook for checking username availability with debounce
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UsernameCheck {
  available: boolean;
  reason: string | null;
}

export function useUsernameAvailability(username: string, debounceMs = 500) {
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<UsernameCheck | null>(null);
  
  useEffect(() => {
    // Reset if empty
    if (!username || username.length < 3) {
      setResult(null);
      return;
    }
    
    // Basic format validation before checking
    const formatRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!formatRegex.test(username)) {
      setResult({
        available: false,
        reason: 'Username must be 3-20 characters, letters, numbers, and underscores only'
      });
      return;
    }
    
    setIsChecking(true);
    
    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc('check_username_availability', {
          p_username: username,
          p_user_id: user?.id || null,
        });
        
        if (error) {
          console.error('Username check error:', error);
          setResult({ available: false, reason: 'Error checking availability' });
        } else if (data && typeof data === 'object' && 'available' in data) {
          setResult(data as unknown as UsernameCheck);
        } else {
          setResult({ available: false, reason: 'Invalid response' });
        }
      } catch (err) {
        console.error('Username check failed:', err);
        setResult({ available: false, reason: 'Error checking availability' });
      } finally {
        setIsChecking(false);
      }
    }, debounceMs);
    
    return () => clearTimeout(timer);
  }, [username, user?.id, debounceMs]);
  
  return { isChecking, result };
}
