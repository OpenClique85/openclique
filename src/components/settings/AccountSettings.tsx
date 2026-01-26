/**
 * =============================================================================
 * AccountSettings - Account management including deletion
 * =============================================================================
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Trash2, 
  AlertTriangle, 
  Clock, 
  XCircle,
  Loader2 
} from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { DeleteAccountModal } from './DeleteAccountModal';
import { format, formatDistanceToNow } from 'date-fns';

export function AccountSettings() {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { deletionRequest, cancelDeletion, isCancellingDeletion } = useSettings();

  const hasPendingDeletion = deletionRequest?.status === 'pending';

  return (
    <div className="space-y-6">
      {/* Pending Deletion Alert */}
      {hasPendingDeletion && (
        <Alert variant="destructive">
          <Clock className="h-4 w-4" />
          <AlertTitle>Account Deletion Scheduled</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p>
              Your account is scheduled for deletion on{' '}
              <strong>
                {format(new Date(deletionRequest.scheduled_at), 'MMMM d, yyyy')}
              </strong>{' '}
              ({formatDistanceToNow(new Date(deletionRequest.scheduled_at), { addSuffix: true })}).
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => cancelDeletion('Changed my mind')}
              disabled={isCancellingDeletion}
            >
              {isCancellingDeletion ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Deletion
                </>
              )}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
          <CardDescription>
            Your account information and status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            {hasPendingDeletion ? (
              <Badge variant="destructive">Pending Deletion</Badge>
            ) : (
              <Badge variant="default" className="bg-green-600">Active</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible account actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">Delete Account</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              disabled={hasPendingDeletion}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {hasPendingDeletion ? 'Deletion Pending' : 'Delete Account'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <DeleteAccountModal 
        open={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
      />
    </div>
  );
}
