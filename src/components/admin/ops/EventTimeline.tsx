import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useOpsEvents, useCorrelatedEvents, type OpsEventFilters } from '@/hooks/useOpsEvents';
import type { OpsEventType } from '@/lib/opsEvents';
import { 
  Activity, Filter, ChevronDown, Link2, Clock, User, 
  Map, Users, Target, RefreshCw
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const EVENT_TYPE_OPTIONS: { value: OpsEventType; label: string; color: string }[] = [
  { value: 'signup_created', label: 'Signup Created', color: 'bg-green-500' },
  { value: 'signup_status_changed', label: 'Signup Status Changed', color: 'bg-blue-500' },
  { value: 'signup_xp_awarded', label: 'Signup XP Awarded', color: 'bg-purple-500' },
  { value: 'squad_created', label: 'Squad Created', color: 'bg-teal-500' },
  { value: 'squad_member_added', label: 'Squad Member Added', color: 'bg-teal-400' },
  { value: 'squad_member_removed', label: 'Squad Member Removed', color: 'bg-orange-500' },
  { value: 'quest_created', label: 'Quest Created', color: 'bg-indigo-500' },
  { value: 'quest_published', label: 'Quest Published', color: 'bg-indigo-400' },
  { value: 'quest_status_changed', label: 'Quest Status Changed', color: 'bg-indigo-300' },
  { value: 'xp_awarded', label: 'XP Awarded', color: 'bg-yellow-500' },
  { value: 'achievement_unlocked', label: 'Achievement Unlocked', color: 'bg-amber-500' },
  { value: 'notification_sent', label: 'Notification Sent', color: 'bg-cyan-500' },
  { value: 'notification_failed', label: 'Notification Failed', color: 'bg-red-500' },
  { value: 'email_sent', label: 'Email Sent', color: 'bg-cyan-400' },
  { value: 'email_failed', label: 'Email Failed', color: 'bg-red-400' },
  { value: 'admin_action', label: 'Admin Action', color: 'bg-slate-500' },
  { value: 'manual_override', label: 'Manual Override', color: 'bg-rose-500' },
];

export function EventTimeline() {
  const [filters, setFilters] = useState<OpsEventFilters>({ limit: 50 });
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [correlationId, setCorrelationId] = useState<string | null>(null);
  
  const { data: events, isLoading, refetch } = useOpsEvents(filters);
  const { data: correlatedEvents } = useCorrelatedEvents(correlationId);
  
  const updateFilter = (key: keyof OpsEventFilters, value: string | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
  };
  
  const clearFilters = () => {
    setFilters({ limit: 50 });
  };
  
  const getEventColor = (eventType: OpsEventType) => {
    return EVENT_TYPE_OPTIONS.find(e => e.value === eventType)?.color || 'bg-gray-500';
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Event Timeline
              </CardTitle>
              <CardDescription>
                Unified view of all operational events with filtering and correlation tracking
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="mb-4">
                <Filter className="h-4 w-4 mr-1" />
                Filters
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs">Event Type</Label>
                  <Select
                    value={filters.eventType || ''}
                    onValueChange={(v) => updateFilter('eventType', v as OpsEventType)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      {EVENT_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">User ID</Label>
                  <Input
                    className="h-8"
                    placeholder="Filter by user..."
                    value={filters.userId || ''}
                    onChange={(e) => updateFilter('userId', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Quest ID</Label>
                  <Input
                    className="h-8"
                    placeholder="Filter by quest..."
                    value={filters.questId || ''}
                    onChange={(e) => updateFilter('questId', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Squad ID</Label>
                  <Input
                    className="h-8"
                    placeholder="Filter by squad..."
                    value={filters.squadId || ''}
                    onChange={(e) => updateFilter('squadId', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Org ID</Label>
                  <Input
                    className="h-8"
                    placeholder="Filter by org..."
                    value={filters.orgId || ''}
                    onChange={(e) => updateFilter('orgId', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Correlation ID</Label>
                  <Input
                    className="h-8"
                    placeholder="Filter by correlation..."
                    value={filters.correlationId || ''}
                    onChange={(e) => updateFilter('correlationId', e.target.value)}
                  />
                </div>
                <div className="col-span-2 flex items-end">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
          
          {/* Event List */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading events...</div>
          ) : events && events.length > 0 ? (
            <div className="space-y-2">
              {events.map((event) => (
                <div 
                  key={event.id} 
                  className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer"
                  onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${getEventColor(event.event_type)}`} />
                      <Badge variant="outline" className="text-xs font-mono">
                        {event.event_type}
                      </Badge>
                      {event.user_id && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {event.user_id.slice(0, 8)}...
                        </span>
                      )}
                      {event.quest_id && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Map className="h-3 w-3" />
                          {event.quest_id.slice(0, 8)}...
                        </span>
                      )}
                      {event.squad_id && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {event.squad_id.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {event.correlation_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCorrelationId(event.correlation_id);
                          }}
                        >
                          <Link2 className="h-3 w-3 mr-1" />
                          Chain
                        </Button>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  
                  {expandedEvent === event.id && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Before State</Label>
                          <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                            {event.before_state ? JSON.stringify(event.before_state, null, 2) : 'null'}
                          </pre>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">After State</Label>
                          <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                            {event.after_state ? JSON.stringify(event.after_state, null, 2) : 'null'}
                          </pre>
                        </div>
                      </div>
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Metadata</Label>
                          <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                            {JSON.stringify(event.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Actor: {event.actor_type || 'system'}</span>
                        {event.actor_user_id && <span>By: {event.actor_user_id.slice(0, 8)}...</span>}
                        <span>At: {format(new Date(event.created_at), 'PPpp')}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No events found. Events will appear here as they occur.
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Correlation Chain Modal */}
      {correlationId && correlatedEvents && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Correlated Events ({correlatedEvents.length})
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setCorrelationId(null)}>
                Close
              </Button>
            </div>
            <CardDescription className="font-mono text-xs">
              Correlation ID: {correlationId}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {correlatedEvents.map((event, idx) => (
                <div key={event.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                  <span className="text-xs text-muted-foreground w-6">{idx + 1}</span>
                  <div className={`w-2 h-2 rounded-full ${getEventColor(event.event_type)}`} />
                  <Badge variant="outline" className="text-xs">{event.event_type}</Badge>
                  <span className="text-xs text-muted-foreground flex-1">
                    {format(new Date(event.created_at), 'HH:mm:ss.SSS')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
