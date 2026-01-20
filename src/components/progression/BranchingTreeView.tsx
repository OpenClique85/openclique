import { ProgressionTree, getRootNode, getChildNodes, getBranchChoice } from '@/constants/progressionTrees';
import TreeNode from './TreeNode';
import BranchLabel from './BranchLabel';
import buggsHopping from '@/assets/buggs-hopping.png';

interface BranchingTreeViewProps {
  tree: ProgressionTree;
}

const BranchingTreeView = ({ tree }: BranchingTreeViewProps) => {
  const rootNode = getRootNode(tree);
  const tier1Nodes = rootNode ? getChildNodes(tree, rootNode.id) : [];
  
  // Get tier 2 nodes for each tier 1 node
  const tier2Groups = tier1Nodes.map(t1Node => ({
    parent: t1Node,
    children: getChildNodes(tree, t1Node.id),
  }));

  if (!rootNode) return null;

  return (
    <div className="relative w-full flex flex-col items-center py-6">
      {/* Root Node */}
      <div className="relative z-10">
        <TreeNode node={rootNode} colorTheme={tree.colorTheme} size="lg" />
      </div>

      {/* Connector line from root */}
      <div 
        className="w-0.5 h-8"
        style={{ backgroundColor: `${tree.colorTheme.primary}40` }}
      />

      {/* Branch split indicator */}
      <div 
        className="w-48 md:w-64 h-0.5 rounded-full"
        style={{ backgroundColor: `${tree.colorTheme.primary}30` }}
      />

      {/* Tier 1: Teased Nodes with branch labels */}
      <div className="flex items-start justify-center gap-2 md:gap-4 mt-4 flex-wrap">
        {tier1Nodes.map((node, index) => {
          const branchChoice = getBranchChoice(tree, rootNode.id, node.id);
          return (
            <div key={node.id} className="flex flex-col items-center gap-2">
              {/* Branch label */}
              {branchChoice && (
                <BranchLabel label={branchChoice.label} colorTheme={tree.colorTheme} />
              )}
              
              {/* Vertical connector */}
              <div 
                className="w-0.5 h-4"
                style={{ backgroundColor: `${tree.colorTheme.primary}30` }}
              />
              
              {/* Tier 1 Node */}
              <TreeNode node={node} colorTheme={tree.colorTheme} size="md" />
              
              {/* Connectors to tier 2 */}
              {tier2Groups[index].children.length > 0 && (
                <>
                  <div 
                    className="w-0.5 h-4"
                    style={{ backgroundColor: `${tree.colorTheme.primary}20` }}
                  />
                  
                  {/* Tier 2: Locked mystery nodes */}
                  <div className="flex items-center gap-1">
                    {tier2Groups[index].children.slice(0, 2).map((child) => (
                      <TreeNode 
                        key={child.id} 
                        node={child} 
                        colorTheme={tree.colorTheme} 
                        size="sm" 
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* BUGGS hopping alongside */}
      <div className="absolute -right-2 md:right-4 bottom-0 opacity-60 hidden md:block">
        <img 
          src={buggsHopping}
          alt="BUGGS guiding your journey"
          className="w-16 h-16 object-contain"
        />
      </div>

      {/* Affinity indicator */}
      <div className="mt-8 flex items-center gap-2 text-sm">
        <span role="img" aria-hidden="true">{tree.icon}</span>
        <span className="text-muted-foreground">{tree.affinityLabel}</span>
      </div>
    </div>
  );
};

export default BranchingTreeView;
