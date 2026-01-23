/**
 * Bulk Status Update Dialog
 * 
 * Allows admins to update multiple quest instance statuses at once.
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ArrowRight, AlertTriangle } from 'lucide-react';
import type { Enums } from '@/integrations/supabase/types';

type InstanceStatus = Enums<'instance_status'>;

interface Instance {
  id: string;
  instance_slug: string;
  title: string;
  icon: string;
  status: InstanceStatus;
  scheduled_date: string;
  start_time: string;
}

interface BulkStatusUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instances: Instance[];
}

const STATUS_OPTIONS: { value: InstanceStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: 'bg-muted text-muted-foreground' },
  { value: 'recruiting', label: 'Recruiting', color: 'bg-blue-500/20 text-blue-700' },
  { value: 'locked', label: 'Locked', color: 'bg-amber-500/20 text-amber-700' },
  { value: 'live', label: 'Live', color: 'bg-green-500/20 text-green-700' },
  { value: 'completed', label: 'Completed', color: 'bg-purple-500/20 text-purple-700' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-destructive/20 text-destructive' },
  { value: 'archived', label: 'Archived', color: 'bg-muted text-muted-foreground' },
];

export function BulkStatusUpdateDialog({
  open,
  onOpenChange,
  instances,
}: BulkStatusUpdateDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<InstanceStatus | 'all'>('all');
  const [targetStatus, setTargetStatus] = useState<InstanceStatus | ''>('');

  // Filter instances by current status
  const filteredInstances = instances.filter(
    (inst) => filterStatus === 'all' || inst.status === filterStatus
  );

  const toggleInstance = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredInstances.map((i) => i.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!targetStatus || selectedIds.size === 0) {
        throw new Error('Select instances and a target status');
      }

      const { error } = await supabase
        .from('quest_instances')
        .update({ status: targetStatus })
        .in('id', Array.from(selectedIds));

      if (error) throw error;
      return selectedIds.size;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['quest-instances'] });
      toast({
        title: 'Status updated!',
        description: `Updated ${count} instance${count !== 1 ? 's' : ''} to "${targetStatus}"`,
      });
      setSelectedIds(new Set());
      setTargetStatus('');
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({
        title: 'Failed to update',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const getStatusColor = (status: InstanceStatus) => {
    return STATUS_OPTIONS.find((s) => s.value === status)?.color || '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Status Update</DialogTitle>
          <DialogDescription>
            Select multiple instances and update their status at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Filter by status */}
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Label>Filter by current status</Label>
              <Select
                value={filterStatus}
                onValueChange={(v) => {
                  setFilterStatus(v as InstanceStatus | 'all');
                  setSelectedIds(new Set());
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 space-y-2">
              <Label>Change to</Label>
              <Select
                value={targetStatus}
                onValueChange={(v) => setTargetStatus(v as InstanceStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target status..." />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selection controls */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} of {filteredInstances.length} selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                Deselect All
              </Button>
            </div>
          </div>

          {/* Instance list */}
          <ScrollArea className="h-[300px] border rounded-lg">
            <div className="p-2 space-y-1">
              {filteredInstances.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No instances match the selected filter.
                </p>
              ) : (
                filteredInstances.map((instance) => (
                  <label
                    key={instance.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedIds.has(instance.id)}
                      onCheckedChange={() => toggleInstance(instance.id)}
                    />
                    <span className="text-lg">{instance.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{instance.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(instance.scheduled_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        @ {instance.start_time?.slice(0, 5)}
                      </p>
                    </div>
                    <Badge className={getStatusColor(instance.status)}>
                      {instance.status}
                    </Badge>
                  </label>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Preview */}
          {selectedIds.size > 0 && targetStatus && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm">
                {selectedIds.size} instance{selectedIds.size !== 1 ? 's' : ''} will be changed
              </span>
              <ArrowRight className="h-4 w-4" />
              <Badge className={getStatusColor(targetStatus as InstanceStatus)}>
                {targetStatus}
              </Badge>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending || selectedIds.size === 0 || !targetStatus}
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Update {selectedIds.size} Instance{selectedIds.size !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
