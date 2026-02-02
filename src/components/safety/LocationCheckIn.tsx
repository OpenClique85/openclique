/**
 * =============================================================================
 * Location Check-In Component
 * =============================================================================
 * Offers optional location verification for quest check-in.
 * Always provides manual check-in as an alternative.
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Hand, CheckCircle2, Loader2 } from 'lucide-react';

type CheckInMethod = 'location_verified' | 'manual';

interface LocationCheckInProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signupId: string;
  onSuccess?: () => void;
}

export function LocationCheckIn({
  open,
  onOpenChange,
  signupId,
  onSuccess,
}: LocationCheckInProps) {
  const [step, setStep] = useState<'choose' | 'permission' | 'success'>('choose');
  const [method, setMethod] = useState<CheckInMethod>('manual');
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const { toast } = useToast();

  const checkInMutation = useMutation({
    mutationFn: async (data: { method: CheckInMethod; lat?: number; lng?: number }) => {
      const { error } = await supabase
        .from('quest_signups')
        .update({
          checked_in_at: new Date().toISOString(),
          check_in_method: data.method,
          check_in_lat: data.lat || null,
          check_in_lng: data.lng || null,
          location_consent_given: data.method === 'location_verified',
          check_in_verified: true,
        })
        .eq('id', signupId);

      if (error) throw error;
    },
    onSuccess: () => {
      setStep('success');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Check-in failed',
        description: error.message,
      });
    },
  });

  const handleContinue = () => {
    if (method === 'manual') {
      checkInMutation.mutate({ method: 'manual' });
    } else {
      setStep('permission');
    }
  };

  const handleLocationRequest = async () => {
    setIsRequestingLocation(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      // Round to 2 decimal places (~1km accuracy)
      const lat = Math.round(position.coords.latitude * 100) / 100;
      const lng = Math.round(position.coords.longitude * 100) / 100;

      checkInMutation.mutate({ method: 'location_verified', lat, lng });
    } catch (error) {
      // Fall back to manual check-in
      toast({
        title: 'Location unavailable',
        description: "We'll check you in manually instead.",
      });
      checkInMutation.mutate({ method: 'manual' });
    } finally {
      setIsRequestingLocation(false);
    }
  };

  const handleManualFallback = () => {
    checkInMutation.mutate({ method: 'manual' });
  };

  const handleClose = () => {
    setStep('choose');
    setMethod('manual');
    onOpenChange(false);
    if (step === 'success') {
      onSuccess?.();
    }
  };

  if (step === 'success') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle>You're checked in!</DialogTitle>
            <DialogDescription className="space-y-2">
              <p className="text-lg font-medium text-foreground">+50 XP earned</p>
              <p>Enjoy your quest! Remember to share your feedback afterwards.</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="w-full" onClick={handleClose}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (step === 'permission') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Location Permission
            </DialogTitle>
            <DialogDescription className="text-left space-y-4 pt-2">
              <p>
                We'll verify you're at the quest location by checking your approximate 
                position (within ~1 kilometer). This is optional and only used to confirm attendance.
              </p>
              
              <div className="space-y-2">
                <p className="font-medium text-foreground">We will:</p>
                <ul className="list-none space-y-1">
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                    Check your location ONLY when you tap 'Check In'
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                    Store approximate location (not precise GPS)
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                    Delete location data after 90 days
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                    Never track you outside of check-in
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="font-medium text-foreground">We will NOT:</p>
                <ul className="list-none space-y-1">
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-destructive mt-0.5">✗</span>
                    Track your location in the background
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-destructive mt-0.5">✗</span>
                    Share your location with other users
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-destructive mt-0.5">✗</span>
                    Use it for advertising or other purposes
                  </li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={handleLocationRequest}
              disabled={isRequestingLocation || checkInMutation.isPending}
              className="w-full"
            >
              {isRequestingLocation ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Getting location...
                </>
              ) : (
                'Allow Location Access'
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={handleManualFallback}
              disabled={checkInMutation.isPending}
              className="w-full"
            >
              No thanks, check in manually instead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How would you like to check in?</DialogTitle>
          <DialogDescription>
            Both options award the same XP. Choose what works for you.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={method}
          onValueChange={(value) => setMethod(value as CheckInMethod)}
          className="space-y-3 py-4"
        >
          <div
            className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-accent cursor-pointer"
            onClick={() => setMethod('location_verified')}
          >
            <RadioGroupItem value="location_verified" id="location" className="mt-1" />
            <Label htmlFor="location" className="cursor-pointer flex-1">
              <div className="flex items-center gap-2 font-medium">
                <MapPin className="h-4 w-4 text-primary" />
                Verify my location
              </div>
              <span className="text-sm text-muted-foreground">
                Helps prevent fraud (optional)
              </span>
            </Label>
          </div>

          <div
            className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-accent cursor-pointer"
            onClick={() => setMethod('manual')}
          >
            <RadioGroupItem value="manual" id="manual" className="mt-1" />
            <Label htmlFor="manual" className="cursor-pointer flex-1">
              <div className="flex items-center gap-2 font-medium">
                <Hand className="h-4 w-4 text-primary" />
                Manual check-in
              </div>
              <span className="text-sm text-muted-foreground">
                No location needed
              </span>
            </Label>
          </div>
        </RadioGroup>

        <DialogFooter>
          <Button 
            className="w-full" 
            onClick={handleContinue}
            disabled={checkInMutation.isPending}
          >
            {checkInMutation.isPending ? 'Checking in...' : 'Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
