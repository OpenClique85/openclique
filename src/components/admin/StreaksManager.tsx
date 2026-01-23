/**
 * =============================================================================
 * STREAKS MANAGER - Admin control for streak rules
 * =============================================================================
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Loader2, Plus, Pencil, Trash2, Flame, Calendar } from 'lucide-react';

interface StreakRule {
  id: string;
  name: string;
  interval: 'weekly' | 'monthly';
  grace_periods: number;
  xp_bonus: number;
  is_active: boolean;
  created_at: string;
}

interface FormData {
  name: string;
  interval: 'weekly' | 'monthly';
  grace_periods: number;
  xp_bonus: number;
  is_active: boolean;
}

const defaultFormData: FormData = {
  name: '',
  interval: 'weekly',
  grace_periods: 1,
  xp_bonus: 25,
  is_active: true,
};

export function StreaksManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingStreak, setEditingStreak] = useState<StreakRule | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  const { data: streakRules, isLoading } = useQuery({
    queryKey: ['admin-streak-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('streak_rules')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as StreakRule[];
    },
  });

  // Fetch user streak stats
  const { data: userStreaks } = useQuery({
    queryKey: ['admin-user-streaks-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_streaks')
        .select('streak_rule_id, current_count');
      
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        name: data.name,
        interval: data.interval,
        grace_periods: data.grace_periods,
        xp_bonus: data.xp_bonus,
        is_active: data.is_active,
      };

      if (editingStreak) {
        const { error } = await supabase
          .from('streak_rules')
          .update(payload)
          .eq('id', editingStreak.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('streak_rules')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-streak-rules'] });
      toast({ title: editingStreak ? 'Streak rule updated' : 'Streak rule created' });
      setShowModal(false);
      setEditingStreak(null);
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Failed to save', description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('streak_rules')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-streak-rules'] });
      toast({ title: 'Streak rule deleted' });
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Failed to delete', description: error.message });
    },
  });

  const handleOpenModal = (streak?: StreakRule) => {
    if (streak) {
      setEditingStreak(streak);
      setFormData({
        name: streak.name,
        interval: streak.interval,
        grace_periods: streak.grace_periods,
        xp_bonus: streak.xp_bonus,
        is_active: streak.is_active,
      });
    } else {
      setEditingStreak(null);
      setFormData(defaultFormData);
    }
    setShowModal(true);
  };

  const getActiveStreakCount = (ruleId: string) => {
    return userStreaks?.filter(s => s.streak_rule_id === ruleId && s.current_count > 0).length ?? 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Streak Rules</h2>
          <p className="text-sm text-muted-foreground">
            Configure consistency rewards (Duolingo-style, not stressful)
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Streak Rule
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Flame className="h-8 w-8 text-primary shrink-0" />
            <div>
              <h3 className="font-medium mb-1">Streak Philosophy</h3>
              <p className="text-sm text-muted-foreground">
                Streaks reward <strong>consistency over volume</strong>. We use weekly/monthly intervals 
                with grace periods to avoid daily pressure. Language should be encouraging, never shaming.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Streak Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Interval</TableHead>
                <TableHead>Grace Periods</TableHead>
                <TableHead>XP Bonus</TableHead>
                <TableHead>Active Users</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {streakRules?.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      <Calendar className="h-3 w-3 mr-1" />
                      {rule.interval}
                    </Badge>
                  </TableCell>
                  <TableCell>{rule.grace_periods} {rule.interval === 'weekly' ? 'week' : 'month'}(s)</TableCell>
                  <TableCell>
                    <Badge variant="secondary">+{rule.xp_bonus} XP</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      {getActiveStreakCount(rule.id)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenModal(rule)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(rule.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {streakRules?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No streak rules defined yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Form Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingStreak ? 'Edit Streak Rule' : 'New Streak Rule'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Weekly Adventurer"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Interval</Label>
                <Select
                  value={formData.interval}
                  onValueChange={(v: 'weekly' | 'monthly') => 
                    setFormData(prev => ({ ...prev, interval: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Grace Periods</Label>
                <Input
                  type="number"
                  min="0"
                  max="4"
                  value={formData.grace_periods}
                  onChange={(e) => setFormData(prev => ({ ...prev, grace_periods: parseInt(e.target.value) || 0 }))}
                />
                <p className="text-xs text-muted-foreground">
                  How many intervals can be missed without breaking streak
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>XP Bonus</Label>
              <Input
                type="number"
                min="0"
                value={formData.xp_bonus}
                onChange={(e) => setFormData(prev => ({ ...prev, xp_bonus: parseInt(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">
                Bonus XP awarded each time the streak continues
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_active: v }))}
              />
              <Label className="text-sm">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate(formData)}
              disabled={saveMutation.isPending || !formData.name}
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingStreak ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
