/**
 * =============================================================================
 * SocialEnergyMap - Visual 3-axis map with weighted sliders (must total 100)
 * =============================================================================
 * 
 * FIXED: Weight input now uses +/- buttons and debounced manual input
 * to prevent value jumping during typing.
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Lock, Unlock, Eye, EyeOff, Sparkles, ChevronDown, Check, Loader2, Minus, Plus } from 'lucide-react';
import { TooltipInfo } from '@/components/ui/tooltip-info';
import {
  useSocialEnergy,
  ENERGY_AXIS,
  STRUCTURE_AXIS,
  FOCUS_AXIS,
  type Visibility,
  type AxisWeights,
} from '@/hooks/useSocialEnergy';
import { cn } from '@/lib/utils';

interface SocialEnergyMapProps {
  userId?: string;
  compact?: boolean;
}

type AxisKey = 'energy' | 'structure' | 'focus';

interface AxisConfig {
  key: AxisKey;
  axisKey: 'energy_axis' | 'structure_axis' | 'focus_axis';
  config: typeof ENERGY_AXIS;
}

const AXES: AxisConfig[] = [
  { key: 'energy', axisKey: 'energy_axis', config: ENERGY_AXIS },
  { key: 'structure', axisKey: 'structure_axis', config: STRUCTURE_AXIS },
  { key: 'focus', axisKey: 'focus_axis', config: FOCUS_AXIS },
];

export function SocialEnergyMap({ userId, compact = false }: SocialEnergyMapProps) {
  const {
    socialEnergy,
    isLoading,
    isOwner,
    hasData,
    weights,
    initialize,
    updateAxis,
    updateWeights,
    toggleLock,
    updateVisibility,
    toggleMatching,
    getPositionLabel,
    isUpdating,
  } = useSocialEnergy(userId);

  const [localPositions, setLocalPositions] = useState({
    energy: 50,
    structure: 50,
    focus: 50,
  });

  const [localWeights, setLocalWeights] = useState<AxisWeights>({
    energy: 34,
    structure: 33,
    focus: 33,
  });

  const [hasWeightChanges, setHasWeightChanges] = useState(false);
  
  // Track which input is being edited (for manual typing)
  const [editingAxis, setEditingAxis] = useState<AxisKey | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local values with fetched data
  useEffect(() => {
    if (socialEnergy) {
      setLocalPositions({
        energy: socialEnergy.energy_axis,
        structure: socialEnergy.structure_axis,
        focus: socialEnergy.focus_axis,
      });
    }
  }, [socialEnergy]);

  useEffect(() => {
    setLocalWeights(weights);
    setHasWeightChanges(false);
  }, [weights.energy, weights.structure, weights.focus]);

  // Initialize if no data and user is owner
  useEffect(() => {
    if (!isLoading && !hasData && isOwner) {
      initialize();
    }
  }, [isLoading, hasData, isOwner, initialize]);

  const handlePositionChange = (axis: AxisKey, value: number[]) => {
    setLocalPositions((prev) => ({ ...prev, [axis]: value[0] }));
  };

  const handlePositionCommit = async (
    axisKey: 'energy_axis' | 'structure_axis' | 'focus_axis',
    value: number[]
  ) => {
    if (isOwner && !socialEnergy.is_locked) {
      await updateAxis(axisKey, value[0]);
    }
  };

  // Handle direct weight changes WITHOUT auto-redistribution
  // Users can go into deficit or surplus until they reach exactly 100
  // Handle +/- button clicks using functional update to avoid stale closures
  const handleWeightAdjust = (axis: AxisKey, delta: number) => {
    setLocalWeights(prev => {
      const newValue = prev[axis] + delta;
      // Allow any value between 0 and 100 (no total constraint during editing)
      if (newValue < 0 || newValue > 100) return prev;
      
      setHasWeightChanges(true);
      return {
        ...prev,
        [axis]: newValue,
      };
    });
  };

  // Handle direct value setting from input
  const handleWeightSet = (axis: AxisKey, newValue: number) => {
    const clampedValue = Math.max(0, Math.min(100, newValue));
    setLocalWeights(prev => ({
      ...prev,
      [axis]: clampedValue,
    }));
    setHasWeightChanges(true);
  };

  // Handle manual input focus
  const handleInputFocus = (axis: AxisKey) => {
    setEditingAxis(axis);
    setEditingValue(String(localWeights[axis]));
  };

  // Handle manual input change (direct change, no redistribution)
  const handleInputChange = (value: string) => {
    // Only allow numeric input
    if (value === '' || /^\d+$/.test(value)) {
      setEditingValue(value);
      
      // Debounce for smooth typing experience
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      debounceRef.current = setTimeout(() => {
        if (editingAxis && value !== '') {
          const numValue = parseInt(value, 10);
          if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
            handleWeightSet(editingAxis, numValue);
          }
        }
      }, 300);
    }
  };

  // Handle input blur (finalize)
  const handleInputBlur = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    if (editingAxis && editingValue !== '') {
      const numValue = parseInt(editingValue, 10);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
        handleWeightSet(editingAxis, numValue);
      }
    }
    
    setEditingAxis(null);
    setEditingValue('');
  };

  const handleSaveWeights = async () => {
    await updateWeights(localWeights);
    setHasWeightChanges(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        <div className="h-6 w-48 bg-muted animate-pulse rounded" />
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-2 w-full bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const visibilityLabels: Record<Visibility, { label: string; icon: typeof Eye }> = {
    public: { label: 'Public', icon: Eye },
    squad_only: { label: 'Squad Only', icon: EyeOff },
    private: { label: 'Private', icon: EyeOff },
  };

  const VisibilityIcon = visibilityLabels[socialEnergy.visibility as Visibility]?.icon || Eye;
  const totalWeight = localWeights.energy + localWeights.structure + localWeights.focus;

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{getPositionLabel()}</p>
            {socialEnergy.source === 'ai_suggested' && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Sparkles className="h-3 w-3" />
                AI Suggested
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Set where you fall on each axis, then allocate importance points
          </p>
        </div>
        {isOwner && (
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 h-8">
                  <VisibilityIcon className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs">
                    {visibilityLabels[socialEnergy.visibility as Visibility]?.label}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => updateVisibility('public')}>
                  <Eye className="h-4 w-4 mr-2" />
                  Public
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateVisibility('squad_only')}>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Squad Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateVisibility('private')}>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Private
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleLock}
              disabled={isUpdating}
            >
              {socialEnergy.is_locked ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Weight budget indicator */}
      {isOwner && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
          <span className="text-sm font-medium">Importance Budget:</span>
          <div className="flex items-center gap-2">
            <Badge 
              variant={totalWeight === 100 ? 'default' : 'destructive'}
              className="text-sm px-3"
            >
              {totalWeight}/100 pts
            </Badge>
            {totalWeight === 100 && <Check className="h-4 w-4 text-green-500" />}
            {totalWeight !== 100 && (
              <span className="text-xs text-destructive">
                {totalWeight < 100 ? `Add ${100 - totalWeight} pts` : `Remove ${totalWeight - 100} pts`}
              </span>
            )}
          </div>
          <TooltipInfo
            text="Distribute 100 points across the axes to show which matters most for your squad matching. Use +/- buttons or type directly."
            side="right"
          />
        </div>
      )}

      {/* Axis sliders */}
      <div className="space-y-8">
        {AXES.map(({ key, axisKey, config }) => (
          <div key={key} className="space-y-3">
            {/* Axis header with weight controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">{config.label}</span>
                <TooltipInfo text={config.tooltip} />
              </div>
              {isOwner && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground mr-2">Importance:</span>
                  
                  {/* Minus button */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleWeightAdjust(key, -5)}
                    disabled={socialEnergy.is_locked || localWeights[key] <= 0}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  
                  {/* Weight input */}
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={editingAxis === key ? editingValue : localWeights[key]}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => handleInputFocus(key)}
                    onBlur={handleInputBlur}
                    disabled={socialEnergy.is_locked}
                    className={cn(
                      "w-12 h-7 text-center text-sm font-medium border rounded-md bg-background",
                      "focus:ring-2 focus:ring-primary focus:outline-none",
                      socialEnergy.is_locked && "opacity-50 cursor-not-allowed"
                    )}
                  />
                  
                  {/* Plus button */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleWeightAdjust(key, 5)}
                    disabled={socialEnergy.is_locked || localWeights[key] >= 100}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  
                  <span className="text-xs text-muted-foreground ml-1">pts</span>
                </div>
              )}
            </div>

            {/* Position labels */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span>{config.low.emoji}</span>
                <span>{config.low.name}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span>{config.high.name}</span>
                <span>{config.high.emoji}</span>
              </div>
            </div>

            {/* Position slider */}
            <Slider
              value={[localPositions[key]]}
              onValueChange={(v) => handlePositionChange(key, v)}
              onValueCommit={(v) => handlePositionCommit(axisKey, v)}
              max={100}
              step={1}
              disabled={!isOwner || socialEnergy.is_locked}
              className={cn(
                'transition-opacity',
                (!isOwner || socialEnergy.is_locked) && 'opacity-60'
              )}
            />

            {/* Endpoint descriptions */}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="max-w-[45%]">{config.low.description}</span>
              <span className="max-w-[45%] text-right">{config.high.description}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Save weights button */}
      {isOwner && hasWeightChanges && totalWeight === 100 && (
        <Button onClick={handleSaveWeights} disabled={isUpdating} className="w-full">
          {isUpdating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Save Importance
            </>
          )}
        </Button>
      )}

      {/* Matching toggle */}
      {isOwner && (
        <div className="pt-4 border-t flex items-center justify-between">
          <div className="text-sm">
            <p className="font-medium">Use for squad matching</p>
            <p className="text-xs text-muted-foreground">
              {socialEnergy.use_for_matching
                ? 'Your energy map helps find compatible squads'
                : 'Your energy map is not used for matching'}
            </p>
          </div>
          <Button
            variant={socialEnergy.use_for_matching ? 'default' : 'outline'}
            size="sm"
            onClick={toggleMatching}
            disabled={isUpdating}
          >
            {socialEnergy.use_for_matching ? 'Active' : 'Disabled'}
          </Button>
        </div>
      )}
    </div>
  );
}
