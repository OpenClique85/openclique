import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSponsorInvite } from '@/hooks/useSponsorInvite';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, AlertCircle, Building2, MapPin, Store } from 'lucide-react';

const QUEST_TYPES = [
  { value: 'culture', label: 'Culture & Arts' },
  { value: 'wellness', label: 'Wellness & Fitness' },
  { value: 'connector', label: 'Social & Connector' },
  { value: 'food', label: 'Food & Dining' },
  { value: 'outdoor', label: 'Outdoor & Adventure' },
  { value: 'music', label: 'Music & Entertainment' },
];

export default function SponsorOnboarding() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const { user, refreshProfile } = useAuth();
  const { data: invite, isLoading: inviteLoading } = useSponsorInvite(token);

  const [name, setName] = useState('');
  const [sponsorType, setSponsorType] = useState<'brand' | 'venue' | 'both'>('brand');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [city, setCity] = useState('Austin');
  const [preferredQuestTypes, setPreferredQuestTypes] = useState<string[]>([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Redirect if already a sponsor
  useEffect(() => {
    if (user) {
      supabase
        .from('sponsor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            navigate('/sponsor');
          }
        });
    }
  }, [user, navigate]);

  // Pre-fill email from invite
  useEffect(() => {
    if (invite?.email) {
      setContactEmail(invite.email);
    }
  }, [invite]);

  const toggleQuestType = (value: string) => {
    setPreferredQuestTypes(prev => 
      prev.includes(value) 
        ? prev.filter(t => t !== value)
        : [...prev, value]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !token) return;
    if (!name.trim()) {
      toast.error('Business name is required');
      return;
    }
    if (!agreedToTerms) {
      toast.error('Please agree to the terms');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create sponsor profile
      const { error: profileError } = await supabase
        .from('sponsor_profiles')
        .insert({
          user_id: user.id,
          name: name.trim(),
          sponsor_type: sponsorType,
          description: description.trim() || null,
          website: website.trim() || null,
          contact_name: contactName.trim() || null,
          contact_email: contactEmail.trim() || null,
          city,
          preferred_quest_types: preferredQuestTypes,
          status: 'approved', // Auto-approve since they have a valid invite
        });

      if (profileError) throw profileError;

      // Assign sponsor role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'sponsor',
        });

      if (roleError && !roleError.message.includes('duplicate')) {
        throw roleError;
      }

      // Redeem the invite
      const { error: redeemError } = await supabase.functions.invoke('redeem-sponsor-invite', {
        body: { token, user_id: user.id },
      });

      if (redeemError) {
        console.error('Redeem error:', redeemError);
      }

      await refreshProfile();
      setIsComplete(true);
      toast.success('Welcome to the Sponsor Portal!');

      setTimeout(() => {
        navigate('/sponsor');
      }, 2000);

    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Failed to complete onboarding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (inviteLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  // Invalid or expired invite
  if (!token || !invite || invite.redeemed_at || new Date(invite.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <CardTitle>Invalid or Expired Invite</CardTitle>
              <CardDescription>
                This sponsor invite link is no longer valid. Please contact OpenClique 
                if you believe this is an error.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/">Return Home</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Complete Your Sponsor Profile</CardTitle>
              <CardDescription>
                Sign in or create an account to complete your sponsor onboarding.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to={`/auth?redirect=/sponsors/onboard?token=${token}`}>
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
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>Welcome, Sponsor!</CardTitle>
              <CardDescription>
                Your sponsor profile has been created. Redirecting to your dashboard...
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      <main className="flex-1 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Complete Your Sponsor Profile</h1>
            <p className="text-muted-foreground">
              Set up your brand or venue profile to start sponsoring quests
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Sponsor Type Selection */}
                <div className="space-y-3">
                  <Label>What type of sponsor are you?</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setSponsorType('brand')}
                      className={`p-4 rounded-lg border-2 text-center transition-colors ${
                        sponsorType === 'brand' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Store className="h-6 w-6 mx-auto mb-2" />
                      <span className="text-sm font-medium">Brand</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSponsorType('venue')}
                      className={`p-4 rounded-lg border-2 text-center transition-colors ${
                        sponsorType === 'venue' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <MapPin className="h-6 w-6 mx-auto mb-2" />
                      <span className="text-sm font-medium">Venue</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSponsorType('both')}
                      className={`p-4 rounded-lg border-2 text-center transition-colors ${
                        sponsorType === 'both' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Building2 className="h-6 w-6 mx-auto mb-2" />
                      <span className="text-sm font-medium">Both</span>
                    </button>
                  </div>
                </div>

                {/* Business Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Business Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your brand or venue name"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">About Your Business</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell quest creators and participants what you offer..."
                    rows={3}
                  />
                </div>

                {/* Website */}
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yourcompany.com"
                  />
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Contact Name</Label>
                    <Input
                      id="contactName"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="you@company.com"
                    />
                  </div>
                </div>

                {/* City */}
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Austin">Austin, TX</SelectItem>
                      <SelectItem value="Houston">Houston, TX</SelectItem>
                      <SelectItem value="Dallas">Dallas, TX</SelectItem>
                      <SelectItem value="San Antonio">San Antonio, TX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Preferred Quest Types */}
                <div className="space-y-3">
                  <Label>Preferred Quest Types</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {QUEST_TYPES.map((type) => (
                      <label
                        key={type.value}
                        className="flex items-center gap-2 p-3 rounded-md border cursor-pointer hover:bg-muted"
                      >
                        <Checkbox
                          checked={preferredQuestTypes.includes(type.value)}
                          onCheckedChange={() => toggleQuestType(type.value)}
                        />
                        <span className="text-sm">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Terms */}
                <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                  />
                  <label htmlFor="terms" className="text-sm">
                    I agree to the{' '}
                    <Link to="/terms" className="text-primary underline">Terms of Service</Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>.
                    I understand that all sponsorships are subject to review.
                  </label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={isSubmitting || !agreedToTerms}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Profile...
                    </>
                  ) : (
                    'Complete Setup'
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
