/**
 * OpenClique Quest Data
 * 
 * This file contains all quest information displayed on the Quests page.
 * Each quest has card-level info and full modal details.
 */

import mysteryConcertImg from '@/assets/quests/mystery-concert.jpg';
import couchTo5kImg from '@/assets/quests/couch-to-5k.jpg';
import classicFilmImg from '@/assets/quests/classic-film.jpg';
import dndDadsImg from '@/assets/quests/dnd-dads.jpg';

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

export const QUESTS: Quest[] = [
  {
    id: 'mystery-concert-ladies-night',
    icon: '🎸',
    title: 'Mystery Concert — Ladies Night',
    image: mysteryConcertImg,
    imageAlt: 'Group of women friends dressed up heading to a concert at night',
    status: 'pilot',
    statusLabel: 'Pilot - Limited Spots',
    theme: 'Ladies Night',
    themeColor: 'pink',
    rewards: 'Free concert ticket + potential drink discounts',
    metadata: {
      date: 'Thu, Jan 22, 5:00 PM',
      cost: 'Dinner on you, concert free',
      duration: '3 hours',
      squadSize: '5-6 people',
    },
    shortDescription: 'Guided dinner, group walk, mystery concert reveal. BUGGS handles the vibes.',
    progressionTree: 'culture',
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
        content: "You'll be connected with your squad through BUGGS (Behavioral Utility for Group Guidance & Structure) — our friendly AI guide that keeps everyone in sync.",
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
    image: couchTo5kImg,
    imageAlt: 'Runner on a trail at sunrise with mountains in background',
    status: 'coming-soon',
    statusLabel: 'Coming Soon',
    theme: 'Beginner Runners',
    themeColor: 'green',
    rewards: '$25 running store gift card + race entry + OpenClique swag',
    metadata: {
      date: 'Starting February',
      cost: '$40 total (2 months)',
      duration: '8 weeks, 2x/week',
      squadSize: '4-5 people',
    },
    shortDescription: 'Zero to 5K with your squad. GPS art challenges. BUGGS-guided accountability.',
    progressionTree: 'wellness',
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
        title: "BUGGS keeps your squad connected with:",
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
          'Squad coordination with BUGGS',
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
  {
    id: 'classic-film-buffs',
    icon: '🎬',
    title: 'Classic Film Buffs',
    image: classicFilmImg,
    imageAlt: 'Friends watching a classic black and white film in an art deco theater',
    status: 'coming-soon',
    statusLabel: 'Coming Soon',
    theme: 'Film Lovers',
    themeColor: 'amber',
    rewards: 'Free finale screening + $20 Alamo gift card + film swag',
    metadata: {
      date: 'Starting March 2025',
      cost: '$60 total (series pass)',
      duration: '6 weeks, 1 film/week',
      squadSize: '4-6 people',
    },
    shortDescription: 'Weekly classic film screenings at Alamo Drafthouse, culminating in a costume watch party.',
    progressionTree: 'culture',
    sections: [
      {
        title: 'When & Where',
        type: 'timeline',
        content: [
          'Wednesdays, 7:00 PM at Alamo Drafthouse South Lamar',
          '6-week series (exact dates TBD upon signup)',
          'Final week: Costume watch party at special venue',
        ],
      },
      {
        title: 'The Journey',
        type: 'text',
        content: 'Experience cinema history with a curated 6-film journey through Hollywood\'s golden age. Each week, your squad watches a classic together, then discusses over drinks. Week 6 is the grand finale — a costume party screening where you dress as your favorite classic film character.',
      },
      {
        title: 'Film Series Preview',
        type: 'list',
        content: [
          'Week 1: Golden Age Hollywood (1940s-50s)',
          'Week 2: International Cinema Classics',
          'Week 3: Hitchcock Night',
          'Week 4: Musical Extravaganza',
          'Week 5: Film Noir Double Feature',
          'Week 6: Costume Party Finale (film voted by squad)',
        ],
      },
      {
        title: 'BUGGS keeps your squad engaged with:',
        type: 'list',
        content: [
          'Weekly film trivia before screenings',
          'Discussion prompts for post-movie drinks',
          'Costume planning coordination for finale',
          'Film history fun facts and easter eggs',
        ],
      },
      {
        title: "What's Included",
        type: 'list',
        content: [
          '6 Alamo Drafthouse screening tickets',
          'Reserved squad seating each week',
          'Post-movie discussion space reserved',
          'Finale costume party venue & decorations',
          'Film buff starter kit (poster, pins)',
        ],
      },
      {
        title: "What You'll Earn",
        type: 'list',
        content: [
          '$20 Alamo Drafthouse gift card',
          'Classic film poster (signed by squad)',
          'Exclusive "Film Buff" OpenClique badge',
          'Priority access to future film quests',
          'Invitation to Film Buffs alumni screening club',
        ],
      },
      {
        title: 'Cost',
        type: 'text',
        content: '$60 total for the 6-week series. Covers all tickets, reserved seating, finale party, and rewards. Food & drinks at screenings are on you.',
      },
      {
        title: 'Best For',
        type: 'list',
        content: [
          'Film lovers who want to explore classics with company',
          'People who love discussing movies after watching',
          'Anyone who\'s wanted an excuse to dress up for a movie',
          'Those who appreciate cinema but hate watching alone',
        ],
      },
      {
        title: 'Dress Code for Finale',
        type: 'text',
        content: 'Week 6 is costume required! Come as your favorite classic film character. Best costume wins a special prize voted by the squad.',
      },
    ],
  },
  {
    id: 'dungeons-and-daddies',
    icon: '🐉',
    title: 'Dungeons & Daddies',
    image: dndDadsImg,
    imageAlt: 'Group of dads laughing and playing tabletop games at a cozy tavern',
    status: 'coming-soon',
    statusLabel: 'Coming Soon',
    theme: 'New Dads',
    themeColor: 'purple',
    rewards: 'Dad gear bundle + D&D starter set + $30 tavern credits',
    metadata: {
      date: 'Starting February 2025',
      cost: '$75 total (8 sessions)',
      duration: '8 weeks, 1 session/week',
      squadSize: '4-5 dads',
    },
    shortDescription: 'New dads escape reality with beginner D&D at Emerald Tavern. Complete campaign, earn dad gear.',
    progressionTree: 'connector',
    sections: [
      {
        title: 'When & Where',
        type: 'timeline',
        content: [
          'Saturdays, 2:00 PM at Emerald Tavern Games & Café',
          '8-week beginner campaign (dates confirmed upon signup)',
          'Private table reserved for your party',
        ],
      },
      {
        title: 'The Journey',
        type: 'text',
        content: "Being a new dad is an adventure — why not have another one? Join a party of fellow Austin dads for a beginner-friendly D&D campaign. No experience needed. We'll teach you to roll dice, build characters, and escape into a fantasy world while bonding with guys who get the sleep deprivation.",
      },
      {
        title: 'Experience Flow',
        type: 'list',
        content: [
          'Session 1: Character creation & tavern meetup',
          'Sessions 2-6: Campaign chapters (beginner-friendly story)',
          'Session 7: Epic boss battle',
          'Session 8: Finale feast & loot distribution',
        ],
      },
      {
        title: 'BUGGS keeps your party synced with:',
        type: 'list',
        content: [
          'Session reminders (because dad brain is real)',
          'Character sheet management help',
          'Quick rules refreshers before each session',
          '"Dad joke of the week" to break the ice',
          'Coordination if someone needs to miss (baby duty)',
        ],
      },
      {
        title: "What's Included",
        type: 'list',
        content: [
          '8 sessions with experienced Dungeon Master',
          'All dice, character sheets, and materials provided',
          'Reserved private table at Emerald Tavern',
          'Drinks credit each session ($10/person)',
          'Campaign designed for beginners',
        ],
      },
      {
        title: "What You'll Earn",
        type: 'list',
        content: [
          'D&D Starter Set (yours to keep)',
          'Custom "Dad Party" dice bag',
          '$30 Emerald Tavern gift card',
          'First-time dad care package from brand partners:',
          '  • Tactical-style diaper bag',
          '  • "Dad Mode" t-shirt',
          '  • Coffee shop gift card',
          'Priority invite to advanced campaigns',
        ],
      },
      {
        title: 'Cost',
        type: 'text',
        content: '$75 total for the 8-week campaign. Covers DM, materials, table reservation, drink credits, and all rewards. Additional food/drinks on you.',
      },
      {
        title: 'Best For',
        type: 'list',
        content: [
          'New dads (0-3 years) wanting to meet other dads',
          'Anyone curious about D&D but intimidated to start',
          'Guys who need a scheduled excuse to leave the house',
          'Dads who loved gaming pre-kids and want to reconnect',
        ],
      },
      {
        title: 'Not For',
        type: 'list',
        content: [
          'Experienced D&D players (try our advanced campaigns)',
          'Anyone not open to fantasy/roleplay themes',
          'Those who can\'t commit to most Saturday afternoons',
        ],
      },
      {
        title: 'Partner Perks',
        type: 'text',
        content: 'This quest is supported by local dad-focused brands. Complete the campaign to unlock exclusive gear and discounts from our partners.',
      },
    ],
  },
];

export const QUESTS_PAGE = {
  heroTitle: 'Explore Quests',
  heroSubtitle: 'Curated adventures designed for small groups. Pick a quest, join a squad, and make real connections.',
};
