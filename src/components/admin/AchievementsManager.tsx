/**
 * =============================================================================
 * ACHIEVEMENTS MANAGER - Admin control for achievement templates
 * =============================================================================
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Loader2, Plus, Pencil, Trash2, Trophy, Eye, EyeOff } from 'lucide-react';

interface AchievementCriteria {
  type: string;
  count?: number;
  tree?: string;
  amount?: number;
}

interface AchievementTemplate {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: string | null;
  criteria: AchievementCriteria;
  xp_reward: number;
  badge_id: string | null;
  is_hidden: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

interface FormData {
  name: string;
  description: string;
  icon: string;
  category: string;
  criteria_type: string;
  criteria_count: number;
  criteria_tree: string;
  xp_reward: number;
  is_hidden: boolean;
  is_active: boolean;
}

const CRITERIA_TYPES = [
  { value: 'quest_count', label: 'Complete X Quests' },
  { value: 'tree_xp', label: 'Earn X Tree XP' },
  { value: 'feedback_count', label: 'Submit X Feedback' },
  { value: 'streak_weeks', label: 'Maintain X Week Streak' },
  { value: 'first_quest', label: 'Complete First Quest' },
  { value: 'first_feedback', label: 'Submit First Feedback' },
];

const CATEGORIES = [
  { value: 'global', label: 'Global' },
  { value: 'culture', label: 'Culture' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'connector', label: 'Connector' },
];

const ICON_OPTIONS = ['🏆', '⭐', '🎯', '🔥', '💎', '🌟', '🎖️', '👑', '🚀', '💪', '🎨', '🏃', '🤝', '🍽️', '🎵'];

const defaultFormData: FormData = {
  name: '',
  description: '',
  icon: '🏆',
  category: 'global',
  criteria_type: 'quest_count',
  criteria_count: 3,
  criteria_tree: '',
  xp_reward: 50,
  is_hidden: false,
  is_active: true,
};

export function AchievementsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<AchievementTemplate | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  const { data: achievements, isLoading } = useQuery({
    queryKey: ['admin-achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievement_templates')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return (data ?? []).map(d => ({
        ...d,
        criteria: d.criteria as unknown as AchievementCriteria,
      })) as AchievementTemplate[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const criteria: AchievementCriteria = { type: data.criteria_type };
      
      if (['quest_count', 'feedback_count', 'streak_weeks'].includes(data.criteria_type)) {
        criteria.count = data.criteria_count;
      }
      if (data.criteria_type === 'tree_xp') {
        criteria.tree = data.criteria_tree;
        criteria.amount = data.criteria_count;
      }
      if (data.criteria_type === 'quest_count' && data.criteria_tree) {
        criteria.tree = data.criteria_tree;
      }

      const payload = {
        name: data.name,
        description: data.description || null,
        icon: data.icon,
        category: data.category,
        criteria: JSON.parse(JSON.stringify(criteria)),
        xp_reward: data.xp_reward,
        is_hidden: data.is_hidden,
        is_active: data.is_active,
      };

      if (editingAchievement) {
        const { error } = await supabase
          .from('achievement_templates')
          .update(payload)
          .eq('id', editingAchievement.id);
        if (error) throw error;
      } else {
        const sortOrder = (achievements?.length ?? 0) + 1;
        const { error } = await supabase
          .from('achievement_templates')
          .insert([{ ...payload, sort_order: sortOrder }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-achievements'] });
      toast({ title: editingAchievement ? 'Achievement updated' : 'Achievement created' });
      setShowModal(false);
      setEditingAchievement(null);
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Failed to save', description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('achievement_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-achievements'] });
      toast({ title: 'Achievement deleted' });
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Failed to delete', description: error.message });
    },
  });

  const handleOpenModal = (achievement?: AchievementTemplate) => {
    if (achievement) {
      setEditingAchievement(achievement);
      setFormData({
        name: achievement.name,
        description: achievement.description || '',
        icon: achievement.icon || '🏆',
        category: achievement.category || 'global',
        criteria_type: achievement.criteria?.type || 'quest_count',
        criteria_count: achievement.criteria?.count || achievement.criteria?.amount || 3,
        criteria_tree: achievement.criteria?.tree || '',
        xp_reward: achievement.xp_reward,
        is_hidden: achievement.is_hidden,
        is_active: achievement.is_active,
      });
    } else {
      setEditingAchievement(null);
      setFormData(defaultFormData);
    }
    setShowModal(true);
  };

  const getCriteriaDescription = (criteria: AchievementCriteria): string => {
    switch (criteria.type) {
      case 'quest_count':
        return criteria.tree 
          ? `Complete ${criteria.count} ${criteria.tree} quests`
          : `Complete ${criteria.count} quests`;
      case 'tree_xp':
        return `Earn ${criteria.amount} XP in ${criteria.tree}`;
      case 'feedback_count':
        return `Submit ${criteria.count} feedback`;
      case 'streak_weeks':
        return `Maintain ${criteria.count} week streak`;
      case 'first_quest':
        return 'Complete first quest';
      case 'first_feedback':
        return 'Submit first feedback';
      default:
        return criteria.type;
    }
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
          <h2 className="text-lg font-semibold">Achievement Templates</h2>
          <p className="text-sm text-muted-foreground">
            Define achievements users can unlock through participation
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Achievement
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {achievements?.map((achievement) => (
          <Card 
            key={achievement.id} 
            className={!achievement.is_active ? 'opacity-60' : ''}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{achievement.icon}</span>
                  <div>
                    <CardTitle className="text-base">{achievement.name}</CardTitle>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {achievement.category}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  {achievement.is_hidden && (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Button variant="ghost" size="icon" onClick={() => handleOpenModal(achievement)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => deleteMutation.mutate(achievement.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {achievement.description && (
                <p className="text-sm text-muted-foreground mb-2">
                  {achievement.description}
                </p>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {getCriteriaDescription(achievement.criteria)}
                </span>
                <Badge variant="secondary">+{achievement.xp_reward} XP</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Form Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAchievement ? 'Edit Achievement' : 'New Achievement'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3 space-y-2">
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Austin Foodie I"
                />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, icon: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map(icon => (
                      <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Complete 3 culture quests in Austin"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>XP Reward</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.xp_reward}
                  onChange={(e) => setFormData(prev => ({ ...prev, xp_reward: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Criteria Type</Label>
              <Select
                value={formData.criteria_type}
                onValueChange={(v) => setFormData(prev => ({ ...prev, criteria_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRITERIA_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {['quest_count', 'feedback_count', 'streak_weeks', 'tree_xp'].includes(formData.criteria_type) && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{formData.criteria_type === 'tree_xp' ? 'Amount' : 'Count'}</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.criteria_count}
                    onChange={(e) => setFormData(prev => ({ ...prev, criteria_count: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                {(formData.criteria_type === 'quest_count' || formData.criteria_type === 'tree_xp') && (
                  <div className="space-y-2">
                    <Label>Tree (optional)</Label>
                    <Select
                      value={formData.criteria_tree}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, criteria_tree: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any</SelectItem>
                        <SelectItem value="culture">Culture</SelectItem>
                        <SelectItem value="wellness">Wellness</SelectItem>
                        <SelectItem value="connector">Connector</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_hidden}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_hidden: v }))}
                />
                <Label className="text-sm">Hidden (surprise unlock)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_active: v }))}
                />
                <Label className="text-sm">Active</Label>
              </div>
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
              {editingAchievement ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
