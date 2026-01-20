import { Sparkles } from 'lucide-react';

interface TeasedQuestCardProps {
  title: string;
  teaser: string;
  icon: string;
}

const TeasedQuestCard = ({ title, teaser, icon }: TeasedQuestCardProps) => {
  return (
    <div 
      className="relative w-[100px] h-[120px] rounded-xl border-2 border-dashed border-primary/40 bg-gradient-to-br from-primary/10 to-accent/10 flex flex-col items-center justify-center p-3 transition-all hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10"
      aria-label="Teased upcoming experience"
    >
      {/* Sparkle indicator */}
      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
        <Sparkles className="w-3 h-3 text-primary" />
      </div>
      
      {/* Icon */}
      <span className="text-2xl mb-2" role="img" aria-hidden="true">
        {icon}
      </span>
      
      {/* Title hint */}
      <p className="text-xs font-medium text-foreground text-center line-clamp-2">
        {title}
      </p>
      
      {/* Teaser */}
      <p className="text-[10px] text-muted-foreground text-center mt-1">
        {teaser}
      </p>
    </div>
  );
};

export default TeasedQuestCard;
