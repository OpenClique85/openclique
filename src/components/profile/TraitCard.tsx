/**
 * =============================================================================
 * TraitCard - Individual accepted trait with importance slider and visibility
 * =============================================================================
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
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
import { 
  ChevronDown, 
  ChevronUp, 
  Globe, 
  Users, 
  Lock, 
  Trash2,
  Flame
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserTraitWithLibrary, Visibility } from '@/hooks/useYourAlgorithm';
import { CATEGORY_COLORS } from '@/hooks/useYourAlgorithm';

interface TraitCardProps {
  trait: UserTraitWithLibrary;
  onUpdateImportance: (traitId: string, importance: number) => Promise<void>;
  onUpdateVisibility: (traitId: string, visibility: Visibility) => Promise<void>;
  onRemove: (traitId: string) => Promise<void>;
  isUpdating: boolean;
}

const VISIBILITY_OPTIONS: { value: Visibility; label: string; icon: React.ElementType }[] = [
  { value: 'public', label: 'Public', icon: Globe },
  { value: 'squad_only', label: 'Squad Only', icon: Users },
  { value: 'private', label: 'Private', icon: Lock },
];

export function TraitCard({
  trait,
  onUpdateImportance,
  onUpdateVisibility,
  onRemove,
  isUpdating,
}: TraitCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [localImportance, setLocalImportance] = useState(trait.importance || 50);

  const category = trait.trait_library?.category || 'social_energy';
  const categoryColors = CATEGORY_COLORS[category] || CATEGORY_COLORS.social_energy;
  const visibility = (trait.visibility as Visibility) || 'public';
  const currentVisibility = VISIBILITY_OPTIONS.find(v => v.value === visibility) || VISIBILITY_OPTIONS[0];
  const VisibilityIcon = currentVisibility.icon;

  // Calculate warmth color based on importance
  const getWarmthColor = (importance: number) => {
    if (importance >= 80) return 'text-orange-500';
    if (importance >= 60) return 'text-amber-500';
    if (importance >= 40) return 'text-yellow-500';
    return 'text-muted-foreground';
  };

  const handleImportanceChange = async (values: number[]) => {
    const newValue = values[0];
    setLocalImportance(newValue);
  };

  const handleImportanceCommit = async () => {
    if (localImportance !== trait.importance) {
      await onUpdateImportance(trait.id, localImportance);
    }
  };

  return (
    <>
      <div
        className={cn(
          "rounded-xl border border-border overflow-hidden transition-all duration-200",
          "bg-gradient-to-br",
          categoryColors.gradient
        )}
      >
        {/* Main content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="text-2xl">{trait.trait_library?.emoji || '✨'}</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate">
                  {trait.trait_library?.display_name || trait.trait_slug}
                </h4>
                <p className="text-xs text-muted-foreground capitalize">
                  {trait.trait_library?.category?.replace('_', ' ') || 'Trait'}
                </p>
              </div>
            </div>

            {/* Warmth indicator */}
            <div className="flex items-center gap-1">
              <Flame className={cn("w-4 h-4", getWarmthColor(localImportance))} />
              <span className={cn("text-sm font-medium", getWarmthColor(localImportance))}>
                {localImportance}
              </span>
            </div>
          </div>

          {/* Importance slider */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Importance to matching</span>
              <span>{localImportance}%</span>
            </div>
            <Slider
              value={[localImportance]}
              onValueChange={handleImportanceChange}
              onValueCommit={handleImportanceCommit}
              min={1}
              max={100}
              step={1}
              className="w-full"
              disabled={isUpdating}
            />
          </div>

          {/* Expand/collapse button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3 text-muted-foreground hover:text-foreground"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                More
              </>
            )}
          </Button>
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4 animate-in slide-in-from-top-2 duration-200">
            {/* Description */}
            {trait.trait_library?.description && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Why this trait?</p>
                <p className="text-sm text-foreground">
                  {trait.trait_library.description}
                </p>
              </div>
            )}

            {/* Visibility dropdown */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Who can see this?</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2" disabled={isUpdating}>
                    <VisibilityIcon className="w-4 h-4" />
                    {currentVisibility.label}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {VISIBILITY_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => onUpdateVisibility(trait.id, option.value)}
                        className="gap-2"
                      >
                        <Icon className="w-4 h-4" />
                        {option.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Source info */}
            <div className="text-xs text-muted-foreground">
              Source: {trait.source === 'ai_inferred' ? 'AI suggested' : 
                      trait.source === 'admin_assigned' ? 'Admin assigned' : 
                      trait.source === 'self_declared' ? 'You added' : trait.source}
            </div>

            {/* Remove button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setShowRemoveDialog(true)}
              disabled={isUpdating}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove from my algorithm
            </Button>
          </div>
        )}
      </div>

      {/* Remove confirmation dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove trait?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{trait.trait_library?.display_name}" from your algorithm. 
              You can always add it back later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onRemove(trait.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
