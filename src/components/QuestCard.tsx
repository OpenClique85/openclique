import { Calendar } from 'lucide-react';
import type { Quest } from '@/hooks/useQuests';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

const QUEST_STATUS_CONFIG: Record<Quest['status'], { label: string; color: string }> = {
  'open': { label: 'Open', color: 'green' },
  'closed': { label: 'Full', color: 'yellow' },
  'coming-soon': { label: 'Coming Soon', color: 'gray' },
  'completed': { label: 'Completed', color: 'muted' },
};

interface QuestCardProps {
  quest: Quest;
  onClick: () => void;
}

const statusColorStyles: Record<string, string> = {
  green: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
  yellow: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
  gray: 'bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-600',
  muted: 'bg-muted text-muted-foreground border-border',
};

const QuestCard = ({ quest, onClick }: QuestCardProps) => {
  const statusConfig = QUEST_STATUS_CONFIG[quest.status];
  const statusStyles = statusColorStyles[statusConfig.color];

  return (
    <button
      onClick={onClick}
      className="w-full h-full text-left bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 flex flex-col group"
      aria-label={`View details for ${quest.title}`}
    >
      {/* Hero Image with overlaid info */}
      <div className="relative h-44 w-full overflow-hidden flex-shrink-0">
        <img 
          src={quest.image} 
          alt={quest.imageAlt}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Status Badge */}
        <span className={`absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full border backdrop-blur-sm tracking-wide ${statusStyles}`}>
          {statusConfig.label}
        </span>
        
        {/* Sponsored Badge */}
        {quest.isSponsored && (
          <Badge 
            variant="secondary" 
            className="absolute top-3 left-3 text-xs backdrop-blur-sm bg-sunset/90 text-white border-sunset hover:bg-sunset tracking-wide"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Sponsored
          </Badge>
        )}

        {/* Title overlaid on image */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-hidden="true">
              {quest.icon}
            </span>
            <h3 className="font-display text-lg font-semibold text-white drop-shadow-md line-clamp-2">
              {quest.title}
            </h3>
          </div>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Calendar className="w-4 h-4 shrink-0 text-primary" />
          <span>{quest.metadata.date}</span>
        </div>

        {/* Description */}
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2 leading-relaxed flex-1">
          {quest.shortDescription}
        </p>

        {/* View Quest CTA */}
        <span className="text-primary font-semibold text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all">
          View Quest →
        </span>
      </div>
    </button>
  );
};

export default QuestCard;
