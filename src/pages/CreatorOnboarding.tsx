import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useCreatorInvite } from '@/hooks/useCreatorInvite';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle, Sparkles, Instagram, Twitter, Link as LinkIcon } from 'lucide-react';

export default function CreatorOnboarding() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading, refreshProfile } = useAuth();
  
  // Validate invite token
  const { data: invite, isLoading: inviteLoading, error: inviteError } = useCreatorInvite(token);
  
  // Form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('Austin');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [website, setWebsite] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Check if user already has a creator profile
  useEffect(() => {
    async function checkExistingProfile() {
      if (!user) return;
      
      const { data } = await supabase
        .from('creator_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        // Already a creator, redirect to dashboard
        navigate('/creator');
      }
    }
    
    checkExistingProfile();
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !invite) return;
    
    if (!displayName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Display name required',
        description: 'Please enter a display name for your creator profile.',
      });
      return;
    }
    
    if (!agreedToTerms) {
      toast({
        variant: 'destructive',
        title: 'Agreement required',
        description: 'You must agree to the Creator Terms and Content Policy.',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 1. Create creator profile
      const socials: Record<string, string> = {};
      if (instagram.trim()) socials.instagram = instagram.trim();
      if (twitter.trim()) socials.twitter = twitter.trim();
      if (website.trim()) socials.website = website.trim();
      
      const { error: profileError } = await supabase
        .from('creator_profiles')
        .insert({
          user_id: user.id,
          display_name: displayName.trim(),
          bio: bio.trim() || null,
          city: city.trim() || 'Austin',
          socials: Object.keys(socials).length > 0 ? socials : {},
          status: 'active',
          invited_at: invite.expires_at ? new Date(new Date(invite.expires_at).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString() : null,
          onboarded_at: new Date().toISOString(),
        });
      
      if (profileError) throw profileError;
      
      // 2. Add quest_creator role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'quest_creator',
        });
      
      // Ignore duplicate role error (23505)
      if (roleError && !roleError.message.includes('duplicate')) {
        throw roleError;
      }
      
      // 3. Mark invite as redeemed (via edge function or admin-only update)
      // Since RLS prevents non-admin updates, we'll use an edge function
      await supabase.functions.invoke('redeem-creator-invite', {
        body: { token: invite.token, user_id: user.id },
      });
      
      // Refresh auth context
      await refreshProfile();
      
      setIsComplete(true);
      
      toast({
        title: 'Welcome to the Creator Portal! 🎉',
        description: 'Your creator profile has been created.',
      });
      
      // Redirect after a short delay
      setTimeout(() => navigate('/creator'), 2000);
      
    } catch (error: any) {
      console.error('Error creating creator profile:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to create profile',
        description: error.message || 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading states
  if (authLoading || inviteLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  // No token provided
  if (!token) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12">
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <CardTitle>Invalid Link</CardTitle>
              <CardDescription>
                This onboarding link is missing a valid invite token.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                If you received an invite email, please use the complete link from that email.
              </p>
              <Button asChild>
                <Link to="/creators">Learn About Creating Quests</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Invalid or expired token
  if (!invite) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12">
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <CardTitle>Invite Expired or Invalid</CardTitle>
              <CardDescription>
                This invite link is no longer valid.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Invite links expire after 7 days. If you need a new invite, please contact the OpenClique team.
              </p>
              <Button asChild>
                <Link to="/creators">Apply to Become a Creator</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // User not logged in - prompt to sign in
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12">
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <Sparkles className="h-12 w-12 text-creator mx-auto mb-4" />
              <CardTitle>You're Invited! 🎉</CardTitle>
              <CardDescription>
                You've been invited to become a Quest Creator on OpenClique.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Sign in or create an account to complete your creator profile.
              </p>
              <Button asChild size="lg">
                <Link to={`/auth?redirect=${encodeURIComponent(`/creators/onboard?token=${token}`)}`}>
                  Sign In to Continue
                </Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Success state
  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12">
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
              <CardTitle className="text-2xl">Welcome, Creator! 🚀</CardTitle>
              <CardDescription>
                Your creator profile is ready. Redirecting to your dashboard...
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Main onboarding form
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Sparkles className="h-12 w-12 text-creator mx-auto mb-4" />
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Complete Your Creator Profile
            </h1>
            <p className="text-muted-foreground">
              Set up your profile to start designing quests for the Austin community.
            </p>
          </div>
          
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Your Creator Profile</CardTitle>
              <CardDescription>
                This information will be shown on quests you create.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Display Name */}
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name *</Label>
                  <Input
                    id="displayName"
                    placeholder="Your public creator name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    This is how you'll appear on quests you create.
                  </p>
                </div>
                
                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell participants a bit about yourself and what makes your quests special..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                  />
                </div>
                
                {/* City */}
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Austin"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                
                {/* Social Links */}
                <div className="space-y-4">
                  <Label>Social Links (optional)</Label>
                  
                  <div className="flex items-center gap-3">
                    <Instagram className="h-5 w-5 text-muted-foreground shrink-0" />
                    <Input
                      placeholder="@username"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Twitter className="h-5 w-5 text-muted-foreground shrink-0" />
                    <Input
                      placeholder="@username"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <LinkIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                    <Input
                      placeholder="https://yourwebsite.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Terms Agreement */}
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                  />
                  <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                    I agree to the{' '}
                    <Link to="/terms" className="text-primary hover:underline" target="_blank">
                      Creator Terms
                    </Link>{' '}
                    and{' '}
                    <Link to="/terms" className="text-primary hover:underline" target="_blank">
                      Content Policy
                    </Link>
                    . I understand that quests I create will be reviewed by the OpenClique team before publishing.
                  </Label>
                </div>
                
                {/* Submit */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting || !agreedToTerms || !displayName.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Profile...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Complete Setup & Enter Portal
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
