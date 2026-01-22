import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Camera, Instagram, Twitter, Globe, ExternalLink, Save } from 'lucide-react';

interface Socials {
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  website?: string;
}

interface CreatorProfilePreviewProps {
  previewUserId: string;
}

export function CreatorProfilePreview({ previewUserId }: CreatorProfilePreviewProps) {
  // Fetch creator profile
  const { data: creatorProfile, isLoading } = useQuery({
    queryKey: ['creator-profile-preview', previewUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('user_id', previewUserId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching creator profile:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!previewUserId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!creatorProfile) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Creator profile not found
      </div>
    );
  }

  const socials = (creatorProfile.socials as Socials) || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">Creator Profile</h2>
          <p className="text-muted-foreground text-sm">
            Manage how you appear to quest participants
          </p>
        </div>
        
        {creatorProfile.slug && (
          <Button variant="outline" size="sm" asChild>
            <a href={`/creators/${creatorProfile.slug}`} target="_blank" rel="noopener noreferrer">
              View Public Profile
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Form (read-only) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo Section */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Photo</CardTitle>
              <CardDescription>This appears on your quests and public profile</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={creatorProfile.photo_url || undefined} />
                  <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                    {creatorProfile.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" disabled>
                    <Camera className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
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
                <Label>Display Name</Label>
                <Input
                  value={creatorProfile.display_name}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  value={creatorProfile.bio || ''}
                  disabled
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={creatorProfile.city || 'Austin'}
                  disabled
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
                <Label className="flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  Instagram
                </Label>
                <Input
                  value={socials.instagram || ''}
                  disabled
                  placeholder="Not set"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Twitter className="h-4 w-4" />
                  Twitter / X
                </Label>
                <Input
                  value={socials.twitter || ''}
                  disabled
                  placeholder="Not set"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <span className="text-sm">🎵</span>
                  TikTok
                </Label>
                <Input
                  value={socials.tiktok || ''}
                  disabled
                  placeholder="Not set"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website
                </Label>
                <Input
                  value={socials.website || ''}
                  disabled
                  placeholder="Not set"
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button (disabled) */}
          <div className="flex justify-end">
            <Button size="lg" disabled>
              <Save className="h-4 w-4 mr-2" />
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
                <CardDescription>How they appear on quest cards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <Avatar className="h-20 w-20 mx-auto">
                    <AvatarImage src={creatorProfile.photo_url || undefined} />
                    <AvatarFallback className="text-xl bg-primary/20 text-primary">
                      {creatorProfile.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{creatorProfile.display_name}</h3>
                    <p className="text-sm text-muted-foreground">{creatorProfile.city || 'City'}</p>
                  </div>
                  {creatorProfile.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{creatorProfile.bio}</p>
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
    </div>
  );
}
