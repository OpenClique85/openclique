/**
 * =============================================================================
 * XP & LEVELS MANAGER - Admin control for level thresholds and XP settings
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
import { useToast } from '@/hooks/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Plus, Pencil, Trash2, TrendingUp, Users, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface LevelThreshold {
  id: string;
  level: number;
  min_xp: number;
  name: string;
  created_at: string;
}

interface LevelFormData {
  level: number;
  min_xp: number;
  name: string;
}

export function XPLevelsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState<LevelThreshold | null>(null);
  const [formData, setFormData] = useState<LevelFormData>({ level: 1, min_xp: 0, name: 'Explorer' });

  // Fetch level thresholds
  const { data: levels, isLoading } = useQuery({
    queryKey: ['admin-level-thresholds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('level_thresholds')
        .select('*')
        .order('level', { ascending: true });
      
      if (error) throw error;
      return data as LevelThreshold[];
    },
  });

  // Fetch user level distribution
  const { data: userStats } = useQuery({
    queryKey: ['admin-user-xp-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_xp')
        .select('total_xp');
      
      if (error) throw error;
      return data;
    },
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: LevelFormData) => {
      if (editingLevel) {
        const { error } = await supabase
          .from('level_thresholds')
          .update({ level: data.level, min_xp: data.min_xp, name: data.name })
          .eq('id', editingLevel.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('level_thresholds')
          .insert({ level: data.level, min_xp: data.min_xp, name: data.name });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-level-thresholds'] });
      toast({ title: editingLevel ? 'Level updated' : 'Level added' });
      setShowModal(false);
      setEditingLevel(null);
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Failed to save', description: error.message });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('level_thresholds')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-level-thresholds'] });
      toast({ title: 'Level deleted' });
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Failed to delete', description: error.message });
    },
  });

  const handleOpenModal = (level?: LevelThreshold) => {
    if (level) {
      setEditingLevel(level);
      setFormData({ level: level.level, min_xp: level.min_xp, name: level.name });
    } else {
      setEditingLevel(null);
      const nextLevel = (levels?.length ?? 0) + 1;
      const lastXP = levels?.[levels.length - 1]?.min_xp ?? 0;
      setFormData({ level: nextLevel, min_xp: lastXP + 500, name: 'Explorer' });
    }
    setShowModal(true);
  };

  // Calculate user distribution by level
  const calculateDistribution = () => {
    if (!levels || !userStats) return [];
    
    return levels.map((level, index) => {
      const nextLevel = levels[index + 1];
      const minXP = level.min_xp;
      const maxXP = nextLevel?.min_xp ?? Infinity;
      
      const usersAtLevel = userStats.filter(
        (u) => u.total_xp >= minXP && u.total_xp < maxXP
      ).length;
      
      return {
        level: level.level,
        name: level.name,
        count: usersAtLevel,
        percent: userStats.length > 0 ? (usersAtLevel / userStats.length) * 100 : 0,
      };
    });
  };

  const distribution = calculateDistribution();
  const totalUsers = userStats?.length ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{levels?.length ?? 0}</p>
                <p className="text-sm text-muted-foreground">Total Levels</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalUsers}</p>
                <p className="text-sm text-muted-foreground">Users with XP</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {levels?.[levels.length - 1]?.min_xp?.toLocaleString() ?? 0}
                </p>
                <p className="text-sm text-muted-foreground">Max Level XP</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Distribution */}
      {distribution.length > 0 && totalUsers > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Distribution</CardTitle>
            <CardDescription>How users are distributed across levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {distribution.map((d) => (
                <div key={d.level} className="flex items-center gap-4">
                  <div className="w-24 flex items-center gap-2">
                    <Badge variant="outline">Lvl {d.level}</Badge>
                    <span className="text-xs text-muted-foreground">{d.name}</span>
                  </div>
                  <div className="flex-1">
                    <Progress value={d.percent} className="h-2" />
                  </div>
                  <div className="w-20 text-right text-sm text-muted-foreground">
                    {d.count} users
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Level Thresholds Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Level Thresholds</CardTitle>
            <CardDescription>Configure XP requirements for each level</CardDescription>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Level
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Level</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Min XP</TableHead>
                <TableHead>XP Range</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {levels?.map((level, index) => {
                const nextLevel = levels[index + 1];
                const xpRange = nextLevel
                  ? `${level.min_xp.toLocaleString()} - ${(nextLevel.min_xp - 1).toLocaleString()}`
                  : `${level.min_xp.toLocaleString()}+`;
                
                return (
                  <TableRow key={level.id}>
                    <TableCell>
                      <Badge>{level.level}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{level.name}</TableCell>
                    <TableCell>{level.min_xp.toLocaleString()} XP</TableCell>
                    <TableCell className="text-muted-foreground">{xpRange}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenModal(level)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(level.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLevel ? 'Edit Level' : 'Add Level'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level">Level Number</Label>
                <Input
                  id="level"
                  type="number"
                  min="1"
                  value={formData.level}
                  onChange={(e) => setFormData(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_xp">Minimum XP</Label>
                <Input
                  id="min_xp"
                  type="number"
                  min="0"
                  value={formData.min_xp}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_xp: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Level Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Explorer, Regular, Local, Connector..."
              />
              <p className="text-xs text-muted-foreground">
                This name appears in the user's profile and badge
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate(formData)}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingLevel ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
