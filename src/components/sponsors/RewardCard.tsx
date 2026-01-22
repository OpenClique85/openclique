import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, isPast } from 'date-fns';
import { 
  Gift, 
  Code, 
  Link as LinkIcon, 
  QrCode, 
  MapPin,
  Users,
  Calendar,
  MoreVertical,
  Pause,
  Play,
  Pencil,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Tables } from '@/integrations/supabase/types';

type Reward = Tables<'rewards'>;

interface RewardCardProps {
  reward: Reward;
  onEdit: () => void;
  onRefresh: () => void;
}

const FULFILLMENT_ICONS = {
  code: Code,
  link: LinkIcon,
  qr: QrCode,
  on_site: MapPin,
};

export function RewardCard({ reward, onEdit, onRefresh }: RewardCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isExpired = reward.expires_at && isPast(new Date(reward.expires_at));
  const FulfillmentIcon = FULFILLMENT_ICONS[reward.fulfillment_type as keyof typeof FULFILLMENT_ICONS] || Gift;

  const getStatusBadge = () => {
    if (isExpired) {
      return <Badge variant="secondary">Expired</Badge>;
    }
    switch (reward.status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>;
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>;
      default:
        return <Badge variant="outline">{reward.status}</Badge>;
    }
  };

  const toggleStatus = async () => {
    const newStatus = reward.status === 'active' ? 'paused' : 'active';
    
    const { error } = await supabase
      .from('rewards')
      .update({ status: newStatus })
      .eq('id', reward.id);

    if (error) {
      toast.error('Failed to update status');
      return;
    }

    toast.success(`Reward ${newStatus === 'active' ? 'activated' : 'paused'}`);
    onRefresh();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    
    const { error } = await supabase
      .from('rewards')
      .delete()
      .eq('id', reward.id);

    if (error) {
      toast.error('Failed to delete reward');
      setIsDeleting(false);
      return;
    }

    toast.success('Reward deleted');
    setShowDeleteDialog(false);
    onRefresh();
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FulfillmentIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{reward.name}</h3>
                <p className="text-xs text-muted-foreground capitalize">
                  {reward.fulfillment_type.replace('_', ' ')} reward
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleStatus}>
                  {reward.status === 'active' ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {reward.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {reward.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            {getStatusBadge()}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>
                  {reward.redemptions_count || 0}
                  {reward.max_redemptions && ` / ${reward.max_redemptions}`}
                </span>
              </div>
              {reward.expires_at && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(reward.expires_at), 'MMM d')}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reward?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{reward.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
