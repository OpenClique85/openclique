import { useState } from 'react';
import { Bell, Check, Users, Gift, Calendar, MessageSquare } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead, type Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

import { PartyPopper } from 'lucide-react';

const notificationIcons: Record<Notification['type'], React.ReactNode> = {
  quest_recommendation: <Gift className="h-4 w-4 text-primary" />,
  quest_shared: <Users className="h-4 w-4 text-purple-500" />,
  referral_accepted: <Users className="h-4 w-4 text-emerald-500" />,
  signup_confirmed: <Check className="h-4 w-4 text-emerald-500" />,
  quest_reminder: <Calendar className="h-4 w-4 text-amber-500" />,
  general: <MessageSquare className="h-4 w-4 text-muted-foreground" />,
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: notifications = [], isLoading } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  
  const recentNotifications = notifications.slice(0, 5);
  
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read_at) {
      markAsRead.mutate(notification.id);
    }
    
    if (notification.quest_id) {
      setOpen(false);
      navigate(`/quests`);
    }
  };
  
  const handleMarkAllRead = () => {
    markAllAsRead.mutate();
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7"
              onClick={handleMarkAllRead}
            >
              Mark all read
            </Button>
          )}
        </div>
        
        <ScrollArea className="max-h-[60vh] sm:max-h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Loading...
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                You'll be notified about quest recommendations and updates
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {recentNotifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors",
                    !notification.read_at && "bg-primary/5"
                  )}
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5">
                      {notificationIcons[notification.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm line-clamp-2",
                        !notification.read_at && "font-medium"
                      )}>
                        {notification.title}
                      </p>
                      {notification.body && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {notification.body}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.read_at && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 5 && (
          <>
            <Separator />
            <div className="p-2">
              <Link to="/notifications">
                <Button variant="ghost" className="w-full text-sm" onClick={() => setOpen(false)}>
                  View all notifications
                </Button>
              </Link>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
