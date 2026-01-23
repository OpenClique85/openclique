/**
 * =============================================================================
 * BADGES MANAGER - Admin control for badge templates
 * =============================================================================
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Loader2, Plus, Pencil, Trash2, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BadgeTemplate {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  rarity: 'common' | 'rare' | 'legendary';
  category: string | null;
  is_active: boolean;
  created_at: string;
}

interface FormData {
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'legendary';
  category: string;
  is_active: boolean;
}

const ICON_OPTIONS = ['🎖️', '🏆', '⭐', '💎', '👑', '🌟', '🔥', '💫', '🎯', '🚀', '🎨', '🏃', '🤝', '🍽️', '🎵', '🎭', '📸', '🌳'];

const RARITY_STYLES = {
  common: 'border-border bg-muted/50',
  rare: 'border-blue-400 bg-blue-50 dark:bg-blue-950/30',
  legendary: 'border-amber-400 bg-amber-50 dark:bg-amber-950/30 shadow-[0_0_15px_rgba(251,191,36,0.3)]',
};

const defaultFormData: FormData = {
  name: '',
  description: '',
  icon: '🎖️',
  rarity: 'common',
  category: '',
  is_active: true,
};

export function BadgesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingBadge, setEditingBadge] = useState<BadgeTemplate | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  const { data: badges, isLoading } = useQuery({
    queryKey: ['admin-badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badge_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BadgeTemplate[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        name: data.name,
        description: data.description || null,
        icon: data.icon,
        rarity: data.rarity,
        category: data.category || null,
        is_active: data.is_active,
      };

      if (editingBadge) {
        const { error } = await supabase
          .from('badge_templates')
          .update(payload)
          .eq('id', editingBadge.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('badge_templates')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
      toast({ title: editingBadge ? 'Badge updated' : 'Badge created' });
      setShowModal(false);
      setEditingBadge(null);
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Failed to save', description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('badge_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
      toast({ title: 'Badge deleted' });
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Failed to delete', description: error.message });
    },
  });

  const handleOpenModal = (badge?: BadgeTemplate) => {
    if (badge) {
      setEditingBadge(badge);
      setFormData({
        name: badge.name,
        description: badge.description || '',
        icon: badge.icon || '🎖️',
        rarity: badge.rarity,
        category: badge.category || '',
        is_active: badge.is_active,
      });
    } else {
      setEditingBadge(null);
      setFormData(defaultFormData);
    }
    setShowModal(true);
  };

  // Group badges by rarity
  const groupedBadges = {
    legendary: badges?.filter(b => b.rarity === 'legendary') ?? [],
    rare: badges?.filter(b => b.rarity === 'rare') ?? [],
    common: badges?.filter(b => b.rarity === 'common') ?? [],
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
          <h2 className="text-lg font-semibold">Badge Templates</h2>
          <p className="text-sm text-muted-foreground">
            Visual identity markers awarded to users
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Badge
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-amber-500">{groupedBadges.legendary.length}</div>
            <p className="text-sm text-muted-foreground">Legendary</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-blue-500">{groupedBadges.rare.length}</div>
            <p className="text-sm text-muted-foreground">Rare</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{groupedBadges.common.length}</div>
            <p className="text-sm text-muted-foreground">Common</p>
          </CardContent>
        </Card>
      </div>

      {/* Badge Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {badges?.map((badge) => (
          <Card
            key={badge.id}
            className={cn(
              'border-2 transition-all',
              RARITY_STYLES[badge.rarity],
              !badge.is_active && 'opacity-50'
            )}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3">
                <div className="text-4xl">{badge.icon}</div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenModal(badge)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => deleteMutation.mutate(badge.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <h3 className="font-medium">{badge.name}</h3>
              {badge.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {badge.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <Badge
                  variant="outline"
                  className={cn(
                    badge.rarity === 'legendary' && 'border-amber-400 text-amber-600',
                    badge.rarity === 'rare' && 'border-blue-400 text-blue-600'
                  )}
                >
                  {badge.rarity}
                </Badge>
                {badge.category && (
                  <Badge variant="secondary">{badge.category}</Badge>
                )}
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
              {editingBadge ? 'Edit Badge' : 'New Badge'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3 space-y-2">
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Explorer Badge"
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
                placeholder="Awarded for completing your first quest"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rarity</Label>
                <Select
                  value={formData.rarity}
                  onValueChange={(v: 'common' | 'rare' | 'legendary') => 
                    setFormData(prev => ({ ...prev, rarity: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="common">Common</SelectItem>
                    <SelectItem value="rare">Rare</SelectItem>
                    <SelectItem value="legendary">Legendary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="culture, wellness..."
                />
              </div>
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
              {editingBadge ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
