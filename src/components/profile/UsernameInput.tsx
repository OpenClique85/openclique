/**
 * UsernameInput - Username field with real-time availability checking
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUsernameAvailability } from '@/hooks/useUsernameAvailability';
import { Check, X, Loader2, AtSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UsernameInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}

export function UsernameInput({ value, onChange, disabled, required }: UsernameInputProps) {
  const { isChecking, result } = useUsernameAvailability(value);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove @ if user types it, allow only valid characters
    const cleaned = e.target.value.replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, '');
    onChange(cleaned);
  };
  
  return (
    <div className="space-y-2">
      <Label htmlFor="username">
        Username {required && '*'}
      </Label>
      <div className="relative">
        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="username"
          type="text"
          placeholder="johnsmith"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          maxLength={20}
          className={cn(
            "pl-9 pr-9",
            result?.available === true && "border-emerald-500 focus-visible:ring-emerald-500",
            result?.available === false && value.length >= 3 && "border-destructive focus-visible:ring-destructive"
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isChecking && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {!isChecking && result?.available === true && (
            <Check className="h-4 w-4 text-emerald-500" />
          )}
          {!isChecking && result?.available === false && value.length >= 3 && (
            <X className="h-4 w-4 text-destructive" />
          )}
        </div>
      </div>
      
      {/* Status message */}
      {value.length > 0 && value.length < 3 && (
        <p className="text-xs text-muted-foreground">
          Username must be at least 3 characters
        </p>
      )}
      {!isChecking && result?.available === true && (
        <p className="text-xs text-emerald-600">
          @{value} is available!
        </p>
      )}
      {!isChecking && result?.available === false && value.length >= 3 && (
        <p className="text-xs text-destructive">
          {result.reason}
        </p>
      )}
      {!result && value.length >= 3 && !isChecking && (
        <p className="text-xs text-muted-foreground">
          Your unique handle. Others can find you as @{value}
        </p>
      )}
    </div>
  );
}
