import HexBadge from './HexBadge';
import LockedQuestCard from './LockedQuestCard';
import TeasedQuestCard from './TeasedQuestCard';
import { PROGRESSION_TREES } from '@/constants/progressionTrees';

interface QuestProgressionSectionProps {
  treeId: 'culture' | 'wellness';
}

const QuestProgressionSection = ({ treeId }: QuestProgressionSectionProps) => {
  const tree = PROGRESSION_TREES[treeId];
  const { unlockables } = tree;

  return (
    <section className="space-y-6 pt-6 border-t border-border">
      <h4 className="font-display font-semibold text-foreground">
        Progress & What This Unlocks
      </h4>

      <div className="flex flex-col items-center gap-6">
        {/* Hex Badge */}
        <HexBadge tree={tree} />

        {/* Unlockable Cards - mix of teased and locked */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {unlockables.map((quest, index) => (
            quest.isTeased ? (
              <TeasedQuestCard 
                key={quest.id}
                title={quest.title}
                teaser={quest.teaser}
                icon={quest.icon}
              />
            ) : (
              <LockedQuestCard key={quest.id} variant={index} />
            )
          ))}
        </div>

        {/* Unlock message */}
        <p className="text-sm text-muted-foreground text-center">
          Choices during your quest shape what opens next.
        </p>

        {/* Affinity line */}
        <div className="flex items-center gap-2 text-sm">
          <span role="img" aria-hidden="true">
            {tree.icon}
          </span>
          <span className="text-muted-foreground">
            {tree.affinityLabel}
          </span>
        </div>
      </div>
    </section>
  );
};

export default QuestProgressionSection;
