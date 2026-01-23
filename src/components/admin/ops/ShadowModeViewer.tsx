import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useShadowMode, useShadowUserData, useShadowSessions } from '@/hooks/useShadowMode';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Eye, EyeOff, Search, User, MapPin, Trophy, Target, 
  Users, Bell, Ticket, ChevronDown, Clock, Shield, AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function ShadowModeViewer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [reason, setReason] = useState('');
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Array<{ id: string; email: string; display_name: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const { activeSession, startSession, endSession, isActive } = useShadowMode();
  const { data: userData, isLoading: isLoadingUser } = useShadowUserData(targetUserId);
  const { data: recentSessions } = useShadowSessions();
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, display_name')
        .or(`email.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .limit(10);
      
      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      toast.error('Search failed');
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleStartSession = async (userId: string) => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for this shadow session');
      return;
    }
    
    try {
      await startSession.mutateAsync({ targetUserId: userId, reason });
      setTargetUserId(userId);
      toast.success('Shadow session started');
    } catch (err) {
      toast.error('Failed to start shadow session');
    }
  };
  
  const handleEndSession = async () => {
    if (!activeSession) return;
    
    try {
      await endSession.mutateAsync(activeSession.id);
      setTargetUserId(null);
      setReason('');
      toast.success('Shadow session ended');
    } catch (err) {
      toast.error('Failed to end shadow session');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Active Session Warning Banner */}
      {isActive && (
        <Card className="border-amber-500 bg-amber-500/10">
          <CardContent className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-amber-500" />
              <span className="font-medium text-amber-700 dark:text-amber-400">
                SHADOW MODE ACTIVE
              </span>
              <span className="text-sm text-muted-foreground">
                Viewing user: {activeSession?.target_user_id.slice(0, 8)}...
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleEndSession}>
              <EyeOff className="h-4 w-4 mr-1" /> End Session
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Search Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Shadow Mode - Read-Only User View
          </CardTitle>
          <CardDescription>
            View a user's complete state for debugging. All access is logged.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search by email or display name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              <Search className="h-4 w-4 mr-1" />
              Search
            </Button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <Label>Search Results</Label>
              <div className="border rounded-md divide-y">
                {searchResults.map((user) => (
                  <div key={user.id} className="p-3 flex items-center justify-between hover:bg-muted/50">
                    <div>
                      <p className="font-medium">{user.display_name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setTargetUserId(user.id);
                        if (!isActive) {
                          handleStartSession(user.id);
                        }
                      }}
                      disabled={!reason.trim() && !isActive}
                    >
                      <Eye className="h-4 w-4 mr-1" /> View
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {!isActive && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Access (Required)</Label>
              <Textarea
                id="reason"
                placeholder="Describe why you need to view this user's data..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
              />
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* User Data View */}
      {targetUserId && userData && (
        <div className="space-y-4">
          {/* Profile */}
          <CollapsibleSection 
            title="Profile" 
            icon={<User className="h-4 w-4" />}
            defaultOpen
          >
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-60">
              {JSON.stringify(userData.profile, null, 2)}
            </pre>
          </CollapsibleSection>
          
          {/* XP & Gamification */}
          <CollapsibleSection 
            title="XP & Gamification" 
            icon={<Trophy className="h-4 w-4" />}
            badge={`${userData.xp?.total_xp || 0} XP`}
          >
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium mb-1">Total XP</h4>
                <pre className="text-xs bg-muted p-2 rounded">{JSON.stringify(userData.xp, null, 2)}</pre>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Tree XP ({userData.treeXp.length})</h4>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">{JSON.stringify(userData.treeXp, null, 2)}</pre>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Achievements ({userData.achievements.length})</h4>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">{JSON.stringify(userData.achievements, null, 2)}</pre>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Badges ({userData.badges.length})</h4>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">{JSON.stringify(userData.badges, null, 2)}</pre>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Streaks ({userData.streaks.length})</h4>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">{JSON.stringify(userData.streaks, null, 2)}</pre>
              </div>
            </div>
          </CollapsibleSection>
          
          {/* Signups */}
          <CollapsibleSection 
            title="Quest Signups" 
            icon={<Target className="h-4 w-4" />}
            badge={`${userData.signups.length} signups`}
          >
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-60">
              {JSON.stringify(userData.signups, null, 2)}
            </pre>
          </CollapsibleSection>
          
          {/* Squads */}
          <CollapsibleSection 
            title="Squad Memberships" 
            icon={<Users className="h-4 w-4" />}
            badge={`${userData.squads.length} squads`}
          >
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-60">
              {JSON.stringify(userData.squads, null, 2)}
            </pre>
          </CollapsibleSection>
          
          {/* Notifications */}
          <CollapsibleSection 
            title="Notifications" 
            icon={<Bell className="h-4 w-4" />}
            badge={`${userData.notifications.length} recent`}
          >
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-60">
              {JSON.stringify(userData.notifications, null, 2)}
            </pre>
          </CollapsibleSection>
          
          {/* Support Tickets */}
          <CollapsibleSection 
            title="Support Tickets" 
            icon={<Ticket className="h-4 w-4" />}
            badge={`${userData.tickets.length} tickets`}
          >
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-60">
              {JSON.stringify(userData.tickets, null, 2)}
            </pre>
          </CollapsibleSection>
        </div>
      )}
      
      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Shadow Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentSessions && recentSessions.length > 0 ? (
            <div className="space-y-2">
              {recentSessions.slice(0, 10).map((session) => (
                <div key={session.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                  <div>
                    <span className="font-mono text-xs">{session.target_user_id.slice(0, 8)}...</span>
                    <span className="text-muted-foreground ml-2">{session.reason}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(session.started_at), { addSuffix: true })}
                    </span>
                    {!session.ended_at && (
                      <Badge variant="outline" className="text-amber-600">Active</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No recent sessions</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper component
function CollapsibleSection({ 
  title, 
  icon, 
  badge, 
  children, 
  defaultOpen = false 
}: { 
  title: string; 
  icon: React.ReactNode; 
  badge?: string; 
  children: React.ReactNode; 
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                {icon}
                {title}
                {badge && <Badge variant="secondary" className="ml-2">{badge}</Badge>}
              </CardTitle>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
