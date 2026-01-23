import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Search, Shield, Users, Crown, Briefcase, Palette, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user' | 'quest_creator' | 'sponsor';
  created_at?: string;
}

interface RolePermission {
  role: string;
  icon: React.ReactNode;
  color: string;
  permissions: string[];
  description: string;
}

interface UserWithRoles {
  id: string;
  email: string | null;
  display_name: string;
  created_at: string;
  roles: UserRole[];
}

const ROLE_DEFINITIONS: RolePermission[] = [
  {
    role: 'admin',
    icon: <Crown className="h-4 w-4" />,
    color: 'bg-red-500/10 text-red-600 border-red-500/20',
    description: 'Full platform access',
    permissions: [
      'View all users and profiles',
      'Manage all quests and signups',
      'Create and modify squads',
      'Grant/revoke user roles',
      'Access admin console',
      'View analytics and reports',
      'Manage feature flags',
      'Shadow mode access',
      'Manual overrides',
      'View PII access logs',
    ],
  },
  {
    role: 'quest_creator',
    icon: <Palette className="h-4 w-4" />,
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    description: 'Create and manage quests',
    permissions: [
      'Create new quests',
      'Edit own quests',
      'View signup analytics',
      'Access creator portal',
      'Apply to sponsor listings',
      'View creator earnings',
    ],
  },
  {
    role: 'sponsor',
    icon: <Briefcase className="h-4 w-4" />,
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    description: 'Sponsor quests and venues',
    permissions: [
      'Create sponsor listings',
      'Manage venues and rewards',
      'Review creator applications',
      'Access sponsor portal',
      'View sponsorship analytics',
      'Send proposals to organizations',
    ],
  },
  {
    role: 'user',
    icon: <Users className="h-4 w-4" />,
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    description: 'Standard participant',
    permissions: [
      'Sign up for quests',
      'Join squads',
      'Earn XP and achievements',
      'Submit feedback',
      'Create support tickets',
      'View own profile',
    ],
  },
];

export function RBACInspector() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Fetch all users with roles for the permission matrix
  const { data: usersWithRoles, isLoading: isLoadingUsers } = useQuery<UserWithRoles[]>({
    queryKey: ['admin-users-with-roles'],
    queryFn: async () => {
      // Get all profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, display_name, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (profileError) throw profileError;

      // Get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine data
      return profiles?.map(profile => ({
        ...profile,
        roles: (roles as UserRole[])?.filter(r => r.user_id === profile.id) || [],
      })) || [];
    },
  });

  // Search for specific user
  const { data: searchResults, isLoading: isSearching, refetch: searchUser } = useQuery<UserWithRoles[] | null>({
    queryKey: ['admin-user-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return null;

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, display_name, created_at')
        .or(`email.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%,id.eq.${searchQuery.length === 36 ? searchQuery : '00000000-0000-0000-0000-000000000000'}`)
        .limit(10);

      if (error) throw error;

      // Get roles for found users
      if (profiles && profiles.length > 0) {
        const userIds = profiles.map(p => p.id);
        const { data: roles } = await supabase
          .from('user_roles')
          .select('*')
          .in('user_id', userIds);

        return profiles.map(profile => ({
          ...profile,
          roles: (roles as UserRole[])?.filter(r => r.user_id === profile.id) || [],
        })) as UserWithRoles[];
      }

      return [] as UserWithRoles[];
    },
    enabled: false,
  });

  // Get detailed info for selected user
  const { data: selectedUserDetails } = useQuery({
    queryKey: ['admin-user-details', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return null;

      const [profileResult, rolesResult, signupsResult, xpResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', selectedUserId).single(),
        supabase.from('user_roles').select('*').eq('user_id', selectedUserId),
        supabase.from('quest_signups').select('id').eq('user_id', selectedUserId),
        supabase.from('user_xp').select('total_xp').eq('user_id', selectedUserId).single(),
      ]);

      // Log PII access
      await supabase.rpc('log_pii_access', {
        p_access_type: 'rbac_inspection',
        p_target_user_id: selectedUserId,
        p_target_table: 'profiles',
        p_accessed_fields: ['email', 'display_name'],
        p_reason: 'RBAC permission inspection',
      });

      return {
        profile: profileResult.data,
        roles: rolesResult.data as UserRole[] || [],
        signupCount: signupsResult.data?.length || 0,
        totalXp: xpResult.data?.total_xp || 0,
      };
    },
    enabled: !!selectedUserId,
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchUser();
    }
  };

  const getRoleBadge = (role: string) => {
    const def = ROLE_DEFINITIONS.find(r => r.role === role);
    if (!def) return <Badge variant="outline">{role}</Badge>;
    
    return (
      <Badge variant="outline" className={def.color}>
        {def.icon}
        <span className="ml-1">{role}</span>
      </Badge>
    );
  };

  const usersToDisplay: UserWithRoles[] = (searchResults && searchResults.length > 0 ? searchResults : usersWithRoles) || [];

  return (
    <div className="space-y-6">
      {/* Permission Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permission Matrix
          </CardTitle>
          <CardDescription>
            Overview of all roles and their granted permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {ROLE_DEFINITIONS.map((def) => (
              <Card key={def.role} className="border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={def.color}>
                        {def.icon}
                        <span className="ml-1 capitalize">{def.role.replace('_', ' ')}</span>
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="text-xs">{def.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-1">
                    {def.permissions.map((perm, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        {perm}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Lookup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" />
            User Role Lookup
          </CardTitle>
          <CardDescription>
            Search for a user to inspect their roles and permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search by email, name, or user ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : usersToDisplay && usersToDisplay.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersToDisplay.map((user) => (
                    <TableRow 
                      key={user.id}
                      className={selectedUserId === user.id ? 'bg-muted/50' : ''}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{user.display_name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <span key={role.id}>{getRoleBadge(role.role)}</span>
                            ))
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              <XCircle className="h-3 w-3 mr-1" />
                              No roles
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedUserId(selectedUserId === user.id ? null : user.id)}
                        >
                          {selectedUserId === user.id ? 'Hide' : 'Details'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : searchQuery && !isSearching ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found matching "{searchQuery}"
            </div>
          ) : null}

          {/* Selected User Details */}
          {selectedUserId && selectedUserDetails && (
            <Card className="mt-4 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  User Details: {selectedUserDetails.profile?.display_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-mono">{selectedUserDetails.profile?.email || 'N/A'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Total XP</p>
                    <p className="text-sm font-semibold">{selectedUserDetails.totalXp}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Quest Signups</p>
                    <p className="text-sm font-semibold">{selectedUserDetails.signupCount}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Role Count</p>
                    <p className="text-sm font-semibold">{selectedUserDetails.roles.length}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Assigned Roles & Permissions</h4>
                  {selectedUserDetails.roles.length > 0 ? (
                    <div className="space-y-3">
                      {selectedUserDetails.roles.map((userRole) => {
                        const def = ROLE_DEFINITIONS.find(r => r.role === userRole.role);
                        return (
                          <div key={userRole.id} className="p-3 rounded-lg border">
                            <div className="flex items-center gap-2 mb-2">
                              {getRoleBadge(userRole.role)}
                            </div>
                            {def && (
                              <ul className="grid grid-cols-2 gap-1">
                                {def.permissions.map((perm, idx) => (
                                  <li key={idx} className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                                    {perm}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      This user has no special roles. They have standard user permissions.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
