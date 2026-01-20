/**
 * OpenClique Quest Data
 * 
 * This file contains all quest information displayed on the Quests page.
 * Each quest has card-level info and full modal details.
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
  status: 'pilot' | 'coming-soon';
  statusLabel: string;
  theme: string;
  themeColor: 'pink' | 'green';
  metadata: {
    date: string;
    cost: string;
    duration: string;
    squadSize: string;
  };
  shortDescription: string;
  sections: QuestSection[];
}

export const QUESTS: Quest[] = [
  {
    id: 'mystery-concert-ladies-night',
    icon: '🎸',
    title: 'Mystery Concert — Ladies Night',
    status: 'pilot',
    statusLabel: 'Pilot - Limited Spots',
    theme: 'Ladies Night',
    themeColor: 'pink',
    metadata: {
      date: 'Thu, Jan 22, 5:00 PM',
      cost: 'Dinner on you, concert free',
      duration: '3 hours',
      squadSize: '5-6 people',
    },
    shortDescription: 'Guided dinner, group walk, mystery concert reveal. BUGGS handles the vibes.',
    sections: [
      {
        title: 'When & Where',
        type: 'timeline',
        content: [
          '5:00 PM — Meet at Sapori Italian Roots (800 Brazos St)',
          '6:45 PM — Group walk to concert venue (revealed during dinner)',
          '7:00 PM — Mystery concert begins',
        ],
      },
      {
        title: 'Theme & Dress Code',
        type: 'text',
        content: 'Ladies Night | Dress to impress',
      },
      {
        title: 'How It Works',
        type: 'text',
        content: "You'll join a private WhatsApp group with your squad and BUGGS (Behavioral Utility for Group Guidance & Structure).",
      },
      {
        title: 'BUGGS keeps the experience flowing by:',
        type: 'list',
        content: [
          'Starting with light icebreakers',
          'Assigning optional mini roles or secret objectives',
          'Sharing timing and logistics',
          'Revealing clues that lead to the mystery concert',
        ],
      },
      {
        title: 'Discovery Note',
        type: 'text',
        content: 'No genre hints. Discovery is part of the experience.',
      },
      {
        title: "What You'll Pay",
        type: 'list',
        content: [
          'Concert: Free (covered by OpenClique)',
          'Dinner & drinks: On you (order what you like)',
          'Some objectives may unlock free drinks or discounts (not guaranteed)',
        ],
      },
      {
        title: 'Expectations',
        type: 'list',
        content: [
          'Stay with the group for the full experience',
          'Communicate in the group if plans change or you need accommodations',
          'This is a learning pilot — honest feedback helps us improve',
        ],
      },
      {
        title: 'Bonus Objectives (Optional)',
        type: 'text',
        content: 'Some participants may be prompted to capture photos or short videos, lean into the theme or creative challenges, or participate in a post-quest survey or short interview (with additional incentives). Content may be featured on OpenClique website or socials.',
      },
      {
        title: 'Best For',
        type: 'list',
        content: [
          'Women who love live music but hate going alone',
          'Anyone who wants structure without pressure',
          'People who appreciate a little mystery',
          'Those who want an AI to handle the awkward parts',
        ],
      },
      {
        title: 'Safety Note',
        type: 'text',
        content: 'All activities take place in public venues. Participation is voluntary, and personal safety decisions are up to you. OpenClique provides coordination and structure but is not responsible for individual behavior. Use your judgment and communicate if you need support.',
      },
    ],
  },
  {
    id: 'couch-to-5k-squad',
    icon: '👟',
    title: 'Couch to 5K Squad',
    status: 'coming-soon',
    statusLabel: 'Coming Soon',
    theme: 'Beginner Runners',
    themeColor: 'green',
    metadata: {
      date: 'Starting February',
      cost: '$40 total (2 months)',
      duration: '8 weeks, 2x/week',
      squadSize: '4-5 people',
    },
    shortDescription: 'Zero to 5K with your squad. GPS art challenges. BUGGS-guided accountability.',
    sections: [
      {
        title: 'When & Where',
        type: 'list',
        content: [
          'Start Date: February 2025 (exact date TBD)',
          'Schedule: 8 weeks, 2 sessions per week',
          'Time Options: Morning track (7-8am) OR Evening track (6-7pm)',
          'Locations: Rotating Austin running spots (confirmed upon signup)',
        ],
      },
      {
        title: 'How It Works',
        type: 'text',
        content: "Go from non-runner to 5K finisher with a squad of beginners matched to your pace. Follow a proven training program with fun challenges and built-in accountability.",
      },
      {
        title: 'Experience Flow',
        type: 'list',
        content: [
          'Pre-quest fitness assessment and goal-setting',
          'Meet your squad (matched by pace and schedule preference)',
          '16 group training sessions over 8 weeks',
          'Weekly GPS art challenges (run routes that draw shapes on Strava)',
          'Milestone celebrations every 2 weeks',
          'Final celebration 5K race together',
        ],
      },
      {
        title: "BUGGS manages your squad's WhatsApp group with:",
        type: 'list',
        content: [
          'Training reminders and motivation',
          'GPS art challenge prompts',
          'Encouraging messages when you need them',
          '"Surprise support" coordination along routes',
        ],
      },
      {
        title: "What's Included",
        type: 'list',
        content: [
          'Structured 8-week training plan (app-guided)',
          '16 group training sessions',
          'Squad WhatsApp group with BUGGS',
          'OpenClique running shirt',
          'Celebration 5K race entry',
          'Access to alumni running community',
        ],
      },
      {
        title: "What You'll Earn",
        type: 'list',
        content: [
          '$25 local running store gift card (upon completion)',
          '20% off future 10K race entries',
          'Invitations to alumni running groups',
          'Graduation celebration brunch',
        ],
      },
      {
        title: 'Cost',
        type: 'text',
        content: '$40 total ($20/month for 2 months). Covers training plan, group coordination, swag, race entry, and rewards.',
      },
      {
        title: 'Best For',
        type: 'list',
        content: [
          'Complete beginners (truly never-runners)',
          "People who've failed at running alone",
          'Anyone wanting fitness accountability without judgment',
          'Morning or evening people with consistent schedules',
        ],
      },
      {
        title: 'Not For',
        type: 'list',
        content: [
          'Current runners (try our 10K or half-marathon quests instead)',
          'People with highly unpredictable schedules',
          'Those preferring solo fitness activities',
        ],
      },
      {
        title: 'Logistics',
        type: 'list',
        content: [
          'New cohorts start monthly',
          'Choose morning (7-8am) or evening (6-7pm) track upon signup',
          'Rain = indoor alternative workout',
          'Miss 3+ sessions = offer to join next cohort',
        ],
      },
    ],
  },
];

export const QUESTS_PAGE = {
  heroTitle: 'Explore Quests',
  heroSubtitle: 'Curated adventures designed for small groups. Pick a quest, join a squad, and make real connections.',
};
