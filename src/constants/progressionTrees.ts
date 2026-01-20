/**
 * Quest Progression Trees
 * 
 * Defines the RPG-style branching progression paths that users progress through
 * as they complete quests with their squad. Choices during quests unlock different branches.
 */

export interface BranchChoice {
  label: string;           // "Chose vinyl" | "Sang together"
  leadsTo: string;         // Target quest ID
}

export interface QuestNode {
  id: string;
  title: string;
  teaser: string;
  icon: string;
  tier: 0 | 1 | 2;                              // Depth in tree (0=root, 1=first unlock, 2=deep mystery)
  status: 'root' | 'teased' | 'locked';
  branches?: BranchChoice[];                    // Choices that lead to children
  children?: string[];                          // IDs of child quests
}

export interface ProgressionTree {
  id: 'culture' | 'wellness' | 'connector';
  name: string;
  icon: string;
  colorTheme: {
    primary: string;
    glow: string;
    border: string;
  };
  tooltipTitle: string;
  tooltipDescription: string;
  affinityLabel: string;
  rootQuest: string;
  nodes: QuestNode[];
}

export const PROGRESSION_TREES: Record<'culture' | 'wellness' | 'connector', ProgressionTree> = {
  culture: {
    id: 'culture',
    name: 'Culture Path',
    icon: '🎶',
    colorTheme: {
      primary: 'hsl(330, 80%, 60%)',
      glow: 'hsl(330, 80%, 60%)',
      border: 'hsl(330, 80%, 60%)',
    },
    tooltipTitle: 'Culture Path',
    tooltipDescription: 'Music, arts, and creative experiences that spark connection.',
    affinityLabel: 'Culture affinity growing',
    rootQuest: 'mystery-concert',
    nodes: [
      {
        id: 'mystery-concert',
        title: 'Mystery Concert',
        teaser: 'Your first live music quest',
        icon: '🎵',
        tier: 0,
        status: 'root',
        branches: [
          { label: 'Chose vinyl collective', leadsTo: 'album-listening-party' },
          { label: 'Performed together', leadsTo: 'open-mic-night' },
          { label: 'Met local artists', leadsTo: 'gallery-crawl' },
        ],
        children: ['album-listening-party', 'open-mic-night', 'gallery-crawl'],
      },
      {
        id: 'album-listening-party',
        title: 'Album Drop Party',
        teaser: 'First listen, together',
        icon: '🎧',
        tier: 1,
        status: 'teased',
        children: ['vinyl-hunt', 'studio-session'],
      },
      {
        id: 'open-mic-night',
        title: 'Open Mic Night',
        teaser: 'Your squad performs',
        icon: '🎤',
        tier: 1,
        status: 'teased',
        children: ['karaoke-battle', 'songwriting-jam'],
      },
      {
        id: 'gallery-crawl',
        title: 'Secret Gallery Crawl',
        teaser: 'Hidden art spaces',
        icon: '🖼️',
        tier: 1,
        status: 'teased',
        children: ['art-class'],
      },
      {
        id: 'vinyl-hunt',
        title: '???',
        teaser: 'Mystery unlocks',
        icon: '🔒',
        tier: 2,
        status: 'locked',
      },
      {
        id: 'studio-session',
        title: '???',
        teaser: 'Mystery unlocks',
        icon: '🔒',
        tier: 2,
        status: 'locked',
      },
      {
        id: 'karaoke-battle',
        title: '???',
        teaser: 'Mystery unlocks',
        icon: '🔒',
        tier: 2,
        status: 'locked',
      },
      {
        id: 'songwriting-jam',
        title: '???',
        teaser: 'Mystery unlocks',
        icon: '🔒',
        tier: 2,
        status: 'locked',
      },
      {
        id: 'art-class',
        title: '???',
        teaser: 'Mystery unlocks',
        icon: '🔒',
        tier: 2,
        status: 'locked',
      },
    ],
  },
  wellness: {
    id: 'wellness',
    name: 'Wellness Path',
    icon: '🌿',
    colorTheme: {
      primary: 'hsl(160, 60%, 45%)',
      glow: 'hsl(160, 60%, 45%)',
      border: 'hsl(160, 60%, 45%)',
    },
    tooltipTitle: 'Wellness Path',
    tooltipDescription: 'Fitness, mindfulness, and health journeys shared together.',
    affinityLabel: 'Wellness affinity growing',
    rootQuest: 'couch-to-5k',
    nodes: [
      {
        id: 'couch-to-5k',
        title: 'Couch to 5K',
        teaser: 'Your first fitness quest',
        icon: '🏃',
        tier: 0,
        status: 'root',
        branches: [
          { label: 'Pushed your limits', leadsTo: '10k-adventure' },
          { label: 'Found your flow', leadsTo: 'sunrise-yoga' },
          { label: 'Explored new terrain', leadsTo: 'trail-expedition' },
        ],
        children: ['10k-adventure', 'sunrise-yoga', 'trail-expedition'],
      },
      {
        id: '10k-adventure',
        title: '10K Adventure',
        teaser: 'Level up together',
        icon: '🏃',
        tier: 1,
        status: 'teased',
        children: ['half-marathon', 'obstacle-course'],
      },
      {
        id: 'sunrise-yoga',
        title: 'Sunrise Yoga',
        teaser: 'Peaceful mornings',
        icon: '🧘',
        tier: 1,
        status: 'teased',
        children: ['meditation-retreat'],
      },
      {
        id: 'trail-expedition',
        title: 'Trail Expedition',
        teaser: 'Nature awaits',
        icon: '🥾',
        tier: 1,
        status: 'teased',
        children: ['camping-weekend', 'sunrise-hike'],
      },
      {
        id: 'half-marathon',
        title: '???',
        teaser: 'Mystery unlocks',
        icon: '🔒',
        tier: 2,
        status: 'locked',
      },
      {
        id: 'obstacle-course',
        title: '???',
        teaser: 'Mystery unlocks',
        icon: '🔒',
        tier: 2,
        status: 'locked',
      },
      {
        id: 'meditation-retreat',
        title: '???',
        teaser: 'Mystery unlocks',
        icon: '🔒',
        tier: 2,
        status: 'locked',
      },
      {
        id: 'camping-weekend',
        title: '???',
        teaser: 'Mystery unlocks',
        icon: '🔒',
        tier: 2,
        status: 'locked',
      },
      {
        id: 'sunrise-hike',
        title: '???',
        teaser: 'Mystery unlocks',
        icon: '🔒',
        tier: 2,
        status: 'locked',
      },
    ],
  },
  connector: {
    id: 'connector',
    name: 'Connector Path',
    icon: '🤝',
    colorTheme: {
      primary: 'hsl(35, 80%, 55%)',
      glow: 'hsl(35, 80%, 55%)',
      border: 'hsl(35, 80%, 55%)',
    },
    tooltipTitle: 'Connector Path',
    tooltipDescription: 'Experiences that deepen bonds and spark new friendships.',
    affinityLabel: 'Connector affinity growing',
    rootQuest: 'squad-game-night',
    nodes: [
      {
        id: 'squad-game-night',
        title: 'Squad Game Night',
        teaser: 'Your first social quest',
        icon: '🎲',
        tier: 0,
        status: 'root',
        branches: [
          { label: 'Competitive spirit', leadsTo: 'game-tournament' },
          { label: 'Deep conversations', leadsTo: 'dinner-party' },
          { label: 'Shared challenge', leadsTo: 'escape-room' },
        ],
        children: ['game-tournament', 'dinner-party', 'escape-room'],
      },
      {
        id: 'game-tournament',
        title: 'Game Tournament',
        teaser: 'Squad vs squad',
        icon: '🏆',
        tier: 1,
        status: 'teased',
        children: ['trivia-championship', 'arcade-night'],
      },
      {
        id: 'dinner-party',
        title: 'Dinner Party',
        teaser: 'Cook together',
        icon: '🍽️',
        tier: 1,
        status: 'teased',
        children: ['cooking-class'],
      },
      {
        id: 'escape-room',
        title: 'Escape Room',
        teaser: 'Solve together',
        icon: '🔐',
        tier: 1,
        status: 'teased',
        children: ['mystery-night', 'scavenger-hunt'],
      },
      {
        id: 'trivia-championship',
        title: '???',
        teaser: 'Mystery unlocks',
        icon: '🔒',
        tier: 2,
        status: 'locked',
      },
      {
        id: 'arcade-night',
        title: '???',
        teaser: 'Mystery unlocks',
        icon: '🔒',
        tier: 2,
        status: 'locked',
      },
      {
        id: 'cooking-class',
        title: '???',
        teaser: 'Mystery unlocks',
        icon: '🔒',
        tier: 2,
        status: 'locked',
      },
      {
        id: 'mystery-night',
        title: '???',
        teaser: 'Mystery unlocks',
        icon: '🔒',
        tier: 2,
        status: 'locked',
      },
      {
        id: 'scavenger-hunt',
        title: '???',
        teaser: 'Mystery unlocks',
        icon: '🔒',
        tier: 2,
        status: 'locked',
      },
    ],
  },
};

// Helper to get a node by ID from a tree
export function getNodeById(tree: ProgressionTree, nodeId: string): QuestNode | undefined {
  return tree.nodes.find(node => node.id === nodeId);
}

// Helper to get root node of a tree
export function getRootNode(tree: ProgressionTree): QuestNode | undefined {
  return tree.nodes.find(node => node.id === tree.rootQuest);
}

// Helper to get children nodes
export function getChildNodes(tree: ProgressionTree, parentId: string): QuestNode[] {
  const parent = getNodeById(tree, parentId);
  if (!parent?.children) return [];
  return parent.children.map(id => getNodeById(tree, id)).filter(Boolean) as QuestNode[];
}

// Helper to get branch choice for a specific child
export function getBranchChoice(tree: ProgressionTree, parentId: string, childId: string): BranchChoice | undefined {
  const parent = getNodeById(tree, parentId);
  return parent?.branches?.find(branch => branch.leadsTo === childId);
}
