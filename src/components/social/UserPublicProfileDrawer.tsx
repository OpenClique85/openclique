/**
 * UserPublicProfileDrawer - Slide-out drawer showing public profile info
 * Displays social vibe, interests, traits, and badges while respecting privacy
 */

import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AddContactButton } from '@/components/contacts/AddContactButton';
import { PokeButton } from '@/components/social/PokeButton';
import { useUserPublicProfile, PublicPreferences } from '@/hooks/useUserPublicProfile';
import { MapPin, Calendar, Lock, UserPlus, Trophy, Sparkles, MessageCircle, Brain, X } from 'lucide-react';
import { format } from 'date-fns';

interface UserPublicProfileDrawerProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInviteToClique?: (userId: string) => void;
}

// Helper to format preference values to human-readable labels
function formatGroupSize(value?: string): string | null {
  const map: Record<string, string> = {
    'small_3_5': 'Small groups (3-5)',
    'medium_6_10': 'Medium groups (6-10)',
    'large_10_plus': 'Large groups (10+)',
    'any': 'Any size',
  };
  return value ? map[value] || value : null;
}

function formatVibePreference(value?: number): string | null {
  if (value === undefined || value === null) return null;
  if (value <= 2) return 'Chill vibes';
  if (value <= 3) return 'Balanced energy';
  return 'High energy';
}

function formatPacePreference(value?: number): string | null {
  if (value === undefined || value === null) return null;
  if (value <= 2) return 'Slow & easy';
  if (value <= 3) return 'Moderate pace';
  return 'Fast-paced';
}

function formatExplorerHomebody(value?: number): string | null {
  if (value === undefined || value === null) return null;
  if (value <= 2) return 'Homebody';
  if (value <= 3) return 'Balanced';
  return 'Explorer';
}

// Quest type labels
const QUEST_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  food_drink: { label: 'Food & Drink', emoji: '🍽️' },
  outdoors: { label: 'Outdoors', emoji: '🌳' },
  arts_culture: { label: 'Arts & Culture', emoji: '🎭' },
  live_music: { label: 'Live Music', emoji: '🎵' },
  fitness_wellness: { label: 'Fitness', emoji: '💪' },
  games_trivia: { label: 'Games & Trivia', emoji: '🎮' },
  learning: { label: 'Learning', emoji: '📚' },
  volunteering: { label: 'Volunteering', emoji: '🤝' },
  nightlife: { label: 'Nightlife', emoji: '🌙' },
  sports: { label: 'Sports', emoji: '⚽' },
};

// Context tag labels
const CONTEXT_TAG_LABELS: Record<string, string> = {
  new_to_city: 'New to the city',
  remote_wfh: 'Remote/WFH',
  grad_student: 'Grad student',
  young_professional: 'Young professional',
  parent: 'Parent',
  empty_nester: 'Empty nester',
};

export function UserPublicProfileDrawer({
  userId,
  open,
  onOpenChange,
  onInviteToClique,
}: UserPublicProfileDrawerProps) {
  const { data: profile, isLoading } = useUserPublicProfile(userId);

  const isPrivate = profile?.visibility_level === 'private';

  const renderSocialVibeBadges = (prefs: PublicPreferences) => {
    const badges: string[] = [];
    
    const groupSize = formatGroupSize(prefs.group_size);
    const vibe = formatVibePreference(prefs.vibe_preference);
    const pace = formatPacePreference(prefs.pace_preference);
    const explorer = formatExplorerHomebody(prefs.explorer_homebody);
    
    if (groupSize) badges.push(groupSize);
    if (vibe) badges.push(vibe);
    if (pace) badges.push(pace);
    if (explorer) badges.push(explorer);
    
    return badges;
  };

  const renderInterests = (prefs: PublicPreferences) => {
    const interests: Array<{ label: string; emoji: string }> = [];
    
    // Add quest type preferences
    const questTypes = prefs.quest_types || prefs.interests || [];
    questTypes.forEach(type => {
      const info = QUEST_TYPE_LABELS[type];
      if (info) interests.push(info);
    });
    
    return interests.slice(0, 6); // Max 6
  };

  const renderContextTags = (prefs: PublicPreferences) => {
    const tags: string[] = [];
    
    if (prefs.new_to_city) tags.push(CONTEXT_TAG_LABELS.new_to_city);
    if (prefs.remote_wfh) tags.push(CONTEXT_TAG_LABELS.remote_wfh);
    
    // Add context_tags array if present
    const contextTags = prefs.context_tags || [];
    contextTags.forEach(tag => {
      const label = CONTEXT_TAG_LABELS[tag];
      if (label && !tags.includes(label)) tags.push(label);
    });
    
    return tags;
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="overflow-y-auto">
          {/* Close button */}
          <DrawerClose asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-4 top-4 z-10"
            >
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
          
          <DrawerHeader className="text-left">
            {isLoading ? (
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ) : isPrivate || !profile ? (
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Lock className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <DrawerTitle className="text-xl">Private Profile</DrawerTitle>
                  <DrawerDescription>
                    This user has set their profile to private
                  </DrawerDescription>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-display font-bold text-primary">
                  {profile.display_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <DrawerTitle className="text-xl flex items-center gap-2">
                    {profile.display_name}
                    {profile.username && (
                      <span className="text-base font-normal text-muted-foreground">
                        @{profile.username}
                      </span>
                    )}
                  </DrawerTitle>
                  <DrawerDescription className="flex items-center gap-3 mt-1">
                    {profile.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {profile.city}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Member since {format(new Date(profile.created_at), 'MMM yyyy')}
                    </span>
                  </DrawerDescription>
                </div>
              </div>
            )}
          </DrawerHeader>

          {!isLoading && !isPrivate && profile && (
            <div className="px-4 pb-4 space-y-6">
              {/* Social Vibe */}
              {profile.public_preferences && (
                <>
                  {renderSocialVibeBadges(profile.public_preferences).length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Social Vibe
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {renderSocialVibeBadges(profile.public_preferences).map((badge, i) => (
                          <Badge key={i} variant="secondary" className="text-sm">
                            {badge}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interests */}
                  {renderInterests(profile.public_preferences).length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Interests
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {renderInterests(profile.public_preferences).map((interest, i) => (
                          <Badge key={i} variant="outline" className="text-sm">
                            {interest.emoji} {interest.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Context Tags */}
                  {renderContextTags(profile.public_preferences).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {renderContextTags(profile.public_preferences).map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-muted/50">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Algorithm Traits */}
              {profile.traits.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Traits
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.traits.map((trait) => (
                      <Badge 
                        key={trait.trait_slug} 
                        variant="secondary"
                        className="text-sm"
                      >
                        {trait.emoji && <span className="mr-1">{trait.emoji}</span>}
                        {trait.display_name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* XP & Badges */}
              {profile.show_xp_and_badges && (profile.xp !== undefined || (profile.badges && profile.badges.length > 0)) && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Progress
                  </h3>
                  <div className="flex items-center gap-4">
                    {profile.level !== undefined && (
                      <div className="text-sm">
                        <span className="font-semibold text-foreground">Level {profile.level}</span>
                        <span className="text-muted-foreground ml-1">• {profile.xp} XP</span>
                      </div>
                    )}
                    {profile.badges && profile.badges.length > 0 && (
                      <div className="flex gap-1">
                        {profile.badges.map((badge) => (
                          <div 
                            key={badge.id}
                            className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-lg"
                            title={badge.name}
                          >
                            {badge.icon || '🏆'}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {!isLoading && profile && !isPrivate && (
            <DrawerFooter className="flex-row gap-2 pt-2">
              <AddContactButton 
                targetUserId={profile.id} 
                source="profile" 
                variant="outline"
                className="flex-1"
              />
              {onInviteToClique && (
                <Button 
                  variant="outline" 
                  className="flex-1 gap-1.5"
                  onClick={() => {
                    onInviteToClique(profile.id);
                    onOpenChange(false);
                  }}
                >
                  <UserPlus className="h-4 w-4" />
                  Invite to Clique
                </Button>
              )}
              <PokeButton targetUserId={profile.id} />
            </DrawerFooter>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
