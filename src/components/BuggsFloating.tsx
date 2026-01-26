import { useNavigate } from 'react-router-dom';
import buggsFace from '@/assets/buggs-face.png';
import buggsSitting from '@/assets/buggs-sitting.png';
import buggsFront from '@/assets/buggs-front.png';
import buggsHopping from '@/assets/buggs-hopping.png';

type BuggsPose = 'face' | 'sitting' | 'front' | 'hopping';

interface BuggsFloatingProps {
  position?: 'bottom-right' | 'bottom-left';
  message?: string;
  pose?: BuggsPose;
  onClick?: () => void;
  linkTo?: string;
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
  onClick,
  linkTo = '/quests',
}: BuggsFloatingProps) => {
  const navigate = useNavigate();
  
  const positionClasses = position === 'bottom-right' 
    ? 'right-4 bottom-4' 
    : 'left-4 bottom-4';

  const buggsImage = poseImages[pose];

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (linkTo) {
      navigate(linkTo);
    }
  };

  return (
    <button 
      onClick={handleClick}
      className={`fixed ${positionClasses} z-40 flex items-end gap-2 cursor-pointer group`}
      aria-label="Find your clique"
    >
      {message && (
        <div className="bg-card border border-border rounded-xl px-4 py-2 shadow-lg max-w-[200px] animate-fade-in group-hover:bg-accent transition-colors">
          <p className="text-sm text-muted-foreground">{message}</p>
          <div className="absolute -bottom-1 right-4 w-3 h-3 bg-card border-r border-b border-border transform rotate-45 group-hover:bg-accent transition-colors" />
        </div>
      )}
      <div className="w-14 h-14 rounded-full bg-background border-2 border-primary/20 shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform overflow-hidden">
        <img 
          src={buggsImage} 
          alt="BUGGS - Your clique guide"
          className="w-12 h-12 object-contain"
        />
        <div className="absolute -top-8 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Hi! I'm BUGGS 🐰
        </div>
      </div>
    </button>
  );
};

export default BuggsFloating;
