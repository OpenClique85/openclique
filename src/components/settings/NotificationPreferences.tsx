/**
 * =============================================================================
 * NotificationPreferences - Email and in-app notification controls
 * =============================================================================
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Mail, Bell, BellOff } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { DEFAULT_NOTIFICATION_PREFERENCES, type NotificationPreferences as NotificationPrefsType } from '@/types/settings';

export function NotificationPreferences() {
  const { settings, updateNotifications, isUpdating } = useSettings();
  const notifications = settings?.notifications || DEFAULT_NOTIFICATION_PREFERENCES;

  const handleToggle = (key: keyof NotificationPrefsType, value: boolean) => {
    updateNotifications({ [key]: value });
  };

  const handleUnsubscribeAll = () => {
    updateNotifications({
      email_quest_recommendations: false,
      email_quest_reminders: false,
      email_squad_updates: false,
      email_marketing: false,
      in_app_quest_recommendations: false,
      in_app_squad_updates: false,
      in_app_general: false,
    });
  };

  const allDisabled = Object.values(notifications).every(v => !v);

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Choose what emails you'd like to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Quest recommendations</Label>
              <p className="text-sm text-muted-foreground">
                Personalized quest suggestions based on your interests
              </p>
            </div>
            <Switch
              checked={notifications.email_quest_recommendations}
              onCheckedChange={(checked) => handleToggle('email_quest_recommendations', checked)}
              disabled={isUpdating}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Quest reminders</Label>
              <p className="text-sm text-muted-foreground">
                Reminders before your upcoming quests
              </p>
            </div>
            <Switch
              checked={notifications.email_quest_reminders}
              onCheckedChange={(checked) => handleToggle('email_quest_reminders', checked)}
              disabled={isUpdating}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Squad updates</Label>
              <p className="text-sm text-muted-foreground">
                News from your squads and cliques
              </p>
            </div>
            <Switch
              checked={notifications.email_squad_updates}
              onCheckedChange={(checked) => handleToggle('email_squad_updates', checked)}
              disabled={isUpdating}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Marketing & announcements</Label>
              <p className="text-sm text-muted-foreground">
                New features, events, and community highlights
              </p>
            </div>
            <Switch
              checked={notifications.email_marketing}
              onCheckedChange={(checked) => handleToggle('email_marketing', checked)}
              disabled={isUpdating}
            />
          </div>
        </CardContent>
      </Card>

      {/* In-App Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            In-App Notifications
          </CardTitle>
          <CardDescription>
            Control notifications within the app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Quest recommendations</Label>
              <p className="text-sm text-muted-foreground">
                Show personalized quest suggestions
              </p>
            </div>
            <Switch
              checked={notifications.in_app_quest_recommendations}
              onCheckedChange={(checked) => handleToggle('in_app_quest_recommendations', checked)}
              disabled={isUpdating}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Squad updates</Label>
              <p className="text-sm text-muted-foreground">
                Notifications about squad activity
              </p>
            </div>
            <Switch
              checked={notifications.in_app_squad_updates}
              onCheckedChange={(checked) => handleToggle('in_app_squad_updates', checked)}
              disabled={isUpdating}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>General announcements</Label>
              <p className="text-sm text-muted-foreground">
                System updates and community news
              </p>
            </div>
            <Switch
              checked={notifications.in_app_general}
              onCheckedChange={(checked) => handleToggle('in_app_general', checked)}
              disabled={isUpdating}
            />
          </div>
        </CardContent>
      </Card>

      {/* Unsubscribe All */}
      <Card className="border-destructive/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2 text-destructive">
                <BellOff className="h-4 w-4" />
                Unsubscribe from all
              </Label>
              <p className="text-sm text-muted-foreground">
                Turn off all email and in-app notifications
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleUnsubscribeAll}
              disabled={isUpdating || allDisabled}
            >
              {allDisabled ? 'All disabled' : 'Disable all'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
