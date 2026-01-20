import { Lock } from 'lucide-react';

interface LockedQuestCardProps {
  variant?: number;
}

const LockedQuestCard = ({ variant = 0 }: LockedQuestCardProps) => {
  // Subtle gradient variations for visual interest
  const gradients = [
    'from-muted/60 via-muted/40 to-muted/50',
    'from-muted/50 via-muted/60 to-muted/40',
    'from-muted/40 via-muted/50 to-muted/60',
  ];

  return (
    <div
      className={`
        relative w-24 h-28 rounded-xl 
        bg-gradient-to-br ${gradients[variant % 3]}
        border border-dashed border-border/60
        backdrop-blur-sm
        flex items-center justify-center
        transition-all duration-300
        hover:border-border hover:scale-[1.02]
      `}
      aria-label="Locked experience"
    >
      {/* Blur overlay */}
      <div className="absolute inset-0 rounded-xl bg-background/20 backdrop-blur-[2px]" />
      
      {/* Lock icon */}
      <Lock 
        className="w-6 h-6 text-muted-foreground/50 z-10" 
        aria-hidden="true"
      />
    </div>
  );
};

export default LockedQuestCard;
