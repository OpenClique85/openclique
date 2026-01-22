import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  MapPin, 
  Users,
  Calendar,
  MoreVertical,
  Pause,
  Play,
  Pencil,
  Trash2,
  ShieldCheck,
  ShieldOff
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

type VenueOffering = Tables<'venue_offerings'>;

interface VenueCardProps {
  venue: VenueOffering;
  onEdit: () => void;
  onRefresh: () => void;
}

export function VenueCard({ venue, onEdit, onRefresh }: VenueCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const getStatusBadge = () => {
    switch (venue.status) {
      case 'available':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Available</Badge>;
      case 'unavailable':
        return <Badge variant="secondary">Unavailable</Badge>;
      default:
        return <Badge variant="outline">{venue.status}</Badge>;
    }
  };

  const toggleStatus = async () => {
    const newStatus = venue.status === 'available' ? 'unavailable' : 'available';
    
    const { error } = await supabase
      .from('venue_offerings')
      .update({ status: newStatus })
      .eq('id', venue.id);

    if (error) {
      toast.error('Failed to update status');
      return;
    }

    toast.success(`Venue marked as ${newStatus}`);
    onRefresh();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    
    const { error } = await supabase
      .from('venue_offerings')
      .delete()
      .eq('id', venue.id);

    if (error) {
      toast.error('Failed to delete venue');
      setIsDeleting(false);
      return;
    }

    toast.success('Venue deleted');
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
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{venue.venue_name}</h3>
                {venue.address && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {venue.address}
                  </p>
                )}
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
                  {venue.status === 'available' ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Mark Unavailable
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Mark Available
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
          {/* Amenities preview */}
          {venue.amenities && venue.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {venue.amenities.slice(0, 3).map((amenity: string) => (
                <Badge key={amenity} variant="outline" className="text-xs">
                  {amenity}
                </Badge>
              ))}
              {venue.amenities.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{venue.amenities.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            {getStatusBadge()}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {venue.capacity && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{venue.capacity}</span>
                </div>
              )}
              {venue.available_days && venue.available_days.length > 0 && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{venue.available_days.length} days</span>
                </div>
              )}
              <span title={venue.approval_required ? "Approval required" : "No approval needed"}>
                {venue.approval_required ? (
                  <ShieldCheck className="h-4 w-4 text-amber-500" />
                ) : (
                  <ShieldOff className="h-4 w-4 text-muted-foreground" />
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Venue?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{venue.venue_name}". This action cannot be undone.
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
