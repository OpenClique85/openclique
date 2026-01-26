/**
 * VerifyEmail - Email verification callback page
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';

type VerifyStatus = 'loading' | 'success' | 'error';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState<VerifyStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);

  useEffect(() => {
    const handleVerification = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setError('No verification token provided');
        setStatus('error');
        return;
      }

      try {
        // Find the verification record
        const { data: verification, error: fetchError } = await supabase
          .from('org_verified_emails')
          .select('id, user_id, org_id, email, verification_token, token_expires_at, is_verified')
          .eq('verification_token', token)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (!verification) {
          setError('Invalid or expired verification link');
          setStatus('error');
          return;
        }

        // Check expiry
        if (verification.token_expires_at && new Date(verification.token_expires_at) < new Date()) {
          setError('This verification link has expired');
          setStatus('error');
          return;
        }

        // Get org name
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', verification.org_id)
          .single();

        // Mark as verified
        const { error: updateError } = await supabase
          .from('org_verified_emails')
          .update({
            is_verified: true,
            verified_at: new Date().toISOString(),
            verification_token: null,
          })
          .eq('id', verification.id);

        if (updateError) throw updateError;

        // Add user to organization
        const { error: memberError } = await supabase
          .from('profile_organizations')
          .upsert({
            profile_id: verification.user_id,
            org_id: verification.org_id,
            role: 'member',
          }, {
            onConflict: 'profile_id,org_id',
          });

        if (memberError) {
          console.error('Failed to add member:', memberError);
          // Don't fail - email is verified, membership can be fixed
        }

        setOrgName(org?.name || 'the organization');
        setStatus('success');
      } catch (err: any) {
        console.error('Verification error:', err);
        setError(err.message || 'Verification failed');
        setStatus('error');
      }
    };

    handleVerification();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <h2 className="text-lg font-semibold mb-2">Verifying your email...</h2>
              <p className="text-muted-foreground">Please wait.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="relative inline-block mb-4">
                <GraduationCap className="h-12 w-12 text-primary" />
                <CheckCircle className="h-5 w-5 absolute -bottom-1 -right-1 text-green-500 bg-background rounded-full" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Email Verified!</h2>
              <p className="text-muted-foreground mb-4">
                You've been added to <strong>{orgName}</strong>.
              </p>
              <Button onClick={() => navigate('/quests')}>Browse Quests</Button>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h2 className="text-lg font-semibold mb-2">Verification Failed</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => navigate('/')}>Go Home</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
