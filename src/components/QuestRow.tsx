import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import QuestCard from '@/components/QuestCard';
import type { Quest } from '@/hooks/useQuests';

interface QuestRowProps {
  title: string;
  icon?: string;
  quests: Quest[];
  onQuestClick: (quest: Quest) => void;
  seeAllLink?: string;
  creatorSlug?: string;
  creatorName?: string;
}

const QuestRow = ({
  title,
  icon,
  quests,
  onQuestClick,
  seeAllLink,
  creatorSlug,
  creatorName,
}: QuestRowProps) => {
  if (quests.length === 0) return null;

  return (
    <section className="space-y-3">
      {/* Row Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="font-display text-lg md:text-xl font-semibold text-foreground flex items-center gap-2">
          {icon && <span className="text-xl">{icon}</span>}
          <span>{title}</span>
          <span className="text-sm font-normal text-muted-foreground">
            ({quests.length})
          </span>
        </h2>
        <div className="flex items-center gap-3">
          {creatorSlug && (
            <Link
              to={`/creators/${creatorSlug}`}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View {creatorName ? `${creatorName}'s` : ''} Profile
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
          {seeAllLink && !creatorSlug && (
            <Link
              to={seeAllLink}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              See All
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Carousel */}
      <Carousel
        opts={{
          align: 'start',
          dragFree: true,
          skipSnaps: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-3 md:-ml-4">
          {quests.map((quest) => (
            <CarouselItem
              key={quest.id}
              className="pl-3 md:pl-4 basis-[280px] md:basis-[320px] lg:basis-[340px]"
            >
              <QuestCard quest={quest} onClick={() => onQuestClick(quest)} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-3 lg:-left-5" />
        <CarouselNext className="hidden md:flex -right-3 lg:-right-5" />
      </Carousel>
    </section>
  );
};

export default QuestRow;
