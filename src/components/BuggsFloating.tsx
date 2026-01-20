import buggsFace from '@/assets/buggs-face.png';
import buggsSitting from '@/assets/buggs-sitting.png';
import buggsFront from '@/assets/buggs-front.png';
import buggsHopping from '@/assets/buggs-hopping.png';

type BuggsPose = 'face' | 'sitting' | 'front' | 'hopping';

interface BuggsFloatingProps {
  position?: 'bottom-right' | 'bottom-left';
  message?: string;
  pose?: BuggsPose;
}

const poseImages: Record<BuggsPose, string> = {
  face: buggsFace,
  sitting: buggsSitting,
  front: buggsFront,
  hopping: buggsHopping,
};

const BuggsFloating = ({ 
  position = 'bottom-right', 
  message,
  pose = 'face',
}: BuggsFloatingProps) => {
  const positionClasses = position === 'bottom-right' 
    ? 'right-4 bottom-4' 
    : 'left-4 bottom-4';

  const buggsImage = poseImages[pose];

  return (
    <div className={`fixed ${positionClasses} z-40 flex items-end gap-2`}>
      {message && (
        <div className="bg-card border border-border rounded-xl px-4 py-2 shadow-lg max-w-[200px] animate-fade-in">
          <p className="text-sm text-muted-foreground">{message}</p>
          <div className="absolute -bottom-1 right-4 w-3 h-3 bg-card border-r border-b border-border transform rotate-45" />
        </div>
      )}
      <div className="w-14 h-14 rounded-full bg-background border-2 border-primary/20 shadow-lg flex items-center justify-center hover:scale-110 transition-transform cursor-pointer group overflow-hidden">
        <img 
          src={buggsImage} 
          alt="BUGGS - Your squad guide"
          className="w-12 h-12 object-contain"
        />
        <div className="absolute -top-8 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Hi! I'm BUGGS 🐰
        </div>
      </div>
    </div>
  );
};

export default BuggsFloating;
