/**
 * =============================================================================
 * SOS Emergency Alert Button
 * =============================================================================
 * Emergency button that users can press if they feel unsafe during a quest.
 * Immediately notifies admin with user's location and quest details.
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Phone, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SOSButtonProps {
  questId?: string;
  squadId?: string;
  variant?: 'default' | 'compact';
}

export function SOSButton({ questId, squadId, variant = 'default' }: SOSButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  const sosMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Try to get location (emergency - no explanation needed)
      let locationLat: number | null = null;
      let locationLng: number | null = null;

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        });
        // Round to ~1km for privacy
        locationLat = Math.round(position.coords.latitude * 100) / 100;
        locationLng = Math.round(position.coords.longitude * 100) / 100;
      } catch (e) {
        // Location not available - continue anyway
        console.warn('Could not get location for SOS:', e);
      }

      const { error } = await supabase
        .from('sos_alerts')
        .insert({
          user_id: user.id,
          quest_id: questId || null,
          squad_id: squadId || null,
          location_lat: locationLat,
          location_lng: locationLng,
          status: 'active',
        });

      if (error) throw error;

      // Could also trigger edge function to send immediate notifications
      // await supabase.functions.invoke('notify-sos-alert', { body: { alertId } });
    },
    onSuccess: () => {
      setShowConfirm(false);
      setShowSuccess(true);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to send alert',
        description: error.message + '. Please call 911 directly if you need immediate help.',
      });
    },
  });

  const handleCall911 = () => {
    window.location.href = 'tel:911';
  };

  if (variant === 'compact') {
    return (
      <>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowConfirm(true)}
          className="gap-1.5"
        >
          <Shield className="h-4 w-4" />
          SOS
        </Button>

        <SOSConfirmDialog
          open={showConfirm}
          onOpenChange={setShowConfirm}
          onConfirm={() => sosMutation.mutate()}
          isPending={sosMutation.isPending}
        />

        <SOSSuccessDialog
          open={showSuccess}
          onOpenChange={setShowSuccess}
          onCall911={handleCall911}
        />
      </>
    );
  }

  return (
    <>
      <Button
        variant="destructive"
        size="lg"
        onClick={() => setShowConfirm(true)}
        className="gap-2 shadow-lg"
      >
        <Shield className="h-5 w-5" />
        Emergency SOS
      </Button>

      <SOSConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        onConfirm={() => sosMutation.mutate()}
        isPending={sosMutation.isPending}
      />

      <SOSSuccessDialog
        open={showSuccess}
        onOpenChange={setShowSuccess}
        onCall911={handleCall911}
      />
    </>
  );
}

interface SOSConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

function SOSConfirmDialog({ open, onOpenChange, onConfirm, isPending }: SOSConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <AlertDialogTitle>Emergency Alert</AlertDialogTitle>
          <AlertDialogDescription className="text-left space-y-3">
            <p>This will immediately notify the OpenClique team with your location.</p>
            <p className="font-medium text-foreground">
              Use only for genuine emergencies. For non-urgent issues, use the Report feature instead.
            </p>
            <p>Do you need emergency assistance?</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            variant="destructive"
            size="lg"
            onClick={onConfirm}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? 'Sending Alert...' : 'YES - SEND ALERT'}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            No, go back
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface SOSSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCall911: () => void;
}

function SOSSuccessDialog({ open, onOpenChange, onCall911 }: SOSSuccessDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <AlertDialogTitle>Emergency alert sent</AlertDialogTitle>
          <AlertDialogDescription className="text-left space-y-3">
            <p>The OpenClique team has been notified with your location.</p>
            <p className="font-medium text-foreground">
              For immediate help, call 911 (US) or local emergency services.
            </p>
            <p className="text-muted-foreground">
              Stay safe. We're here to help.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            variant="destructive"
            size="lg"
            onClick={onCall911}
            className="w-full gap-2"
          >
            <Phone className="h-5 w-5" />
            Call 911
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            I'm OK Now
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
