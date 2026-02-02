import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, ArrowLeft, Ticket, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import logo from '@/assets/logo.png';
import { OnboardingFeedbackModal } from '@/components/OnboardingFeedbackModal';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [redemptionId, setRedemptionId] = useState<string | undefined>();
  const [inviteCodeLabel, setInviteCodeLabel] = useState<string | null>(null);
  
  const { user, signIn, signUp, signInWithGoogle, signInWithApple } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Get invite code from URL
  const urlInviteCode = searchParams.get('invite');
  
  useEffect(() => {
    if (urlInviteCode) {
      setInviteCode(urlInviteCode);
    }
  }, [urlInviteCode]);
  
  // Support both location.state.from and ?redirect= query param
  const redirectParam = searchParams.get('redirect');
  const from = redirectParam 
    || (location.state as { from?: { pathname: string } })?.from?.pathname 
    || '/my-quests';

  // After sign up with invite code, show feedback modal
  useEffect(() => {
    if (user && redemptionId) {
      setShowFeedbackModal(true);
    } else if (user && !redemptionId) {
      navigate(from, { replace: true });
    }
  }, [user, redemptionId, navigate, from]);

  const validateForm = (checkPassword = true) => {
    const newErrors: { email?: string; password?: string } = {};
    
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }
    
    if (checkPassword) {
      try {
        passwordSchema.parse(password);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.password = e.errors[0].message;
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const redeemInviteCode = async () => {
    if (!inviteCode.trim()) return null;
    
    // Check if it's a friend invite code (FRIEND-XXXXXXXX format)
    const isFriendCode = inviteCode.trim().toUpperCase().startsWith('FRIEND-');
    
    if (isFriendCode) {
      // Handled separately after signup in handleSignUp
      return null;
    }
    
    const { data, error } = await supabase.rpc('redeem_invite_code', {
      p_code: inviteCode.trim(),
      p_user_agent: navigator.userAgent,
      p_referral_source: document.referrer || null,
    });
    
    if (error) {
      console.error('Invite code error:', error);
      return null;
    }
    
    return data as { success: boolean; redemption_id?: string; code_type?: string; code_label?: string; error?: string };
  };

  const redeemFriendInvite = async (userId: string) => {
    if (!inviteCode.trim()) return null;
    
    const isFriendCode = inviteCode.trim().toUpperCase().startsWith('FRIEND-');
    if (!isFriendCode) return null;
    
    const { data, error } = await supabase.rpc('redeem_friend_invite', {
      p_code: inviteCode.trim(),
      p_new_user_id: userId,
    });
    
    if (error) {
      console.error('Friend invite error:', error);
      return null;
    }
    
    return data as { 
      success: boolean; 
      error?: string; 
      quest_id?: string;
      referrer_id?: string;
      recruit_count?: number;
    };
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    const { error } = await signIn(email, password);
    
    if (!error && inviteCode) {
      // Try to redeem invite code after sign in
      await redeemInviteCode();
    }
    
    setIsSubmitting(false);
    
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Sign in failed',
        description: error.message === 'Invalid login credentials'
          ? 'Incorrect email or password. Please try again.'
          : error.message
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    const { error } = await signUp(email, password);
    
    setIsSubmitting(false);
    
    if (error) {
      let message = error.message;
      if (error.message.includes('already registered')) {
        message = 'This email is already registered. Try signing in instead.';
      }
      toast({
        variant: 'destructive',
        title: 'Sign up failed',
        description: message
      });
      return;
    }
    
    // Handle invite code redemption after successful signup
    // The user state will be updated via auth listener, but we can check session
    if (inviteCode) {
      const isFriendCode = inviteCode.trim().toUpperCase().startsWith('FRIEND-');
      
      if (isFriendCode) {
        // Get fresh session to get the new user ID
        const { data: { session: newSession } } = await supabase.auth.getSession();
        if (newSession?.user) {
          const friendResult = await redeemFriendInvite(newSession.user.id);
          if (friendResult?.success) {
            toast({
              title: 'Welcome to the quest!',
              description: "You've been signed up for the quest your friend invited you to.",
            });
          }
        }
      } else {
        // Redeem regular invite code
        const result = await redeemInviteCode();
        if (result?.success && result.redemption_id) {
          setRedemptionId(result.redemption_id);
          setInviteCodeLabel(result.code_label || null);
        }
      }
    } else {
      toast({
        title: 'Account created!',
        description: 'Welcome to OpenClique. You can now access your quests.'
      });
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Google sign in failed',
        description: error.message
      });
    }
  };

  const handleAppleSignIn = async () => {
    const { error } = await signInWithApple();
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Apple sign in failed',
        description: error.message
      });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;
    
    setIsResettingPassword(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });
    
    setIsResettingPassword(false);
    
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Password reset failed',
        description: error.message
      });
    } else {
      toast({
        title: 'Check your email',
        description: 'We sent you a password reset link. Please check your inbox.'
      });
      setShowForgotPassword(false);
    }
  };

  const handleFeedbackClose = () => {
    setShowFeedbackModal(false);
    navigate(from, { replace: true });
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        {/* Header */}
        <header className="p-4">
          <button 
            onClick={() => setShowForgotPassword(false)}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to sign in</span>
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center space-y-4">
              <Link to="/" className="inline-block mx-auto">
                <img src={logo} alt="OpenClique" className="h-10" />
              </Link>
              <div>
                <CardTitle className="text-2xl font-display">Reset Password</CardTitle>
                <CardDescription>
                  Enter your email and we'll send you a reset link
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                
                <Button type="submit" className="w-full" disabled={isResettingPassword}>
                  {isResettingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Feedback Modal */}
      <OnboardingFeedbackModal 
        open={showFeedbackModal} 
        onClose={handleFeedbackClose}
        redemptionId={redemptionId}
      />

      {/* Header */}
      <header className="p-4">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to home</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <Link to="/" className="inline-block mx-auto">
              <img src={logo} alt="OpenClique" className="h-10" />
            </Link>
            <div>
              <CardTitle className="text-2xl font-display">Welcome</CardTitle>
              <CardDescription>
                {inviteCode 
                  ? "You've been invited! Create an account to join."
                  : "Sign in to join quests and connect with your community"
                }
              </CardDescription>
              {inviteCode && (
                <Badge variant="secondary" className="mt-2">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Invite code: {inviteCode}
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Invite code input (if not from URL) */}
            {!urlInviteCode && (
              <div className="mb-6">
                <div className="space-y-2">
                  <Label htmlFor="invite-code">Have an invite code? (optional)</Label>
                  <div className="relative">
                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="invite-code"
                      type="text"
                      placeholder="COFOUNDER-2025"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      className="pl-10 uppercase"
                    />
                  </div>
                </div>
              </div>
            )}

            <Tabs defaultValue={inviteCode ? "signup" : "signin"} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password">Password</Label>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>
            
            <Button
              variant="outline"
              className="w-full bg-black text-white hover:bg-black/90 hover:text-white border-black"
              onClick={handleAppleSignIn}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Continue with Apple
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}