import { Link } from 'react-router-dom';
import { Calendar, DollarSign, Clock, Users, Gift, ExternalLink, Star } from 'lucide-react';
import type { Quest } from '@/hooks/useQuests';
import { useQuestRating } from '@/hooks/useQuestRatings';
import { useCreatorSlug } from '@/hooks/useCreatorSlugs';
import logo from '@/assets/oc-icon.png';

const QUEST_STATUS_CONFIG: Record<Quest['status'], { label: string; color: string; ctaDisabled?: boolean }> = {
  'open': { label: 'Open', color: 'green' },
  'closed': { label: 'Full', color: 'yellow' },
  'coming-soon': { label: 'Coming Soon', color: 'gray', ctaDisabled: true },
  'completed': { label: 'Completed', color: 'muted', ctaDisabled: true },
};

interface QuestCardProps {
  quest: Quest;
  onClick: () => void;
}

const themeColorStyles: Record<Quest['themeColor'], string> = {
  pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

const statusColorStyles: Record<string, string> = {
  green: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
  yellow: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
  gray: 'bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-600',
  muted: 'bg-muted text-muted-foreground border-border',
};

const QuestCard = ({ quest, onClick }: QuestCardProps) => {
  const statusConfig = QUEST_STATUS_CONFIG[quest.status];
  const statusLabel = statusConfig.label;
  const statusStyles = statusColorStyles[statusConfig.color];
  const themeStyles = themeColorStyles[quest.themeColor];
  
  // Fetch rating for this quest
  const { rating, reviewCount } = useQuestRating(quest.id);
  
  // Fetch creator slug for linking
  const { data: creatorInfo } = useCreatorSlug(
    quest.creatorType === 'community' ? quest.creatorId : undefined
  );

  const handleCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      aria-label={`View details for ${quest.title}`}
    >
      {/* Hero Image */}
      <div className="relative h-40 w-full overflow-hidden">
        <img 
          src={quest.image} 
          alt={quest.imageAlt}
          className="w-full h-full object-cover"
        />
        {/* Status Badge Overlay */}
        <span className={`absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full border backdrop-blur-sm ${statusStyles}`}>
          {statusLabel}
        </span>
        {/* Theme Tag Overlay */}
        <span className={`absolute bottom-3 left-3 text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm ${themeStyles}`}>
          {quest.theme}
        </span>
      </div>

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl" role="img" aria-hidden="true">
            {quest.icon}
          </span>
          <h3 className="font-display text-lg font-semibold text-foreground">
            {quest.title}
          </h3>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
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
        <p className="text-muted-foreground text-sm mb-3">
          {quest.shortDescription}
        </p>

        {/* Rewards Preview */}
        <div className="flex items-start gap-2 text-sm font-medium text-primary mb-3 bg-primary/5 rounded-lg p-2.5">
          <Gift className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{quest.rewards}</span>
        </div>

        {/* Rating + Creator Attribution Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Star Rating - only show if there are reviews */}
            {reviewCount > 0 && rating !== null && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
                <span className="text-muted-foreground">({reviewCount})</span>
              </div>
            )}
            
            {/* Creator Attribution */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {quest.creatorType === 'openclique' || !quest.creatorType ? (
                <>
                  <img src={logo} alt="OpenClique" className="w-4 h-4 rounded-full" />
                  <span>OpenClique</span>
                </>
              ) : quest.creatorType === 'community' ? (
                <>
                  <span className="w-4 h-4 rounded-full bg-creator/20 flex items-center justify-center text-[10px]">👤</span>
                  {creatorInfo?.slug ? (
                    <Link
                      to={`/creators/${creatorInfo.slug}`}
                      onClick={handleCreatorClick}
                      className="hover:text-primary hover:underline transition-colors"
                    >
                      {quest.creatorName || 'Community'}
                    </Link>
                  ) : (
                    <span>{quest.creatorName || 'Community'}</span>
                  )}
                  {quest.creatorSocialUrl && (
                    <ExternalLink className="w-3 h-3 text-primary" />
                  )}
                </>
              ) : (
                <>
                  <span className="w-4 h-4 rounded-full bg-sunset/20 flex items-center justify-center text-[10px]">🤝</span>
                  <span>{quest.creatorName || 'Partner'}</span>
                </>
              )}
            </div>
          </div>
          
          {/* View Details Link */}
          <span className="text-primary font-medium text-sm inline-flex items-center gap-1">
            Details →
          </span>
        </div>
      </div>
    </button>
  );
};

export default QuestCard;
