import HexBadge from './HexBadge';
import LockedQuestCard from './LockedQuestCard';
import { PROGRESSION_TREES } from '@/constants/progressionTrees';

interface QuestProgressionSectionProps {
  treeId: 'culture' | 'wellness';
}

const QuestProgressionSection = ({ treeId }: QuestProgressionSectionProps) => {
  const tree = PROGRESSION_TREES[treeId];

  return (
    <section className="space-y-6 pt-6 border-t border-border">
      <h4 className="font-display font-semibold text-foreground">
        Progress & What This Unlocks
      </h4>

      <div className="flex flex-col items-center gap-6">
        {/* Hex Badge */}
        <HexBadge tree={tree} />

        {/* Locked Cards */}
        <div className="flex items-center justify-center gap-3">
          <LockedQuestCard variant={0} />
          <LockedQuestCard variant={1} />
          <LockedQuestCard variant={2} />
        </div>

        {/* Unlock message */}
        <p className="text-sm text-muted-foreground text-center">
          Come back together. See what opens.
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
