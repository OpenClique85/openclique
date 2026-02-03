import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CreatorPortalNav } from '@/components/creators/CreatorPortalNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { Loader2, Sparkles, Camera, Instagram, Twitter, Globe, ExternalLink, Save, Trash2, Handshake, Shield, Eye, EyeOff } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
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

type CreatorProfile = Tables<'creator_profiles'>;

interface Socials {
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  website?: string;
}

interface CreatorPrivacySettings {
  show_bio: boolean;
  show_city: boolean;
  show_seeking: boolean;
  show_socials: boolean;
}

const DEFAULT_PRIVACY_SETTINGS: CreatorPrivacySettings = {
  show_bio: true,
  show_city: true,
  show_seeking: true,
  show_socials: true,
};

const SEEKING_OPTIONS = [
  { id: 'org_partnerships', label: 'Organization Partnerships', description: 'Available to create quests for clubs, orgs, and student groups' },
  { id: 'sponsorships', label: 'Brand Sponsorships', description: 'Looking for sponsors to fund or partner on quests' },
  { id: 'custom_quests', label: 'Custom Quests', description: 'Open to designing unique experiences for private groups' },
];

export default function CreatorProfile() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('Austin');
  const [socials, setSocials] = useState<Socials>({});
  const [seeking, setSeeking] = useState<string[]>([]);
  const [privacySettings, setPrivacySettings] = useState<CreatorPrivacySettings>(DEFAULT_PRIVACY_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [removePhotoDialogOpen, setRemovePhotoDialogOpen] = useState(false);

  // Fetch creator profile
  const { data: creatorProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['creator-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching creator profile:', error);
        return null;
      }
      
      // Initialize form state
      if (data) {
        setDisplayName(data.display_name);
        setBio(data.bio || '');
        setCity(data.city || 'Austin');
        setSocials((data.socials as Socials) || {});
        setSeeking(data.seeking || []);
        setPrivacySettings({ ...DEFAULT_PRIVACY_SETTINGS, ...(data.privacy_settings as Partial<CreatorPrivacySettings>) });
        setHasChanges(false);
      }
      
      return data;
    },
    enabled: !!user,
  });

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<CreatorProfile>) => {
      const { error } = await supabase
        .from('creator_profiles')
        .update(updates)
        .eq('user_id', user?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Profile updated!');
      queryClient.invalidateQueries({ queryKey: ['creator-profile'] });
      setHasChanges(false);
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    },
  });

  // Handle form changes
  const handleChange = (field: string, value: string) => {
    setHasChanges(true);
    switch (field) {
      case 'displayName':
        setDisplayName(value);
        break;
      case 'bio':
        setBio(value);
        break;
      case 'city':
        setCity(value);
        break;
    }
  };

  const handleSocialChange = (platform: keyof Socials, value: string) => {
    setHasChanges(true);
    setSocials(prev => ({ ...prev, [platform]: value }));
  };

  const toggleSeeking = (id: string) => {
    setHasChanges(true);
    setSeeking(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const togglePrivacy = (key: keyof CreatorPrivacySettings) => {
    setHasChanges(true);
    setPrivacySettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    updateProfile.mutate({
      display_name: displayName,
      bio,
      city,
      socials: socials as unknown as CreatorProfile['socials'],
      seeking,
      privacy_settings: privacySettings as unknown as CreatorProfile['privacy_settings'],
    });
  };

  // Photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `creator-photos/${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('quest-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('quest-images')
        .getPublicUrl(fileName);

      await updateProfile.mutateAsync({ photo_url: publicUrl });
      toast.success('Photo uploaded!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await updateProfile.mutateAsync({ photo_url: null });
      setRemovePhotoDialogOpen(false);
      toast.success('Photo removed');
    } catch (error) {
      console.error('Error removing photo:', error);
    }
  };

  if (authLoading || profileLoading) {
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

  // Not a creator
  if (!creatorProfile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 text-center">
          <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold mb-4">Creator Portal</h1>
          <p className="text-muted-foreground mb-6">
            You need a creator account to access this page.
          </p>
          <Button asChild>
            <Link to="/creators/quest-creators">Learn About Becoming a Creator</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <CreatorPortalNav />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              Creator Profile
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage how you appear to quest participants
            </p>
          </div>
          
          {creatorProfile.slug && (
            <Button variant="outline" asChild>
              <Link to={`/creators/${creatorProfile.slug}`} target="_blank">
                View Public Profile
                <ExternalLink className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo Section */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Photo</CardTitle>
                <CardDescription>This appears on your quests and public profile</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={creatorProfile.photo_url || undefined} />
                      <AvatarFallback className="text-2xl bg-creator/20 text-creator">
                        {displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {uploadingPhoto && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Upload Photo
                    </Button>
                    {creatorProfile.photo_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setRemovePhotoDialogOpen(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name *</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => handleChange('displayName', e.target.value)}
                    placeholder="Your name"
                    maxLength={50}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    placeholder="Tell participants about yourself and your expertise..."
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {bio.length}/500
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="Austin"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card>
              <CardHeader>
                <CardTitle>Social Links</CardTitle>
                <CardDescription>Connect your social profiles (optional)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="instagram" className="flex items-center gap-2">
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </Label>
                  <Input
                    id="instagram"
                    value={socials.instagram || ''}
                    onChange={(e) => handleSocialChange('instagram', e.target.value)}
                    placeholder="@username or full URL"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitter" className="flex items-center gap-2">
                    <Twitter className="h-4 w-4" />
                    Twitter / X
                  </Label>
                  <Input
                    id="twitter"
                    value={socials.twitter || ''}
                    onChange={(e) => handleSocialChange('twitter', e.target.value)}
                    placeholder="@username or full URL"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tiktok" className="flex items-center gap-2">
                    <span className="text-sm">🎵</span>
                    TikTok
                  </Label>
                  <Input
                    id="tiktok"
                    value={socials.tiktok || ''}
                    onChange={(e) => handleSocialChange('tiktok', e.target.value)}
                    placeholder="@username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Website
                  </Label>
                  <Input
                    id="website"
                    value={socials.website || ''}
                    onChange={(e) => handleSocialChange('website', e.target.value)}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Marketplace Availability */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Handshake className="h-5 w-5" />
                  Marketplace Availability
                </CardTitle>
                <CardDescription>Let organizations and sponsors know what you're looking for</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {SEEKING_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={seeking.includes(option.id)}
                      onCheckedChange={() => toggleSeeking(option.id)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </label>
                ))}
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy Settings
                </CardTitle>
                <CardDescription>Control what information is visible on your public profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {privacySettings.show_bio ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                    <div>
                      <p className="font-medium">Show Bio</p>
                      <p className="text-sm text-muted-foreground">Display your bio on public profile</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={privacySettings.show_bio}
                    onCheckedChange={() => togglePrivacy('show_bio')}
                  />
                </label>

                <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {privacySettings.show_city ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                    <div>
                      <p className="font-medium">Show City</p>
                      <p className="text-sm text-muted-foreground">Display your city location</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={privacySettings.show_city}
                    onCheckedChange={() => togglePrivacy('show_city')}
                  />
                </label>

                <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {privacySettings.show_seeking ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                    <div>
                      <p className="font-medium">Show Marketplace Availability</p>
                      <p className="text-sm text-muted-foreground">Let sponsors and orgs see what you're seeking</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={privacySettings.show_seeking}
                    onCheckedChange={() => togglePrivacy('show_seeking')}
                  />
                </label>

                <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {privacySettings.show_socials ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                    <div>
                      <p className="font-medium">Show Social Links</p>
                      <p className="text-sm text-muted-foreground">Display your Instagram, Twitter, and website</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={privacySettings.show_socials}
                    onCheckedChange={() => togglePrivacy('show_socials')}
                  />
                </label>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                size="lg"
                onClick={handleSave}
                disabled={!hasChanges || updateProfile.isPending || !displayName.trim()}
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
                  <CardDescription>How you appear on quest cards</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <Avatar className="h-20 w-20 mx-auto">
                      <AvatarImage src={creatorProfile.photo_url || undefined} />
                      <AvatarFallback className="text-xl bg-creator/20 text-creator">
                        {displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{displayName || 'Your Name'}</h3>
                      <p className="text-sm text-muted-foreground">{city || 'City'}</p>
                    </div>
                    {bio && (
                      <p className="text-sm text-muted-foreground line-clamp-3">{bio}</p>
                    )}
                    {(socials.instagram || socials.twitter || socials.website) && (
                      <div className="flex justify-center gap-3">
                        {socials.instagram && <Instagram className="h-4 w-4 text-muted-foreground" />}
                        {socials.twitter && <Twitter className="h-4 w-4 text-muted-foreground" />}
                        {socials.website && <Globe className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />

      {/* Remove Photo Dialog */}
      <AlertDialog open={removePhotoDialogOpen} onOpenChange={setRemovePhotoDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove profile photo?</AlertDialogTitle>
            <AlertDialogDescription>
              Your profile will display your initials instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemovePhoto}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
