/**
 * EventbriteCallback - OAuth callback handler for Eventbrite integration
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type CallbackStatus = 'loading' | 'success' | 'error';

export default function EventbriteCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState<CallbackStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError(errorParam);
        setStatus('error');
        return;
      }

      if (!code) {
        setError('No authorization code received');
        setStatus('error');
        return;
      }

      if (!user) {
        setError('You must be logged in to connect Eventbrite');
        setStatus('error');
        return;
      }

      try {
        const { error: fnError } = await supabase.functions.invoke('eventbrite-oauth-callback', {
          body: { code, user_id: user.id },
        });

        if (fnError) throw new Error(fnError.message);

        setStatus('success');
        setTimeout(() => navigate('/admin'), 2000);
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        setError(err.message || 'Failed to connect Eventbrite');
        setStatus('error');
      }
    };

    handleCallback();
  }, [searchParams, user, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <h2 className="text-lg font-semibold mb-2">Connecting Eventbrite...</h2>
              <p className="text-muted-foreground">Please wait while we complete the connection.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h2 className="text-lg font-semibold mb-2">Eventbrite Connected!</h2>
              <p className="text-muted-foreground">Redirecting you back to the admin panel...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h2 className="text-lg font-semibold mb-2">Connection Failed</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => navigate('/admin')}>Back to Admin</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
