/**
 * Quest Type Definitions
 * 
 * Shared interfaces for quest data structures.
 */

export interface QuestSection {
  title: string;
  content: string | string[];
  type?: 'text' | 'list' | 'timeline';
}

export interface Quest {
  id: string;
  icon: string;
  title: string;
  image: string;
  imageAlt: string;
  status: 'pilot' | 'coming-soon';
  statusLabel: string;
  theme: string;
  themeColor: 'pink' | 'green' | 'amber' | 'purple';
  rewards: string;
  metadata: {
    date: string;
    cost: string;
    duration: string;
    squadSize: string;
  };
  shortDescription: string;
  sections: QuestSection[];
  progressionTree: 'culture' | 'wellness' | 'connector';
}
