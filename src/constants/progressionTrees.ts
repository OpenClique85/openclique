/**
 * Quest Progression Trees
 * 
 * Defines the talent-tree inspired paths that users progress through
 * as they complete quests with their squad.
 */

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
  },
};
