/**
 * =============================================================================
 * OrganizationsTab - My Organizations tab for Profile Hub
 * =============================================================================
 * 
 * Features:
 * - Display all organizations user belongs to
 * - Show club cards with name, role, member count, and recent quests
 * - "Redeem Club Code" button with modal input
 * - Visual distinction between umbrella orgs and clubs
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Building2, 
  Users, 
  Calendar,
  ChevronRight, 
  Crown, 
  Loader2,
  Plus,
  Ticket,
  GraduationCap,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface UserOrg {
  id: string;
  name: string;
  slug: string;
  type: string;
  is_umbrella: boolean;
  primary_color: string | null;
  logo_url: string | null;
  role: string;
  joined_at: string;
  member_count: number;
  quest_count: number;
  parent_org_name?: string;
}

interface OrganizationsTabProps {
  userId: string;
}

export function OrganizationsTab({ userId }: OrganizationsTabProps) {
  const [orgs, setOrgs] = useState<UserOrg[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, [userId]);

  const fetchOrganizations = async () => {
    setIsLoading(true);

    // Get user's organization memberships
    const { data: memberships, error } = await supabase
      .from('profile_organizations')
      .select(`
        role,
        joined_at,
        org:organizations(
          id,
          name,
          slug,
          type,
          is_umbrella,
          primary_color,
          logo_url,
          parent_org_id
        )
      `)
      .eq('profile_id', userId);

    if (error || !memberships) {
      console.error('Failed to fetch orgs:', error);
      setIsLoading(false);
      return;
    }

    // Get additional details for each org
    const orgsWithDetails: UserOrg[] = await Promise.all(
      memberships.map(async (membership) => {
        const org = membership.org as any;
        if (!org) return null;

        // Get member count
        const { count: memberCount } = await supabase
          .from('profile_organizations')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', org.id);

        // Get quest count
        const { count: questCount } = await supabase
          .from('quests')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', org.id)
          .eq('status', 'open');

        // Get parent org name if this is a child club
        let parentOrgName: string | undefined;
        if (org.parent_org_id) {
          const { data: parentOrg } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', org.parent_org_id)
            .maybeSingle();
          parentOrgName = parentOrg?.name;
        }

        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          type: org.type,
          is_umbrella: org.is_umbrella || false,
          primary_color: org.primary_color,
          logo_url: org.logo_url,
          role: membership.role,
          joined_at: membership.joined_at,
          member_count: memberCount || 0,
          quest_count: questCount || 0,
          parent_org_name: parentOrgName,
        };
      })
    );

    setOrgs(orgsWithDetails.filter((o): o is UserOrg => o !== null));
    setIsLoading(false);
  };

  const handleRedeemCode = async () => {
    if (!inviteCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }

    setIsRedeeming(true);

    try {
      const { data, error } = await supabase.rpc('redeem_org_invite', {
        p_code: inviteCode.toUpperCase().trim(),
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; org_name?: string; already_member?: boolean };

      if (!result.success) {
        toast.error(result.error || 'Failed to redeem code');
        return;
      }

      if (result.already_member) {
        toast.info(`You're already a member of ${result.org_name}`);
      } else {
        toast.success(`Welcome to ${result.org_name}!`);
        fetchOrganizations();
      }

      setRedeemOpen(false);
      setInviteCode('');
    } catch (error) {
      console.error('Redeem error:', error);
      toast.error('Failed to redeem invite code');
    } finally {
      setIsRedeeming(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
      case 'org_admin':
        return <Badge variant="default" className="text-xs"><Crown className="h-3 w-3 mr-1" />Admin</Badge>;
      case 'social_chair':
        return <Badge variant="secondary" className="text-xs"><Users className="h-3 w-3 mr-1" />Social Chair</Badge>;
      case 'creator':
        return <Badge variant="outline" className="text-xs">Creator</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Member</Badge>;
    }
  };

  const getOrgTypeIcon = (type: string, isUmbrella: boolean) => {
    if (isUmbrella) return <GraduationCap className="h-5 w-5" />;
    if (type === 'university') return <GraduationCap className="h-5 w-5" />;
    return <Building2 className="h-5 w-5" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Redeem Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-display font-semibold">My Organizations</h3>
          <p className="text-sm text-muted-foreground">
            Clubs and organizations you're a member of
          </p>
        </div>
        <Dialog open={redeemOpen} onOpenChange={setRedeemOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Ticket className="h-4 w-4 mr-2" />
              Redeem Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join a Club</DialogTitle>
              <DialogDescription>
                Enter an invite code to join a club or organization.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite-code">Invite Code</Label>
                <Input
                  id="invite-code"
                  placeholder="e.g., CLUB-ABC123"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="font-mono"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRedeemOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRedeemCode} disabled={isRedeeming}>
                {isRedeeming ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  'Join Club'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Organizations List */}
      {orgs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-display font-semibold mb-2">No Organizations Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Join a club or organization to see quests and connect with members.
            </p>
            <Button onClick={() => setRedeemOpen(true)}>
              <Ticket className="h-4 w-4 mr-2" />
              Redeem Invite Code
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orgs.map((org) => (
            <Card 
              key={org.id} 
              className="overflow-hidden hover:shadow-md transition-shadow"
            >
              <CardContent className="p-0">
                <Link to={`/org/${org.slug}`} className="block">
                  {/* Header */}
                  <div 
                    className="p-4 pb-3 border-b"
                    style={{ 
                      background: org.primary_color 
                        ? `linear-gradient(135deg, ${org.primary_color}10 0%, transparent 100%)`
                        : undefined
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="p-2.5 rounded-full"
                          style={{ 
                            backgroundColor: org.primary_color 
                              ? `${org.primary_color}20` 
                              : 'hsl(var(--primary) / 0.1)',
                            color: org.primary_color || 'hsl(var(--primary))'
                          }}
                        >
                          {getOrgTypeIcon(org.type, org.is_umbrella)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display font-semibold text-lg">
                              {org.name}
                            </h3>
                            {org.is_umbrella && (
                              <Badge variant="secondary" className="text-xs">
                                Enterprise
                              </Badge>
                            )}
                            {getRoleBadge(org.role)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {org.parent_org_name && (
                              <span className="mr-2">Part of {org.parent_org_name} •</span>
                            )}
                            Joined {format(new Date(org.joined_at), 'MMM yyyy')}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="px-4 py-3 flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      <span>{org.member_count} members</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>{org.quest_count} active quests</span>
                    </div>
                  </div>
                </Link>

                {/* Actions for admins/social chairs */}
                {['admin', 'org_admin', 'social_chair'].includes(org.role) && (
                  <div className="px-4 pb-3 flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/org/${org.slug}/dashboard`}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
