import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface XPAwardToastProps {
  amount: number;
  label?: string;
  onComplete?: () => void;
}

export function XPAwardToast({ amount, label, onComplete }: XPAwardToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const showTimer = setTimeout(() => setIsVisible(true), 50);
    
    // Start exit animation
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 2500);

    // Complete and cleanup
    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, 3000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={cn(
        "fixed top-20 left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-2 px-6 py-3 rounded-full",
        "bg-primary text-primary-foreground shadow-lg",
        "transition-all duration-500 ease-out",
        isVisible && !isExiting ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-4 scale-95"
      )}
    >
      <Zap className="h-5 w-5 fill-current animate-pulse" />
      <span className="font-bold text-lg">+{amount} XP</span>
      {label && (
        <span className="text-primary-foreground/80 text-sm">
          {label}
        </span>
      )}
    </div>
  );
}

// Hook to manage XP toast state
export function useXPToast() {
  const [toastState, setToastState] = useState<{
    amount: number;
    label?: string;
    key: number;
  } | null>(null);

  const showXPToast = (amount: number, label?: string) => {
    setToastState({ amount, label, key: Date.now() });
  };

  const hideXPToast = () => {
    setToastState(null);
  };

  return { toastState, showXPToast, hideXPToast };
}
