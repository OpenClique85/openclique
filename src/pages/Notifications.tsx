import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, Users, Gift, Calendar, MessageSquare, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotifications, useMarkAsRead, useMarkAllAsRead, type Notification } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

const notificationIcons: Record<Notification['type'], React.ReactNode> = {
  quest_recommendation: <Gift className="h-5 w-5 text-primary" />,
  quest_shared: <Users className="h-5 w-5 text-purple-500" />,
  referral_accepted: <Users className="h-5 w-5 text-emerald-500" />,
  signup_confirmed: <Check className="h-5 w-5 text-emerald-500" />,
  quest_reminder: <Calendar className="h-5 w-5 text-amber-500" />,
  general: <MessageSquare className="h-5 w-5 text-muted-foreground" />,
};

const typeLabels: Record<Notification['type'], string> = {
  quest_recommendation: 'Recommended',
  quest_shared: 'Shared with you',
  referral_accepted: 'Friend joined',
  signup_confirmed: 'Confirmed',
  quest_reminder: 'Reminder',
  general: 'Update',
};

export default function Notifications() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { data: notifications = [], isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  
  const unreadCount = notifications.filter(n => !n.read_at).length;
  
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
      <div className="min-h-screen flex flex-col bg-background">
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
      <div className="min-h-screen flex flex-col bg-background">
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
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
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
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={() => markAllAsRead.mutate()}>
                <Check className="h-4 w-4 mr-2" />
                Mark all read
              </Button>
            )}
          </div>
          
          {/* Notifications List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 flex flex-col items-center text-center">
                <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg mb-2">No notifications yet</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  You'll receive notifications when admins recommend quests for you or when friends share quests with you.
                </p>
                <Link to="/quests" className="mt-6">
                  <Button>Browse Quests</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    !notification.read_at && "border-primary/30 bg-primary/5"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="mt-1">
                        {notificationIcons[notification.type]}
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
                            {typeLabels[notification.type]}
                          </Badge>
                        </div>
                        {notification.body && (
                          <p className="text-sm text-muted-foreground mb-2">
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
