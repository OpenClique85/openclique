import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, Check, Users, Gift, Calendar, MessageSquare, ArrowLeft, 
  Filter, Trophy, Shield, Megaphone, UserPlus, AlertTriangle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotifications, useMarkAsRead, useMarkAllAsRead, type Notification } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

// Extended notification types for broader coverage
const notificationIcons: Record<string, React.ReactNode> = {
  quest_recommendation: <Gift className="h-5 w-5 text-primary" />,
  quest_shared: <Users className="h-5 w-5 text-purple-500" />,
  referral_accepted: <UserPlus className="h-5 w-5 text-emerald-500" />,
  signup_confirmed: <Check className="h-5 w-5 text-emerald-500" />,
  quest_reminder: <Calendar className="h-5 w-5 text-amber-500" />,
  general: <MessageSquare className="h-5 w-5 text-muted-foreground" />,
  // Sponsorship types
  sponsorship_proposal_received: <Megaphone className="h-5 w-5 text-blue-500" />,
  sponsorship_proposal_accepted: <Check className="h-5 w-5 text-emerald-500" />,
  sponsorship_proposal_declined: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  sponsored_quest_approved: <Trophy className="h-5 w-5 text-primary" />,
  sponsor_quest_completed: <Trophy className="h-5 w-5 text-emerald-500" />,
  // Squad/clique types
  squad_invite: <Users className="h-5 w-5 text-purple-500" />,
  clique_message: <MessageSquare className="h-5 w-5 text-blue-500" />,
  ready_check: <Bell className="h-5 w-5 text-amber-500" />,
  // Admin types
  admin_message: <Shield className="h-5 w-5 text-red-500" />,
};

const typeLabels: Record<string, string> = {
  quest_recommendation: 'Recommended',
  quest_shared: 'Shared with you',
  referral_accepted: 'Friend joined',
  signup_confirmed: 'Confirmed',
  quest_reminder: 'Reminder',
  general: 'Update',
  sponsorship_proposal_received: 'Proposal',
  sponsorship_proposal_accepted: 'Accepted',
  sponsorship_proposal_declined: 'Declined',
  sponsored_quest_approved: 'Approved',
  sponsor_quest_completed: 'Completed',
  squad_invite: 'Squad Invite',
  clique_message: 'Clique',
  ready_check: 'Ready Check',
  admin_message: 'Admin',
};

// Filter categories
type FilterCategory = 'all' | 'quests' | 'social' | 'sponsorship' | 'admin';

const FILTER_CONFIG: Record<FilterCategory, { label: string; types: string[] }> = {
  all: { 
    label: 'All', 
    types: [] 
  },
  quests: { 
    label: 'Quests', 
    types: ['quest_recommendation', 'quest_shared', 'signup_confirmed', 'quest_reminder'] 
  },
  social: { 
    label: 'Social', 
    types: ['referral_accepted', 'squad_invite', 'clique_message', 'ready_check'] 
  },
  sponsorship: { 
    label: 'Sponsorship', 
    types: ['sponsorship_proposal_received', 'sponsorship_proposal_accepted', 'sponsorship_proposal_declined', 'sponsored_quest_approved', 'sponsor_quest_completed'] 
  },
  admin: { 
    label: 'Admin', 
    types: ['admin_message', 'general'] 
  },
};

export default function Notifications() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { data: notifications = [], isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  
  // Apply filters
  const filteredNotifications = notifications.filter(n => {
    // Unread filter
    if (showUnreadOnly && n.read_at) return false;
    
    // Category filter
    if (activeFilter !== 'all') {
      const allowedTypes = FILTER_CONFIG[activeFilter].types;
      if (!allowedTypes.includes(n.type)) return false;
    }
    
    return true;
  });
  
  const unreadCount = notifications.filter(n => !n.read_at).length;
  const filteredUnreadCount = filteredNotifications.filter(n => !n.read_at).length;
  
  // Count by category for badges
  const categoryCounts = Object.entries(FILTER_CONFIG).reduce((acc, [key, config]) => {
    if (key === 'all') {
      acc[key] = notifications.filter(n => !n.read_at).length;
    } else {
      acc[key as FilterCategory] = notifications.filter(
        n => config.types.includes(n.type) && !n.read_at
      ).length;
    }
    return acc;
  }, {} as Record<FilterCategory, number>);
  
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read_at) {
      markAsRead.mutate(notification.id);
    }
    
    if (notification.quest_id) {
      navigate('/quests');
    }
  };
  
  if (authLoading) {
    return (
      <div className="min-h-dvh flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </main>
        <Footer />
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="min-h-dvh flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sign in to see notifications</h1>
          <p className="text-muted-foreground mb-6">
            Get notified about quest recommendations and updates from friends.
          </p>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-dvh flex flex-col bg-background pb-20 md:pb-0">
      <Navbar />
      
      <main className="flex-1 py-6 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Notifications</h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {unreadCount} unread
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showUnreadOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              >
                <Filter className="h-4 w-4 mr-1" />
                Unread
              </Button>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={() => markAllAsRead.mutate()}>
                  <Check className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Mark all read</span>
                </Button>
              )}
            </div>
          </div>
          
          {/* Category Filters */}
          <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as FilterCategory)} className="mb-4">
            <TabsList className="w-full justify-start overflow-x-auto">
              {Object.entries(FILTER_CONFIG).map(([key, config]) => (
                <TabsTrigger 
                  key={key} 
                  value={key}
                  className="relative"
                >
                  {config.label}
                  {categoryCounts[key as FilterCategory] > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="ml-1.5 h-5 min-w-[20px] px-1.5 text-xs"
                    >
                      {categoryCounts[key as FilterCategory]}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          
          {/* Notifications List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 flex flex-col items-center text-center">
                <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg mb-2">
                  {showUnreadOnly || activeFilter !== 'all' 
                    ? 'No matching notifications' 
                    : 'No notifications yet'}
                </h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  {showUnreadOnly 
                    ? "You're all caught up! No unread notifications."
                    : activeFilter !== 'all'
                      ? `No ${FILTER_CONFIG[activeFilter].label.toLowerCase()} notifications yet.`
                      : "You'll receive notifications when admins recommend quests for you or when friends share quests with you."}
                </p>
                {activeFilter !== 'all' || showUnreadOnly ? (
                  <Button 
                    variant="outline" 
                    className="mt-6"
                    onClick={() => {
                      setActiveFilter('all');
                      setShowUnreadOnly(false);
                    }}
                  >
                    View All Notifications
                  </Button>
                ) : (
                  <Link to="/quests" className="mt-6">
                    <Button>Browse Quests</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notification) => (
                <Card 
                  key={notification.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    !notification.read_at && "border-primary/30 bg-primary/5"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="mt-0.5 shrink-0">
                        {notificationIcons[notification.type] || notificationIcons.general}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className={cn(
                            "text-sm",
                            !notification.read_at && "font-semibold"
                          )}>
                            {notification.title}
                          </p>
                          <Badge variant="outline" className="shrink-0 text-xs">
                            {typeLabels[notification.type] || 'Update'}
                          </Badge>
                        </div>
                        {notification.body && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {notification.body}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                          {notification.quest_id && (
                            <span className="text-xs text-primary font-medium">
                              View Quest →
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
