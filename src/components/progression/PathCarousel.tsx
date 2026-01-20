import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PROGRESSION_TREES, ProgressionTree } from '@/constants/progressionTrees';
import BranchingTreeView from './BranchingTreeView';
import { Button } from '@/components/ui/button';

type PathId = 'culture' | 'wellness' | 'connector';

const paths: PathId[] = ['culture', 'wellness', 'connector'];

const PathCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const activePath = paths[activeIndex];
  const activeTree = PROGRESSION_TREES[activePath];

  const goToPrev = () => {
    setActiveIndex((prev) => (prev === 0 ? paths.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev === paths.length - 1 ? 0 : prev + 1));
  };

  const goToPath = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <div className="w-full">
      {/* Path Navigation Tabs */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrev}
          className="h-8 w-8 hidden md:flex"
          aria-label="Previous path"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1 bg-muted/50 rounded-full p-1">
          {paths.map((pathId, index) => {
            const tree = PROGRESSION_TREES[pathId];
            const isActive = index === activeIndex;
            
            return (
              <button
                key={pathId}
                onClick={() => goToPath(index)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-card shadow-sm' 
                    : 'hover:bg-card/50 text-muted-foreground'
                  }
                `}
                style={isActive ? {
                  color: tree.colorTheme.primary,
                } : undefined}
              >
                <span role="img" aria-hidden="true">{tree.icon}</span>
                <span className="hidden sm:inline">{tree.name.replace(' Path', '')}</span>
              </button>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={goToNext}
          className="h-8 w-8 hidden md:flex"
          aria-label="Next path"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Tree View */}
      <div className="bg-card rounded-2xl border border-border p-4 md:p-8 overflow-hidden">
        <BranchingTreeView tree={activeTree} />
      </div>

      {/* Dot indicators for mobile */}
      <div className="flex items-center justify-center gap-2 mt-4 md:hidden">
        {paths.map((_, index) => (
          <button
            key={index}
            onClick={() => goToPath(index)}
            className={`
              w-2 h-2 rounded-full transition-all
              ${index === activeIndex 
                ? 'bg-primary scale-125' 
                : 'bg-muted-foreground/30'
              }
            `}
            aria-label={`Go to ${paths[index]} path`}
          />
        ))}
      </div>

      {/* Path description */}
      <p className="text-center text-sm text-muted-foreground mt-6 max-w-md mx-auto">
        {activeTree.tooltipDescription}
      </p>
    </div>
  );
};

export default PathCarousel;
