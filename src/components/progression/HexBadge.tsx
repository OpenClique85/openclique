import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { ProgressionTree } from '@/constants/progressionTrees';

interface HexBadgeProps {
  tree: ProgressionTree;
}

const HexBadge = ({ tree }: HexBadgeProps) => {
  const hexClipPath = 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="group relative flex flex-col items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg p-2"
          role="button"
          aria-label={`View ${tree.name} info`}
        >
          {/* Hex container */}
          <div className="relative w-20 h-20">
            {/* Glow effect */}
            <div
              className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-300 blur-md"
              style={{
                clipPath: hexClipPath,
                backgroundColor: tree.colorTheme.glow,
              }}
            />
            
            {/* Hex outline */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-all duration-300"
              style={{
                clipPath: hexClipPath,
                background: `linear-gradient(135deg, ${tree.colorTheme.primary}15, ${tree.colorTheme.primary}08)`,
                boxShadow: `inset 0 0 20px ${tree.colorTheme.glow}30`,
              }}
            >
              {/* Inner border effect */}
              <div
                className="absolute inset-[2px]"
                style={{
                  clipPath: hexClipPath,
                  border: `2px solid ${tree.colorTheme.border}`,
                  background: 'transparent',
                }}
              />
              
              {/* Icon */}
              <span className="text-3xl z-10" role="img" aria-hidden="true">
                {tree.icon}
              </span>
            </div>
          </div>
          
          {/* Label */}
          <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            {tree.name}
          </span>
        </button>
      </PopoverTrigger>
      
      <PopoverContent className="w-64 p-4" align="center">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xl" role="img" aria-hidden="true">
              {tree.icon}
            </span>
            <h4 className="font-display font-semibold text-foreground">
              {tree.tooltipTitle}
            </h4>
          </div>
          <p className="text-sm text-muted-foreground">
            {tree.tooltipDescription}
          </p>
          <p className="text-xs text-muted-foreground/80 pt-1 border-t border-border">
            Complete quests together to unlock more.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default HexBadge;
