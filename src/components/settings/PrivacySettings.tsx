/**
 * =============================================================================
 * PrivacySettings - Privacy controls for profile visibility and matching
 * =============================================================================
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Eye, Users, Sparkles, Trophy } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { DEFAULT_PRIVACY_SETTINGS, type PrivacySettings as PrivacySettingsType } from '@/types/settings';

export function PrivacySettings() {
  const { settings, updatePrivacy, isUpdating } = useSettings();
  const privacy = settings?.privacy || DEFAULT_PRIVACY_SETTINGS;

  const handleToggle = (key: keyof PrivacySettingsType, value: boolean) => {
    updatePrivacy({ [key]: value });
  };

  const handleVisibilityChange = (value: string) => {
    updatePrivacy({ profile_visibility: value as PrivacySettingsType['profile_visibility'] });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Profile Visibility
          </CardTitle>
          <CardDescription>
            Control who can see your profile and activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Visibility Level */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              Who can view your profile
            </Label>
            <Select 
              value={privacy.profile_visibility} 
              onValueChange={handleVisibilityChange}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <span className="flex items-center gap-2">
                    🌍 Public - Anyone can view
                  </span>
                </SelectItem>
                <SelectItem value="squad-only">
                  <span className="flex items-center gap-2">
                    👥 Squad Only - Only squad members
                  </span>
                </SelectItem>
                <SelectItem value="private">
                  <span className="flex items-center gap-2">
                    🔒 Private - Only you
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Activity History */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Show activity history
              </Label>
              <p className="text-sm text-muted-foreground">
                Let squad members see your past quests and activity
              </p>
            </div>
            <Switch
              checked={privacy.show_activity_history}
              onCheckedChange={(checked) => handleToggle('show_activity_history', checked)}
              disabled={isUpdating}
            />
          </div>

          {/* Show in Squad Lists */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Appear in squad member lists
              </Label>
              <p className="text-sm text-muted-foreground">
                Show your name in public squad rosters
              </p>
            </div>
            <Switch
              checked={privacy.show_in_squad_lists}
              onCheckedChange={(checked) => handleToggle('show_in_squad_lists', checked)}
              disabled={isUpdating}
            />
          </div>

          {/* XP and Badges */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                Show XP, badges, and level
              </Label>
              <p className="text-sm text-muted-foreground">
                Display your achievements publicly on your profile
              </p>
            </div>
            <Switch
              checked={privacy.show_xp_and_badges}
              onCheckedChange={(checked) => handleToggle('show_xp_and_badges', checked)}
              disabled={isUpdating}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Matching & Discovery
          </CardTitle>
          <CardDescription>
            Control how the AI matches you with squads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow AI-based matching</Label>
              <p className="text-sm text-muted-foreground">
                Let our AI suggest quests and squads based on your preferences and behavior
              </p>
            </div>
            <Switch
              checked={privacy.allow_matching}
              onCheckedChange={(checked) => handleToggle('allow_matching', checked)}
              disabled={isUpdating}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
