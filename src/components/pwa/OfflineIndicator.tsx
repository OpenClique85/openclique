import { WifiOff } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export function OfflineIndicator() {
  const { isOnline } = usePWAInstall();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-destructive text-destructive-foreground px-4 py-2">
      <div className="flex items-center justify-center gap-2 text-sm font-medium">
        <WifiOff className="h-4 w-4" />
        <span>You're offline. Some features may be unavailable.</span>
      </div>
    </div>
  );
}
