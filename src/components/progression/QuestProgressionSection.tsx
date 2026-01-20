import HexBadge from './HexBadge';
import TreeNode from './TreeNode';
import { PROGRESSION_TREES, getChildNodes, getRootNode } from '@/constants/progressionTrees';

interface QuestProgressionSectionProps {
  treeId: 'culture' | 'wellness' | 'connector';
}

const QuestProgressionSection = ({ treeId }: QuestProgressionSectionProps) => {
  const tree = PROGRESSION_TREES[treeId];
  const rootNode = getRootNode(tree);
  const tier1Nodes = rootNode ? getChildNodes(tree, rootNode.id) : [];

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
          {tier1Nodes.slice(0, 3).map((node) => (
            <TreeNode 
              key={node.id} 
              node={node} 
              colorTheme={tree.colorTheme} 
              size="md"
            />
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
