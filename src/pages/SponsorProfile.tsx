import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SponsorPortalNav } from '@/components/sponsors/SponsorPortalNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Loader2, 
  Building2, 
  Camera, 
  Globe, 
  ExternalLink, 
  Save, 
  Trash2,
  X
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const QUEST_TYPES = ['culture', 'wellness', 'connector', 'civic', 'adventure', 'social'];
const BRAND_TONES = ['fun', 'premium', 'community', 'casual', 'professional', 'adventurous'];
const BUDGET_RANGES = ['Under $500', '$500-$1,000', '$1,000-$5,000', '$5,000-$10,000', '$10,000+'];
const AGE_RANGES = ['21-25', '26-30', '31-40', '41-50', '51+'];
const INTERESTS = ['music', 'food', 'fitness', 'arts', 'civic', 'wellness', 'social', 'outdoors', 'tech', 'sustainability'];

const SEEKING_OPTIONS = [
  { id: 'creator_partnerships', label: 'Creator Partnerships', description: 'Looking to sponsor quest creators' },
  { id: 'org_partnerships', label: 'Organization Partnerships', description: 'Want to sponsor clubs, groups, or student orgs' },
  { id: 'event_hosting', label: 'Event Hosting', description: 'Have a venue available for quests' },
];

interface TargetAudience {
  age_ranges?: string[];
  interests?: string[];
}

export default function SponsorProfile() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [city, setCity] = useState('Austin');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [sponsorType, setSponsorType] = useState('brand');
  const [brandTone, setBrandTone] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [preferredQuestTypes, setPreferredQuestTypes] = useState<string[]>([]);
  const [targetAudience, setTargetAudience] = useState<TargetAudience>({});
  const [seeking, setSeeking] = useState<string[]>([]);
  
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [removeLogoDialogOpen, setRemoveLogoDialogOpen] = useState(false);

  // Fetch sponsor profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['sponsor-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsor_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setName(data.name || '');
        setDescription(data.description || '');
        setWebsite(data.website || '');
        setCity(data.city || 'Austin');
        setContactName(data.contact_name || '');
        setContactEmail(data.contact_email || '');
        setSponsorType(data.sponsor_type || 'brand');
        setBrandTone(data.brand_tone || '');
        setBudgetRange(data.budget_range || '');
        setPreferredQuestTypes(data.preferred_quest_types || []);
        setTargetAudience((data.target_audience as TargetAudience) || {});
        setSeeking(data.seeking || []);
        setHasChanges(false);
      }
      
      return data;
    },
    enabled: !!user,
  });

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { error } = await supabase
        .from('sponsor_profiles')
        .update(updates)
        .eq('user_id', user?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Profile updated!');
      queryClient.invalidateQueries({ queryKey: ['sponsor-profile'] });
      setHasChanges(false);
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    },
  });

  const handleSave = () => {
    updateProfile.mutate({
      name,
      description,
      website,
      city,
      contact_name: contactName,
      contact_email: contactEmail,
      sponsor_type: sponsorType,
      brand_tone: brandTone || null,
      budget_range: budgetRange || null,
      preferred_quest_types: preferredQuestTypes,
      target_audience: targetAudience,
      seeking,
    });
  };

  // Logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `sponsor-logos/${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('quest-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('quest-images')
        .getPublicUrl(fileName);

      await updateProfile.mutateAsync({ logo_url: publicUrl });
      toast.success('Logo uploaded!');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await updateProfile.mutateAsync({ logo_url: null });
      setRemoveLogoDialogOpen(false);
      toast.success('Logo removed');
    } catch (error) {
      console.error('Error removing logo:', error);
    }
  };

  const toggleQuestType = (type: string) => {
    setHasChanges(true);
    setPreferredQuestTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleAgeRange = (range: string) => {
    setHasChanges(true);
    setTargetAudience(prev => ({
      ...prev,
      age_ranges: prev.age_ranges?.includes(range)
        ? prev.age_ranges.filter(r => r !== range)
        : [...(prev.age_ranges || []), range]
    }));
  };

  const toggleInterest = (interest: string) => {
    setHasChanges(true);
    setTargetAudience(prev => ({
      ...prev,
      interests: prev.interests?.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...(prev.interests || []), interest]
    }));
  };

  const toggleSeeking = (id: string) => {
    setHasChanges(true);
    setSeeking(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  if (authLoading || profileLoading) {
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

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center">
            <CardHeader>
              <CardTitle>Become a Sponsor</CardTitle>
              <CardDescription>
                Partner with OpenClique to reach engaged local audiences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/partners">Learn More About Sponsorship</Link>
              </Button>
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
      <SponsorPortalNav />
      
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Sponsor Profile</h1>
              <p className="text-muted-foreground mt-1">
                Manage your business information and preferences
              </p>
            </div>
            
            {profile.slug && (
              <Button variant="outline" asChild>
                <Link to={`/sponsors/${profile.slug}`} target="_blank">
                  View Public Profile
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Logo Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Brand Logo</CardTitle>
                  <CardDescription>This appears on sponsored quests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar className="h-24 w-24 rounded-lg">
                        <AvatarImage src={profile.logo_url || undefined} className="object-cover" />
                        <AvatarFallback className="text-2xl bg-primary/10 text-primary rounded-lg">
                          {name.charAt(0).toUpperCase() || 'S'}
                        </AvatarFallback>
                      </Avatar>
                      {uploadingLogo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingLogo}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Upload Logo
                      </Button>
                      {profile.logo_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setRemoveLogoDialogOpen(true)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Business Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Business Name *</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => { setName(e.target.value); setHasChanges(true); }}
                        placeholder="Your business name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sponsorType">Sponsor Type</Label>
                      <Select value={sponsorType} onValueChange={(v) => { setSponsorType(v); setHasChanges(true); }}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="brand">Brand</SelectItem>
                          <SelectItem value="venue">Venue</SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => { setDescription(e.target.value); setHasChanges(true); }}
                      placeholder="Describe your business and what you offer..."
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {description.length}/500
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="website" className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Website
                      </Label>
                      <Input
                        id="website"
                        value={website}
                        onChange={(e) => { setWebsite(e.target.value); setHasChanges(true); }}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => { setCity(e.target.value); setHasChanges(true); }}
                        placeholder="Austin"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>Primary contact for sponsorship inquiries</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Contact Name</Label>
                      <Input
                        id="contactName"
                        value={contactName}
                        onChange={(e) => { setContactName(e.target.value); setHasChanges(true); }}
                        placeholder="John Smith"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Contact Email</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={contactEmail}
                        onChange={(e) => { setContactEmail(e.target.value); setHasChanges(true); }}
                        placeholder="john@company.com"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle>Sponsorship Preferences</CardTitle>
                  <CardDescription>Help us match you with the right quests</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Brand Tone</Label>
                      <Select value={brandTone} onValueChange={(v) => { setBrandTone(v); setHasChanges(true); }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tone" />
                        </SelectTrigger>
                        <SelectContent>
                          {BRAND_TONES.map(tone => (
                            <SelectItem key={tone} value={tone} className="capitalize">
                              {tone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Budget Range (per quest)</Label>
                      <Select value={budgetRange} onValueChange={(v) => { setBudgetRange(v); setHasChanges(true); }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                          {BUDGET_RANGES.map(range => (
                            <SelectItem key={range} value={range}>
                              {range}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Preferred Quest Types</Label>
                    <div className="flex flex-wrap gap-2">
                      {QUEST_TYPES.map(type => (
                        <Badge
                          key={type}
                          variant={preferredQuestTypes.includes(type) ? 'default' : 'outline'}
                          className="cursor-pointer capitalize"
                          onClick={() => toggleQuestType(type)}
                        >
                          {type}
                          {preferredQuestTypes.includes(type) && (
                            <X className="h-3 w-3 ml-1" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Target Audience */}
              <Card>
                <CardHeader>
                  <CardTitle>Target Audience</CardTitle>
                  <CardDescription>Who do you want to reach?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>Age Ranges</Label>
                    <div className="flex flex-wrap gap-2">
                      {AGE_RANGES.map(range => (
                        <Badge
                          key={range}
                          variant={targetAudience.age_ranges?.includes(range) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => toggleAgeRange(range)}
                        >
                          {range}
                          {targetAudience.age_ranges?.includes(range) && (
                            <X className="h-3 w-3 ml-1" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Interests</Label>
                    <div className="flex flex-wrap gap-2">
                      {INTERESTS.map(interest => (
                        <Badge
                          key={interest}
                          variant={targetAudience.interests?.includes(interest) ? 'default' : 'outline'}
                          className="cursor-pointer capitalize"
                          onClick={() => toggleInterest(interest)}
                        >
                          {interest}
                          {targetAudience.interests?.includes(interest) && (
                            <X className="h-3 w-3 ml-1" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  size="lg"
                  onClick={handleSave}
                  disabled={!hasChanges || updateProfile.isPending || !name.trim()}
                >
                  {updateProfile.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>

            {/* Preview Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-32">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Profile Preview</CardTitle>
                    <CardDescription>How you appear on sponsored quests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-4">
                      <Avatar className="h-20 w-20 mx-auto rounded-lg">
                        <AvatarImage src={profile.logo_url || undefined} className="object-cover" />
                        <AvatarFallback className="text-xl bg-primary/10 text-primary rounded-lg">
                          {name.charAt(0).toUpperCase() || 'S'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{name || 'Business Name'}</h3>
                        <p className="text-sm text-muted-foreground">{city || 'City'}</p>
                        <Badge variant="secondary" className="mt-2 capitalize">
                          {sponsorType}
                        </Badge>
                      </div>
                      {description && (
                        <p className="text-sm text-muted-foreground line-clamp-3">{description}</p>
                      )}
                      {preferredQuestTypes.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-center">
                          {preferredQuestTypes.slice(0, 3).map(type => (
                            <Badge key={type} variant="outline" className="text-xs capitalize">
                              {type}
                            </Badge>
                          ))}
                          {preferredQuestTypes.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{preferredQuestTypes.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Status Card */}
                <Card className="mt-4">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Account Status</p>
                        <Badge 
                          variant={profile.status === 'approved' ? 'default' : 'secondary'}
                          className="mt-1 capitalize"
                        >
                          {profile.status === 'pending_review' ? 'Pending Review' : profile.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />

      {/* Remove Logo Dialog */}
      <AlertDialog open={removeLogoDialogOpen} onOpenChange={setRemoveLogoDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove logo?</AlertDialogTitle>
            <AlertDialogDescription>
              Your profile will display your initial instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveLogo}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
