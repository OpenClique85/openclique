/**
 * Wellness Path Quests
 * 
 * Quests focused on fitness, health, and personal growth.
 * Includes: Couch to 5K Squad
 */

import type { Quest } from './types';
import couchTo5kImg from '@/assets/quests/couch-to-5k.jpg';

export const WELLNESS_QUESTS: Quest[] = [
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
];
