import { Calendar, DollarSign, Clock, Users } from 'lucide-react';
import type { Quest } from '@/constants/quests';

interface QuestCardProps {
  quest: Quest;
  onClick: () => void;
}

const QuestCard = ({ quest, onClick }: QuestCardProps) => {
  const statusStyles = quest.status === 'pilot' 
    ? 'bg-sunset/10 text-sunset border-sunset/20' 
    : 'bg-muted text-muted-foreground border-border';

  const themeStyles = quest.themeColor === 'pink'
    ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300'
    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      aria-label={`View details for ${quest.title}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl" role="img" aria-hidden="true">
            {quest.icon}
          </span>
          <h3 className="font-display text-xl font-semibold text-foreground">
            {quest.title}
          </h3>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap ${statusStyles}`}>
          {quest.statusLabel}
        </span>
      </div>

      {/* Theme Tag */}
      <div className="mb-4">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${themeStyles}`}>
          {quest.theme}
        </span>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4 shrink-0" />
          <span className="truncate">{quest.metadata.date}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <DollarSign className="w-4 h-4 shrink-0" />
          <span className="truncate">{quest.metadata.cost}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4 shrink-0" />
          <span className="truncate">{quest.metadata.duration}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="w-4 h-4 shrink-0" />
          <span className="truncate">{quest.metadata.squadSize}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-muted-foreground text-sm mb-4">
        {quest.shortDescription}
      </p>

      {/* View Details Link */}
      <span className="text-primary font-medium text-sm inline-flex items-center gap-1 group-hover:underline">
        View Details →
      </span>
    </button>
  );
};

export default QuestCard;
