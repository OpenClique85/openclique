/**
 * Quest Progression Trees
 * 
 * Defines the talent-tree inspired paths that users progress through
 * as they complete quests with their squad.
 */

export interface UnlockableQuest {
  id: string;
  title: string;
  teaser: string;
  icon: string;
  unlockCondition: string;
  isTeased: boolean; // True = visible but not unlocked, False = mystery/locked
}

export interface ProgressionTree {
  id: 'culture' | 'wellness';
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
  unlockables: UnlockableQuest[];
}

export const PROGRESSION_TREES: Record<'culture' | 'wellness', ProgressionTree> = {
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
    unlockables: [
      {
        id: 'album-listening-party',
        title: 'Album Drop Party',
        teaser: 'First listen, together',
        icon: '🎧',
        unlockCondition: 'Complete Mystery Concert',
        isTeased: true,
      },
      {
        id: 'open-mic-night',
        title: 'Open Mic Night',
        teaser: 'Your squad performs',
        icon: '🎤',
        unlockCondition: 'Complete 2 Culture quests',
        isTeased: false,
      },
      {
        id: 'gallery-crawl',
        title: 'Secret Gallery Crawl',
        teaser: '???',
        icon: '🖼️',
        unlockCondition: 'Squad choice unlocks this',
        isTeased: false,
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
    unlockables: [
      {
        id: '10k-adventure',
        title: '10K Adventure',
        teaser: 'Level up together',
        icon: '🏃',
        unlockCondition: 'Complete Couch to 5K',
        isTeased: true,
      },
      {
        id: 'sunrise-yoga',
        title: 'Sunrise Yoga',
        teaser: 'Peaceful mornings',
        icon: '🧘',
        unlockCondition: 'Complete 2 Wellness quests',
        isTeased: false,
      },
      {
        id: 'trail-expedition',
        title: 'Trail Expedition',
        teaser: '???',
        icon: '🥾',
        unlockCondition: 'Squad choice unlocks this',
        isTeased: false,
      },
    ],
  },
};
