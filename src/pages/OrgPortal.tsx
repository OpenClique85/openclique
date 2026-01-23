/**
 * OrgPortal - Organization dashboard for org admins and members
 * - View org info and members
 * - Create org-only quests (admins)
 * - Browse creators to hire and request custom quests
 * - Send quest notifications to all members
 * - Copy invite link to share
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2,
  Users,
  Calendar,
  Copy,
  ExternalLink,
  Plus,
  UserPlus,
  Shield,
  MapPin,
  Clock,
  Send,
  Search,
  Star,
  CheckCircle,
  Building2,
  LogIn,
  Bell,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';
import { DisplayNameWithBadges } from '@/components/DisplayNameWithBadges';
import { UserPreferences } from '@/types/profile';
import { SendQuestToMembersButton, OrgCreatorRequestModal } from '@/components/org';

type Organization = Tables<'organizations'>;
type Quest = Tables<'quests'>;

interface OrgMember {
  profile_id: string;
  role: string;
  joined_at: string;
  profile?: {
    display_name: string | null;
    email: string | null;
    preferences: UserPreferences | null;
  };
}

interface CreatorProfile {
  id: string;
  user_id: string;
  display_name: string;
  slug: string;
  bio: string | null;
  photo_url: string | null;
  status: string;
}

export default function OrgPortal() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [orgQuests, setOrgQuests] = useState<Quest[]>([]);
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [memberRole, setMemberRole] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCreator, setSelectedCreator] = useState<CreatorProfile | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const fetchOrg = async () => {
    if (!slug) return;

    setIsLoading(true);

    // Fetch org by slug
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (orgError || !orgData) {
      setOrg(null);
      setIsLoading(false);
      return;
    }

    setOrg(orgData);

    // Check membership if logged in
    if (user) {
      const { data: membership } = await supabase
        .from('profile_organizations')
        .select('role')
        .eq('org_id', orgData.id)
        .eq('profile_id', user.id)
        .maybeSingle();

      if (membership) {
        setIsMember(true);
        setMemberRole(membership.role);
        setIsAdmin(membership.role === 'admin');
      }
    }

    // Fetch members
    const { data: membersData } = await supabase
      .from('profile_organizations')
      .select(`
        profile_id,
        role,
        joined_at,
        profile:profiles(display_name, email, preferences)
      `)
      .eq('org_id', orgData.id)
      .order('joined_at', { ascending: true });

    if (membersData) {
      setMembers(membersData as unknown as OrgMember[]);
    }

    // Fetch org quests
    const { data: questsData } = await supabase
      .from('quests')
      .select('*')
      .eq('org_id', orgData.id)
      .in('status', ['open', 'closed', 'completed'])
      .order('start_datetime', { ascending: true });

    if (questsData) {
      setOrgQuests(questsData);
    }

    // Fetch active creators for "hire a creator" section
    const { data: creatorsData } = await supabase
      .from('creator_profiles')
      .select('id, user_id, display_name, slug, bio, photo_url, status')
      .eq('status', 'active')
      .limit(10);

    if (creatorsData) {
      setCreators(creatorsData);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrg();
  }, [slug, user]);

  const handleJoinOrg = async () => {
    if (!user || !org) {
      navigate('/auth');
      return;
    }

    setIsJoining(true);

    const { error } = await supabase
      .from('profile_organizations')
      .insert({
        profile_id: user.id,
        org_id: org.id,
        role: 'member',
      });

    setIsJoining(false);

    if (error) {
      if (error.code === '23505') {
        toast({ title: 'You are already a member!' });
      } else {
        toast({ title: 'Failed to join organization', variant: 'destructive' });
      }
      return;
    }

    toast({ title: `Welcome to ${org.name}!`, description: 'You are now a member.' });
    setShowJoinModal(false);
    setIsMember(true);
    setMemberRole('member');
    fetchOrg();
  };

  const handleCopyInviteLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    toast({ title: 'Invite link copied!', description: 'Share this link with your org members.' });
  };

  const handleLeaveOrg = async () => {
    if (!user || !org) return;

    const { error } = await supabase
      .from('profile_organizations')
      .delete()
      .eq('org_id', org.id)
      .eq('profile_id', user.id);

    if (error) {
      toast({ title: 'Failed to leave organization', variant: 'destructive' });
      return;
    }

    toast({ title: 'You have left the organization' });
    setIsMember(false);
    setMemberRole(null);
    setIsAdmin(false);
    fetchOrg();
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 text-center">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-display font-bold mb-2">Organization Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This organization doesn't exist or is no longer active.
          </p>
          <Button asChild>
            <Link to="/">Back to Home</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const isUTAustin = org.school_affiliation === 'ut_austin';
  const upcomingQuests = orgQuests.filter(q => 
    q.start_datetime && new Date(q.start_datetime) >= new Date() && q.status === 'open'
  );
  const pastQuests = orgQuests.filter(q => 
    !q.start_datetime || new Date(q.start_datetime) < new Date() || q.status !== 'open'
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section 
          className="py-12 border-b"
          style={{ 
            background: `linear-gradient(135deg, ${org.primary_color}15 0%, transparent 50%)` 
          }}
        >
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Org Logo/Icon */}
              <div 
                className="w-20 h-20 rounded-xl flex items-center justify-center text-white text-3xl font-bold"
                style={{ backgroundColor: org.primary_color || '#14B8A6' }}
              >
                {isUTAustin ? '🤘' : org.name.charAt(0)}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-display font-bold">{org.name}</h1>
                  {org.is_verified && (
                    <Badge className="bg-green-500">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  {isUTAustin && (
                    <Badge 
                      variant="outline" 
                      className="border-[#BF5700] text-[#BF5700]"
                    >
                      🤘 UT Austin
                    </Badge>
                  )}
                </div>
                {org.description && (
                  <p className="text-muted-foreground mb-3">{org.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {members.length} members
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {orgQuests.length} quests
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {!user ? (
                  <Button onClick={() => navigate('/auth')}>
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In to Join
                  </Button>
                ) : !isMember ? (
                  <Button onClick={() => setShowJoinModal(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Join Organization
                  </Button>
                ) : (
                  <Badge variant="outline" className="px-4 py-2">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    {memberRole === 'admin' ? 'Admin' : memberRole === 'creator' ? 'Creator' : 'Member'}
                  </Badge>
                )}
                <Button variant="outline" onClick={handleCopyInviteLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Invite Link
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="quests">Quests ({orgQuests.length})</TabsTrigger>
                <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
                {(isAdmin || memberRole === 'creator') && (
                  <TabsTrigger value="create">Create Quest</TabsTrigger>
                )}
                {isAdmin && (
                  <TabsTrigger value="hire">Hire a Creator</TabsTrigger>
                )}
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Upcoming Quests */}
                  <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-display font-semibold">Upcoming Quests</h2>
                    {upcomingQuests.length === 0 ? (
                      <Card className="border-dashed">
                        <CardContent className="py-8 text-center">
                          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                          <p className="text-muted-foreground mb-4">No upcoming quests</p>
                          {(isAdmin || memberRole === 'creator') && (
                            <Button onClick={() => setActiveTab('create')}>
                              <Plus className="h-4 w-4 mr-2" />
                              Create First Quest
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {upcomingQuests.slice(0, 3).map((quest) => (
                          <Card key={quest.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                <span className="text-3xl">{quest.icon || '🎯'}</span>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold truncate">{quest.title}</h3>
                                  {quest.start_datetime && (
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {format(new Date(quest.start_datetime), 'EEE, MMM d @ h:mm a')}
                                    </p>
                                  )}
                                  {quest.meeting_location_name && (
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {quest.meeting_location_name}
                                    </p>
                                  )}
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                  <Link to={`/quests/${quest.slug}`}>View</Link>
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {upcomingQuests.length > 3 && (
                          <Button 
                            variant="ghost" 
                            className="w-full"
                            onClick={() => setActiveTab('quests')}
                          >
                            View all {upcomingQuests.length} quests
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Members Preview */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-display font-semibold">Members</h2>
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        {members.slice(0, 6).map((member) => (
                          <div key={member.profile_id} className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {member.profile?.display_name?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <DisplayNameWithBadges
                                displayName={member.profile?.display_name || 'Member'}
                                preferences={member.profile?.preferences}
                                className="text-sm font-medium truncate"
                              />
                            </div>
                            {member.role === 'admin' && (
                              <Badge variant="secondary" className="text-xs">Admin</Badge>
                            )}
                          </div>
                        ))}
                        {members.length > 6 && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="w-full"
                            onClick={() => setActiveTab('members')}
                          >
                            View all {members.length} members
                          </Button>
                        )}
                      </CardContent>
                    </Card>

                    {/* Quick Actions for Admins */}
                    {isAdmin && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full justify-start"
                            onClick={() => setActiveTab('create')}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Quest
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full justify-start"
                            onClick={() => setActiveTab('hire')}
                          >
                            <Search className="h-4 w-4 mr-2" />
                            Find a Creator
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full justify-start"
                            onClick={handleCopyInviteLink}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Invite Members
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Quests Tab */}
              <TabsContent value="quests" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-display font-semibold">Organization Quests</h2>
                  {(isAdmin || memberRole === 'creator') && (
                    <Button onClick={() => setActiveTab('create')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Quest
                    </Button>
                  )}
                </div>

                {orgQuests.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No quests yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first quest for org members to join!
                      </p>
                      {(isAdmin || memberRole === 'creator') && (
                        <Button onClick={() => setActiveTab('create')}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Quest
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {orgQuests.map((quest) => (
                      <Card key={quest.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <span className="text-3xl">{quest.icon || '🎯'}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{quest.title}</h3>
                                <Badge variant={quest.status === 'open' ? 'default' : 'secondary'}>
                                  {quest.status}
                                </Badge>
                                {quest.visibility === 'org_only' && (
                                  <Badge variant="outline">Org Only</Badge>
                                )}
                              </div>
                              {quest.title && quest.icon && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {quest.progression_tree || 'Quest'}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {quest.start_datetime && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(quest.start_datetime), 'MMM d, h:mm a')}
                                  </span>
                                )}
                                {quest.meeting_location_name && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {quest.meeting_location_name}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              {isAdmin && quest.status === 'open' && (
                                <SendQuestToMembersButton
                                  orgId={org.id}
                                  orgName={org.name}
                                  questId={quest.id}
                                  questTitle={quest.title}
                                  memberCount={members.length}
                                  variant="outline"
                                  size="sm"
                                />
                              )}
                              <Button variant="outline" size="sm" asChild>
                                <Link to={`/quests/${quest.slug}`}>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Members Tab */}
              <TabsContent value="members" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-display font-semibold">
                    Members ({members.length})
                  </h2>
                  <Button variant="outline" onClick={handleCopyInviteLink}>
                    <Send className="h-4 w-4 mr-2" />
                    Invite Members
                  </Button>
                </div>

                <div className="grid gap-3">
                  {members.map((member) => (
                    <Card key={member.profile_id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="text-lg">
                              {member.profile?.display_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <DisplayNameWithBadges
                              displayName={member.profile?.display_name || 'Member'}
                              preferences={member.profile?.preferences}
                              className="font-medium"
                            />
                            <p className="text-sm text-muted-foreground">
                              Joined {format(new Date(member.joined_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                            {member.role === 'admin' ? 'Admin' : 
                             member.role === 'creator' ? 'Creator' : 'Member'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {isMember && !isAdmin && (
                  <div className="pt-4 border-t">
                    <Button variant="ghost" className="text-destructive" onClick={handleLeaveOrg}>
                      Leave Organization
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Create Quest Tab */}
              {(isAdmin || memberRole === 'creator') && (
                <TabsContent value="create" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Create Quest for {org.name}</CardTitle>
                      <CardDescription>
                        Create a quest exclusively for your organization members
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">
                        Use our Quest Builder to create a custom quest for your org. 
                        The quest will be automatically linked to {org.name} and visible only to members.
                      </p>
                      <Button asChild>
                        <Link to={`/creator/quests/new?org=${org.id}&visibility=org_only`}>
                          <Plus className="h-4 w-4 mr-2" />
                          Open Quest Builder
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {/* Hire a Creator Tab */}
              {isAdmin && (
                <TabsContent value="hire" className="space-y-6">
                  <div>
                    <h2 className="text-xl font-display font-semibold mb-2">Find a Quest Creator</h2>
                    <p className="text-muted-foreground">
                      Browse verified creators who can design and lead custom quests for your organization
                    </p>
                  </div>

                  {creators.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="py-12 text-center">
                        <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No creators available</h3>
                        <p className="text-muted-foreground">
                          Check back soon for verified quest creators
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {creators.map((creator) => (
                        <Card key={creator.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <Avatar className="h-14 w-14">
                                <AvatarImage src={creator.photo_url || undefined} />
                                <AvatarFallback className="text-lg">
                                  {creator.display_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold">{creator.display_name}</h3>
                                {creator.bio && (
                                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                    {creator.bio}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                              <Button variant="outline" size="sm" asChild className="flex-1">
                                <Link to={`/creators/${creator.slug}`}>View Profile</Link>
                              </Button>
                              <Button 
                                size="sm" 
                                className="flex-1"
                                onClick={() => {
                                  setSelectedCreator(creator);
                                  setIsRequestModalOpen(true);
                                }}
                              >
                                <Sparkles className="h-4 w-4 mr-2" />
                                Request Quest
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>
          </div>
        </section>
      </main>

      <Footer />

      {/* Join Modal */}
      <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join {org.name}</DialogTitle>
            <DialogDescription>
              Become a member to access exclusive quests and connect with fellow members.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-bold"
                style={{ backgroundColor: org.primary_color || '#14B8A6' }}
              >
                {isUTAustin ? '🤘' : org.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium">{org.name}</p>
                <p className="text-sm text-muted-foreground">{members.length} members</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowJoinModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleJoinOrg} disabled={isJoining}>
              {isJoining && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Join Organization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Creator Modal */}
      {selectedCreator && org && (
        <OrgCreatorRequestModal
          isOpen={isRequestModalOpen}
          onClose={() => {
            setIsRequestModalOpen(false);
            setSelectedCreator(null);
          }}
          creator={selectedCreator}
          org={{ id: org.id, name: org.name }}
          memberCount={members.length}
        />
      )}
    </div>
  );
}
