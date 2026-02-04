/**
 * Member Profile Sheet
 * 
 * A sheet that displays a squad member's profile when clicked.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, MapPin, Calendar, Star } from 'lucide-react';

interface MemberProfileSheetProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MemberProfileSheet({ userId, open, onOpenChange }: MemberProfileSheetProps) {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['member-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, city, xp_current, xp_level, bio, created_at')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId && open,
  });

  // Fetch user traits
  const { data: traits } = useQuery({
    queryKey: ['member-traits', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_traits')
        .select(`
          id,
          trait_library(display_name, emoji)
        `)
        .eq('user_id', userId)
        .limit(5);
      
      if (error) return [];
      return data;
    },
    enabled: !!userId && open,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[340px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Member Profile</SheetTitle>
        </SheetHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : profile ? (
          <div className="mt-6 space-y-6">
            {/* Avatar & Name */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl bg-primary/10">
                  {profile.display_name?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">{profile.display_name || 'Member'}</h3>
                {profile.city && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {profile.city}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-primary">{profile.xp_level || 1}</div>
                <div className="text-xs text-muted-foreground">Level</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-primary">{profile.xp_current || 0}</div>
                <div className="text-xs text-muted-foreground">XP</div>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div>
                <h4 className="text-sm font-medium mb-2">About</h4>
                <p className="text-sm text-muted-foreground">{profile.bio}</p>
              </div>
            )}

            {/* Traits */}
            {traits && traits.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  Traits
                </h4>
                <div className="flex flex-wrap gap-2">
                  {traits.map((t: any) => (
                    <Badge key={t.id} variant="secondary" className="text-xs">
                      {t.trait_library?.emoji} {t.trait_library?.display_name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Member Since */}
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            Profile not found
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
