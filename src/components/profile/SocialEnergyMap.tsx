/**
 * =============================================================================
 * SocialEnergyMap - Visual 3-axis map showing user's social energy position
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Lock, Unlock, Eye, EyeOff, Sparkles, ChevronDown, Coffee, Zap, Calendar, Shuffle, MessageCircle, Mountain } from 'lucide-react';
import { useSocialEnergy, ENERGY_AXIS, STRUCTURE_AXIS, FOCUS_AXIS, type Visibility } from '@/hooks/useSocialEnergy';
import { cn } from '@/lib/utils';

interface SocialEnergyMapProps {
  userId?: string;
  compact?: boolean;
}

export function SocialEnergyMap({ userId, compact = false }: SocialEnergyMapProps) {
  const {
    socialEnergy,
    isLoading,
    isOwner,
    hasData,
    initialize,
    updateAxis,
    toggleLock,
    updateVisibility,
    toggleMatching,
    getPositionLabel,
    isUpdating,
  } = useSocialEnergy(userId);

  const [localValues, setLocalValues] = useState({
    energy: 50,
    structure: 50,
    focus: 50,
  });

  // Sync local values with fetched data
  useEffect(() => {
    if (socialEnergy) {
      setLocalValues({
        energy: socialEnergy.energy_axis,
        structure: socialEnergy.structure_axis,
        focus: socialEnergy.focus_axis,
      });
    }
  }, [socialEnergy]);

  // Initialize if no data and user is owner
  useEffect(() => {
    if (!isLoading && !hasData && isOwner) {
      initialize();
    }
  }, [isLoading, hasData, isOwner, initialize]);

  if (isLoading) {
    return (
      <Card className={cn(compact ? 'p-4' : '')}>
        <CardContent className="pt-6">
          <div className="h-48 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSliderChange = async (
    axis: 'energy' | 'structure' | 'focus',
    value: number[]
  ) => {
    const newValue = value[0];
    setLocalValues((prev) => ({ ...prev, [axis]: newValue }));
  };

  const handleSliderCommit = async (
    axis: 'energy_axis' | 'structure_axis' | 'focus_axis',
    value: number[]
  ) => {
    if (isOwner && !socialEnergy.is_locked) {
      await updateAxis(axis, value[0]);
    }
  };

  const visibilityLabels: Record<Visibility, { label: string; icon: typeof Eye }> = {
    public: { label: 'Public', icon: Eye },
    squad_only: { label: 'Squad Only', icon: EyeOff },
    private: { label: 'Private', icon: EyeOff },
  };

  const VisibilityIcon = visibilityLabels[socialEnergy.visibility as Visibility]?.icon || Eye;

  return (
    <Card className={cn(compact ? 'p-4' : '')}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Social Energy Map</CardTitle>
            {socialEnergy.source === 'ai_suggested' && (
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                AI Suggested
              </Badge>
            )}
          </div>
          {isOwner && (
            <div className="flex items-center gap-2">
              {/* Visibility dropdown */}
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

              {/* Lock toggle */}
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
        <p className="text-sm text-muted-foreground">
          {getPositionLabel()}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Energy Axis */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Coffee className="h-4 w-4" />
              <span>{ENERGY_AXIS.low.name}</span>
            </div>
            <span className="font-medium">{ENERGY_AXIS.label}</span>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>{ENERGY_AXIS.high.name}</span>
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <Slider
            value={[localValues.energy]}
            onValueChange={(v) => handleSliderChange('energy', v)}
            onValueCommit={(v) => handleSliderCommit('energy_axis', v)}
            max={100}
            step={1}
            disabled={!isOwner || socialEnergy.is_locked}
            className={cn(
              'transition-opacity',
              (!isOwner || socialEnergy.is_locked) && 'opacity-60'
            )}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{ENERGY_AXIS.low.description}</span>
            <span>{ENERGY_AXIS.high.description}</span>
          </div>
        </div>

        {/* Structure Axis */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shuffle className="h-4 w-4" />
              <span>{STRUCTURE_AXIS.low.name}</span>
            </div>
            <span className="font-medium">{STRUCTURE_AXIS.label}</span>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>{STRUCTURE_AXIS.high.name}</span>
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <Slider
            value={[localValues.structure]}
            onValueChange={(v) => handleSliderChange('structure', v)}
            onValueCommit={(v) => handleSliderCommit('structure_axis', v)}
            max={100}
            step={1}
            disabled={!isOwner || socialEnergy.is_locked}
            className={cn(
              'transition-opacity',
              (!isOwner || socialEnergy.is_locked) && 'opacity-60'
            )}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{STRUCTURE_AXIS.low.description}</span>
            <span>{STRUCTURE_AXIS.high.description}</span>
          </div>
        </div>

        {/* Focus Axis */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              <span>{FOCUS_AXIS.low.name}</span>
            </div>
            <span className="font-medium">{FOCUS_AXIS.label}</span>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>{FOCUS_AXIS.high.name}</span>
              <Mountain className="h-4 w-4" />
            </div>
          </div>
          <Slider
            value={[localValues.focus]}
            onValueChange={(v) => handleSliderChange('focus', v)}
            onValueCommit={(v) => handleSliderCommit('focus_axis', v)}
            max={100}
            step={1}
            disabled={!isOwner || socialEnergy.is_locked}
            className={cn(
              'transition-opacity',
              (!isOwner || socialEnergy.is_locked) && 'opacity-60'
            )}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{FOCUS_AXIS.low.description}</span>
            <span>{FOCUS_AXIS.high.description}</span>
          </div>
        </div>

        {/* Matching toggle */}
        {isOwner && (
          <div className="pt-2 border-t flex items-center justify-between">
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
      </CardContent>
    </Card>
  );
}
