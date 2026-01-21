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

export type QuestStatus = 'open' | 'limited' | 'closed' | 'past' | 'coming-soon';

export const QUEST_STATUS_CONFIG: Record<QuestStatus, {
  label: string;
  color: 'green' | 'yellow' | 'red' | 'gray' | 'muted';
  ctaText: string;
  ctaDisabled: boolean;
}> = {
  open: {
    label: 'Open - Join Now',
    color: 'green',
    ctaText: 'Join This Quest',
    ctaDisabled: false,
  },
  limited: {
    label: 'Limited Spots',
    color: 'yellow',
    ctaText: 'Claim Your Spot',
    ctaDisabled: false,
  },
  closed: {
    label: 'Closed',
    color: 'red',
    ctaText: 'Quest Full',
    ctaDisabled: true,
  },
  past: {
    label: 'Past Event',
    color: 'gray',
    ctaText: 'Event Ended',
    ctaDisabled: true,
  },
  'coming-soon': {
    label: 'Coming Soon',
    color: 'muted',
    ctaText: 'Get Notified',
    ctaDisabled: false,
  },
};

export interface Quest {
  id: string;
  icon: string;
  title: string;
  image: string;
  imageAlt: string;
  status: QuestStatus;
  statusLabel?: string; // Optional override for status label
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
