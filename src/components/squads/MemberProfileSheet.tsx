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
        .select('id, display_name, city, username, created_at')
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

  // Fetch quest count
  const { data: questCount } = useQuery({
    queryKey: ['member-quest-count', userId],
    queryFn: async () => {
      if (!userId) return 0;
      
      const { count, error } = await supabase
        .from('squad_members')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      if (error) return 0;
      return count || 0;
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
                {profile.username && (
                  <p className="text-sm text-muted-foreground">@{profile.username}</p>
                )}
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
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">{questCount || 0}</div>
              <div className="text-xs text-muted-foreground">Quests Joined</div>
            </div>

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
