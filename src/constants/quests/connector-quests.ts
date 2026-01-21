/**
 * Connector Path Quests
 * 
 * Quests focused on social bonding and shared experiences.
 * Includes: Dungeons & Daddies, Trail of Lights Squad
 */

import type { Quest } from './types';
import dndDadsImg from '@/assets/quests/dnd-dads.jpg';
import trailOfLightsImg from '@/assets/quests/trail-of-lights.jpg';

export const CONNECTOR_QUESTS: Quest[] = [
  {
    id: 'dungeons-and-daddies',
    icon: '🐉',
    title: 'Dungeons & Daddies',
    image: dndDadsImg,
    imageAlt: 'Group of dads laughing and playing tabletop games at a cozy tavern',
    status: 'coming-soon',
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
          'Saturdays, 2:00 PM: Emerald Tavern Games & Café',
          '8-week beginner campaign (dates confirmed upon signup)',
          'Private table reserved for your party',
        ],
      },
      {
        title: 'The Journey',
        type: 'text',
        content: "Being a new dad is an adventure. Why not have another one? Join a party of fellow Austin dads for a beginner-friendly D&D campaign. No experience needed. We'll teach you to roll dice, build characters, and escape into a fantasy world while bonding with guys who get the sleep deprivation.",
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
  {
    id: 'trail-of-lights',
    icon: '✨',
    title: 'Trail of Lights Squad',
    image: trailOfLightsImg,
    imageAlt: 'Friends walking through illuminated holiday light tunnel at Austin Trail of Lights',
    status: 'coming-soon',
    statusLabel: 'Coming Soon: December 2025',
    theme: 'Holiday Magic',
    themeColor: 'pink',
    rewards: 'Trail of Lights ticket + hot cocoa crawl + squad photo ornament',
    metadata: {
      date: 'December 2025 (date TBD)',
      cost: '$35 (tickets + cocoa + activities)',
      duration: 'One magical evening',
      squadSize: '5-6 people',
    },
    shortDescription: "Walk Austin's famous Trail of Lights with a squad. Hot cocoa stops, photo challenges, and holiday vibes.",
    progressionTree: 'connector',
    sections: [
      {
        title: 'When & Where',
        type: 'timeline',
        content: [
          '5:30 PM: Meet at Zilker Park entrance',
          '6:00 PM: Trail walk begins (golden hour lighting!)',
          '7:30 PM: Hot cocoa stop at Zilker Café',
          '8:30 PM: Post-trail gathering at nearby venue',
          '9:30 PM: Squad photo exchange + goodbyes',
        ],
      },
      {
        title: 'The Journey',
        type: 'text',
        content: "The Trail of Lights is an Austin holiday tradition. But wandering alone through 2 million lights isn't the vibe. Join a squad of fellow holiday lovers for the full experience: walking the trail together, stopping for hot cocoa, completing photo challenges, and ending with a cozy post-trail hangout.",
      },
      {
        title: 'Trail Experience',
        type: 'list',
        content: [
          'BUGGS-guided walk through all displays',
          'Photo challenges at key installations',
          'Hot cocoa stop included',
          'Squad voting: best display of the year',
          'Holiday music playlist for the walk',
        ],
      },
      {
        title: 'Photo Challenges',
        type: 'list',
        content: [
          'Squad selfie at the Zilker Tree',
          '"Most creative pose" at the tunnel of lights',
          "Candid shot of someone's genuine reaction",
          'Best attempt at a "jumping photo"',
          'Holiday outfit coordination award',
        ],
      },
      {
        title: 'BUGGS keeps the holiday spirit with:',
        type: 'list',
        content: [
          'Trail navigation and timing',
          'Photo challenge prompts at each zone',
          'Hot cocoa order coordination',
          'Holiday icebreakers and conversation starters',
          'Weather updates and backup plans',
        ],
      },
      {
        title: "What's Included",
        type: 'list',
        content: [
          'Trail of Lights admission ticket',
          'Hot cocoa at Zilker Café',
          'Post-trail venue reservation',
          'Squad photo printed as ornament (mailed after)',
          'Holiday treat bag',
        ],
      },
      {
        title: "What You'll Earn",
        type: 'list',
        content: [
          'Custom squad photo ornament',
          'Trail of Lights commemorative pin',
          '$10 off next OpenClique quest',
          "Priority invite to New Year's Eve quest",
          'Access to Holiday Squad alumni group',
        ],
      },
      {
        title: 'Cost',
        type: 'text',
        content: "$35 total. Covers Trail of Lights ticket, hot cocoa, treat bag, ornament, and post-trail gathering. Additional food/drinks at the post-trail venue are on you.",
      },
      {
        title: 'Best For',
        type: 'list',
        content: [
          'Austin newcomers experiencing their first Trail of Lights',
          'People who love holiday activities but hate going alone',
          'Anyone who wants photos but needs someone to take them',
          'Holiday enthusiasts who want to spread the cheer',
          "Those who've always wanted to go but never had a group",
        ],
      },
      {
        title: 'Weather Note',
        type: 'text',
        content: "Texas weather is unpredictable. If it's below 40°F, we'll coordinate hot drink stops throughout the trail. If it rains, we'll reschedule to an alternate date (you'll get first pick).",
      },
      {
        title: 'Dress Code',
        type: 'text',
        content: 'Festive encouraged! Ugly sweaters, Santa hats, reindeer antlers — the more holiday spirit, the better. Best dressed wins a prize voted by the squad.',
      },
    ],
  },
];
