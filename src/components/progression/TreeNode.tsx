import { Lock } from 'lucide-react';
import { QuestNode } from '@/constants/progressionTrees';

interface TreeNodeProps {
  node: QuestNode;
  colorTheme: {
    primary: string;
    glow: string;
    border: string;
  };
  size?: 'sm' | 'md' | 'lg';
}

const TreeNode = ({ node, colorTheme, size = 'md' }: TreeNodeProps) => {
  const sizeClasses = {
    sm: 'w-16 h-20',
    md: 'w-20 h-24',
    lg: 'w-24 h-28',
  };

  const iconSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const textSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
  };

  if (node.status === 'locked') {
    return (
      <div 
        className={`${sizeClasses[size]} rounded-xl bg-muted/50 backdrop-blur-sm border border-border flex flex-col items-center justify-center p-2 relative overflow-hidden`}
      >
        {/* Blur overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-muted/80 to-muted/60 backdrop-blur-md" />
        
        {/* Lock icon */}
        <div className="relative z-10 flex flex-col items-center gap-1">
          <Lock className="w-5 h-5 text-muted-foreground/60" />
          <span className={`${textSizes[size]} font-medium text-muted-foreground/60`}>???</span>
        </div>
      </div>
    );
  }

  if (node.status === 'teased') {
    return (
      <div 
        className={`${sizeClasses[size]} rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-2 relative transition-all hover:scale-105`}
        style={{ 
          borderColor: colorTheme.border,
          background: `linear-gradient(135deg, ${colorTheme.primary}15, ${colorTheme.glow}10)`,
        }}
      >
        {/* Sparkle indicator */}
        <div 
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse"
          style={{ backgroundColor: colorTheme.primary }}
        />
        
        <span className={iconSizes[size]} role="img" aria-hidden="true">
          {node.icon}
        </span>
        <p className={`${textSizes[size]} font-medium text-foreground text-center mt-1 line-clamp-2`}>
          {node.title}
        </p>
      </div>
    );
  }

  // Root node - filled style
  return (
    <div 
      className={`${sizeClasses[size]} rounded-xl flex flex-col items-center justify-center p-2 relative transition-all hover:scale-105 shadow-lg`}
      style={{ 
        background: `linear-gradient(135deg, ${colorTheme.primary}, ${colorTheme.glow})`,
        boxShadow: `0 4px 20px ${colorTheme.primary}40`,
      }}
    >
      <span className={`${iconSizes[size]} drop-shadow-md`} role="img" aria-hidden="true">
        {node.icon}
      </span>
      <p className={`${textSizes[size]} font-semibold text-white text-center mt-1 line-clamp-2 drop-shadow-sm`}>
        {node.title}
      </p>
    </div>
  );
};

export default TreeNode;
