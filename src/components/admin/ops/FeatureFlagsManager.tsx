import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  useFeatureFlags, 
  useCreateFeatureFlag, 
  useUpdateFeatureFlag, 
  useDeleteFeatureFlag,
  useFeatureFlagAudit 
} from '@/hooks/useFeatureFlags';
import { toast } from 'sonner';
import { 
  Flag, Plus, Trash2, History, ChevronDown, 
  Loader2, ToggleLeft, Users, Percent
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function FeatureFlagsManager() {
  const { data: flags, isLoading } = useFeatureFlags();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5" />
                Feature Flags
              </CardTitle>
              <CardDescription>
                Control feature rollouts with global and cohort targeting
              </CardDescription>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  New Flag
                </Button>
              </DialogTrigger>
              <CreateFlagDialog onClose={() => setIsCreateOpen(false)} />
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading flags...</div>
          ) : flags && flags.length > 0 ? (
            <div className="space-y-4">
              {flags.map((flag) => (
                <FlagCard key={flag.id} flag={flag} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No feature flags configured. Create one to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface FlagCardProps {
  flag: {
    id: string;
    key: string;
    name: string;
    description: string | null;
    is_enabled: boolean;
    target_roles: string[] | null;
    target_org_ids: string[] | null;
    target_user_ids: string[] | null;
    rollout_percentage: number;
    created_at: string;
    updated_at: string;
  };
}

function FlagCard({ flag }: FlagCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const updateFlag = useUpdateFeatureFlag();
  const deleteFlag = useDeleteFeatureFlag();
  const { data: auditLog } = useFeatureFlagAudit(showAudit ? flag.id : '');
  
  const handleToggle = async (enabled: boolean) => {
    try {
      await updateFlag.mutateAsync({ id: flag.id, is_enabled: enabled });
      toast.success(`Flag ${enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      toast.error('Failed to update flag');
    }
  };
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this flag?')) return;
    
    try {
      await deleteFlag.mutateAsync(flag.id);
      toast.success('Flag deleted');
    } catch (err) {
      toast.error('Failed to delete flag');
    }
  };
  
  const hasTargeting = (flag.target_roles?.length || 0) > 0 || 
                       (flag.target_org_ids?.length || 0) > 0 || 
                       (flag.target_user_ids?.length || 0) > 0 ||
                       flag.rollout_percentage < 100;
  
  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className={flag.is_enabled ? 'border-green-500/30' : 'border-muted'}>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch
                checked={flag.is_enabled}
                onCheckedChange={handleToggle}
                disabled={updateFlag.isPending}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium">{flag.key}</span>
                  {flag.is_enabled ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600">On</Badge>
                  ) : (
                    <Badge variant="outline">Off</Badge>
                  )}
                  {hasTargeting && (
                    <Badge variant="secondary" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      Targeted
                    </Badge>
                  )}
                  {flag.rollout_percentage < 100 && (
                    <Badge variant="secondary" className="text-xs">
                      <Percent className="h-3 w-3 mr-1" />
                      {flag.rollout_percentage}%
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{flag.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {flag.description && (
              <p className="text-sm text-muted-foreground">{flag.description}</p>
            )}
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Rollout Percentage</Label>
                <p className="font-medium">{flag.rollout_percentage}%</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Created</Label>
                <p className="font-medium">{formatDistanceToNow(new Date(flag.created_at), { addSuffix: true })}</p>
              </div>
            </div>
            
            {hasTargeting && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Targeting</Label>
                <div className="flex flex-wrap gap-2">
                  {flag.target_roles?.map((role) => (
                    <Badge key={role} variant="outline">{role}</Badge>
                  ))}
                  {flag.target_user_ids?.slice(0, 3).map((userId) => (
                    <Badge key={userId} variant="outline" className="font-mono text-xs">
                      user: {userId.slice(0, 8)}...
                    </Badge>
                  ))}
                  {(flag.target_user_ids?.length || 0) > 3 && (
                    <Badge variant="outline">+{(flag.target_user_ids?.length || 0) - 3} more</Badge>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex gap-2 pt-2 border-t">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowAudit(!showAudit)}
              >
                <History className="h-4 w-4 mr-1" />
                Audit Log
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDelete}
                disabled={deleteFlag.isPending}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
            
            {showAudit && auditLog && (
              <div className="border rounded p-3 bg-muted/30 space-y-2">
                <Label className="text-xs text-muted-foreground">Change History</Label>
                {auditLog.length > 0 ? (
                  <div className="space-y-1 max-h-40 overflow-auto">
                    {auditLog.map((entry: any) => (
                      <div key={entry.id} className="text-xs flex justify-between p-1 hover:bg-muted rounded">
                        <span>
                          {entry.old_state?.is_enabled !== entry.new_state?.is_enabled && (
                            <span>Toggled {entry.new_state?.is_enabled ? 'on' : 'off'}</span>
                          )}
                          {entry.old_state === null && <span>Created</span>}
                        </span>
                        <span className="text-muted-foreground">
                          {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No changes recorded</p>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function CreateFlagDialog({ onClose }: { onClose: () => void }) {
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [rollout, setRollout] = useState([100]);
  
  const createFlag = useCreateFeatureFlag();
  
  const handleSubmit = async () => {
    if (!key || !name) {
      toast.error('Key and name are required');
      return;
    }
    
    // Validate key format
    if (!/^[a-z][a-z0-9_]*$/.test(key)) {
      toast.error('Key must be lowercase, start with a letter, and contain only letters, numbers, and underscores');
      return;
    }
    
    try {
      await createFlag.mutateAsync({
        key,
        name,
        description: description || undefined,
        is_enabled: isEnabled,
        rollout_percentage: rollout[0],
      });
      toast.success('Flag created');
      onClose();
    } catch (err: any) {
      if (err.message?.includes('duplicate')) {
        toast.error('A flag with this key already exists');
      } else {
        toast.error('Failed to create flag');
      }
    }
  };
  
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create Feature Flag</DialogTitle>
        <DialogDescription>
          Create a new feature flag for controlled rollouts
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label>Key</Label>
          <Input
            placeholder="my_feature_flag"
            value={key}
            onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground mt-1">Lowercase, underscores only. Used in code.</p>
        </div>
        <div>
          <Label>Name</Label>
          <Input
            placeholder="My Feature Flag"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea
            placeholder="What does this flag control?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>Enabled by default</Label>
          <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
        </div>
        <div>
          <Label>Rollout Percentage: {rollout[0]}%</Label>
          <Slider
            value={rollout}
            onValueChange={setRollout}
            max={100}
            step={5}
            className="mt-2"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={createFlag.isPending}>
          {createFlag.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
          Create Flag
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
