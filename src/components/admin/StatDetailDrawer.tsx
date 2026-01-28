/**
 * StatDetailDrawer - Shows breakdown of what contributes to a stat
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export type StatType = 
  | 'totalUsers' 
  | 'totalSignups' 
  | 'totalQuests' 
  | 'activeInstances' 
  | 'activeSquads' 
  | 'activeCreators' 
  | 'activeSponsors' 
  | 'activeOrgs'
  | 'friendsRecruited';

interface StatDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statType: StatType | null;
  statLabel: string;
}

export function StatDetailDrawer({ open, onOpenChange, statType, statLabel }: StatDetailDrawerProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['stat-detail', statType],
    queryFn: async () => {
      if (!statType) return [];

      switch (statType) {
        case 'totalUsers': {
          const { data } = await supabase
            .from('profiles')
            .select('id, display_name, created_at')
            .order('created_at', { ascending: false })
            .limit(100);
          return data?.map(p => ({
            id: p.id,
            title: p.display_name || 'Anonymous',
            subtitle: `Joined ${format(new Date(p.created_at), 'MMM d, yyyy')}`,
          })) || [];
        }

        case 'totalSignups': {
          const { data } = await supabase
            .from('quest_signups')
            .select('id, status, signed_up_at, profiles:user_id(display_name), quests:quest_id(title)')
            .order('signed_up_at', { ascending: false })
            .limit(100);
          return data?.map(s => ({
            id: s.id,
            title: (s.profiles as any)?.display_name || 'User',
            subtitle: `${(s.quests as any)?.title || 'Quest'} • ${s.status}`,
          })) || [];
        }

        case 'totalQuests': {
          const { data } = await supabase
            .from('quests')
            .select('id, title, status, created_at')
            .order('created_at', { ascending: false })
            .limit(100);
          return data?.map(q => ({
            id: q.id,
            title: q.title,
            subtitle: q.status || 'draft',
            badge: q.status,
          })) || [];
        }

        case 'activeInstances': {
          const { data } = await supabase
            .from('quest_instances')
            .select('id, scheduled_date, status, quests:quest_id(title)')
            .in('status', ['recruiting', 'locked', 'live'])
            .order('scheduled_date', { ascending: true })
            .limit(100);
          return data?.map(i => ({
            id: i.id,
            title: (i.quests as any)?.title || 'Quest',
            subtitle: `${format(new Date(i.scheduled_date), 'MMM d')} • ${i.status}`,
            badge: i.status,
          })) || [];
        }

        case 'activeSquads': {
          const { data } = await supabase
            .from('quest_squads')
            .select('id, squad_name, status, created_at')
            .not('status', 'eq', 'cancelled')
            .order('created_at', { ascending: false })
            .limit(100);
          return data?.map(s => ({
            id: s.id,
            title: s.squad_name || 'Squad',
            subtitle: s.status,
            badge: s.status,
          })) || [];
        }

        case 'activeCreators': {
          const { data } = await supabase
            .from('creator_profiles')
            .select('id, display_name, city, created_at')
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(100);
          return data?.map(c => ({
            id: c.id,
            title: c.display_name,
            subtitle: c.city || 'No location',
          })) || [];
        }

        case 'activeSponsors': {
          const { data } = await supabase
            .from('sponsor_profiles')
            .select('id, name, created_at')
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .limit(100);
          return data?.map(s => ({
            id: s.id,
            title: s.name || 'Sponsor',
            subtitle: `Since ${format(new Date(s.created_at), 'MMM yyyy')}`,
          })) || [];
        }

        case 'activeOrgs': {
          const { data } = await supabase
            .from('organizations')
            .select('id, name, type, created_at')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(100);
          return data?.map(o => ({
            id: o.id,
            title: o.name,
            subtitle: o.type || 'Organization',
            badge: o.type,
          })) || [];
        }

        case 'friendsRecruited': {
          const { data } = await supabase
            .from('friend_invites')
            .select('id, code, redeemed_at, profiles:referrer_user_id(display_name)')
            .not('redeemed_at', 'is', null)
            .order('redeemed_at', { ascending: false })
            .limit(100);
          return data?.map(f => ({
            id: f.id,
            title: `Invited by ${(f.profiles as any)?.display_name || 'User'}`,
            subtitle: f.redeemed_at ? format(new Date(f.redeemed_at), 'MMM d, yyyy') : '',
          })) || [];
        }

        default:
          return [];
      }
    },
    enabled: open && !!statType,
  });

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>{statLabel}</DrawerTitle>
        </DrawerHeader>
        <ScrollArea className="h-[60vh] px-4 pb-4">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : data && data.length > 0 ? (
            <div className="space-y-1">
              {data.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{item.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{item.subtitle}</p>
                  </div>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-2 shrink-0">
                      {item.badge}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No data found</p>
          )}
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
