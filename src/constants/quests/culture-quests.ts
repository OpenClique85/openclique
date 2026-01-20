/**
 * Culture Path Quests
 * 
 * Quests focused on arts, entertainment, and cultural experiences.
 * Includes: Mystery Concert, Classic Film Buffs, SXSW Insider, ACL Festival Prep
 */

import type { Quest } from './types';
import mysteryConcertImg from '@/assets/quests/mystery-concert.jpg';
import classicFilmImg from '@/assets/quests/classic-film.jpg';
import sxswCrowdImg from '@/assets/quests/sxsw-crowd.jpg';
import aclFestivalImg from '@/assets/quests/acl-festival.jpg';

export const CULTURE_QUESTS: Quest[] = [
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
    id: 'sxsw-grad-insider',
    icon: '🎫',
    title: 'SXSW Insider — Grad Student Edition',
    image: sxswCrowdImg,
    imageAlt: 'Graduate students at SXSW festival in downtown Austin with neon lights and badges',
    status: 'coming-soon',
    statusLabel: 'Coming Soon - March 2025',
    theme: 'UT Grad Students',
    themeColor: 'amber',
    rewards: 'UT exhibit VIP access + exclusive swag bundle + secret show invites',
    metadata: {
      date: 'SXSW Week (March 7-15, 2025)',
      cost: '$45 (coordination + swag)',
      duration: '9 days of guided exploration',
      squadSize: '4-6 grad students',
    },
    shortDescription: 'Navigate SXSW like a local. QR scavenger hunts, secret shows, and insider access — designed for UT grad students.',
    progressionTree: 'culture',
    sections: [
      {
        title: 'When & Where',
        type: 'timeline',
        content: [
          'Pre-SXSW Kickoff: March 1 @ UT campus',
          'Interactive Week: March 7-9',
          'Film Week: March 10-12',
          'Music Week: March 13-15',
          'Wrap Party: March 16',
        ],
      },
      {
        title: 'The Journey',
        type: 'text',
        content: "SXSW is overwhelming. 400+ panels, 2000+ artists, and activations on every corner. This quest gives UT grad students a curated path through the chaos — plus insider access most badge-holders never find. You'll hunt for hidden QR codes at brand activations, unlock secret shows, and earn exclusive swag for exploring.",
      },
      {
        title: 'How the QR Scavenger Hunt Works',
        type: 'list',
        content: [
          "Download the SXSW GO app (we'll walk you through setup)",
          'Each day, BUGGS sends you 3-5 activation locations with hidden QR codes',
          'Scan the code to check in and earn points',
          'Hit point milestones to unlock rewards (swag, secret show invites, VIP access)',
          'Leaderboard for your squad + all participating squads',
        ],
      },
      {
        title: 'Daily BUGGS Guidance',
        type: 'list',
        content: [
          "Morning: \"Today's hot panels\" based on your interests",
          'Afternoon: QR hunt locations + tips for free stuff at activations',
          'Evening: Secret show alerts + meetup coordination',
          'Night: Check-in prompts + next day preview',
        ],
      },
      {
        title: "What You'll Unlock",
        type: 'list',
        content: [
          '5 QR scans: Custom SXSW bandana + sticker pack',
          '10 QR scans: Invite to UT alumni/grad student exhibit',
          '15 QR scans: Secret show invite (artist TBA)',
          '20 QR scans: VIP access to one premium panel',
          '25+ scans: "SXSW Insider" title + exclusive end-of-fest swag bundle',
        ],
      },
      {
        title: 'UT Grad Student Perks',
        type: 'list',
        content: [
          'Private viewing of UT exhibit at SXSW',
          'Meetups with UT alumni in tech/film/music industries',
          'Study break coordination (yes, even during SXSW)',
          'Grad student-only happy hours',
        ],
      },
      {
        title: "What's Included",
        type: 'list',
        content: [
          'Pre-festival orientation session',
          'Daily BUGGS coordination throughout SXSW',
          'QR scavenger hunt game access',
          'Squad coordination and meetup planning',
          'Wrap party with all participating squads',
          'All unlocked swag and rewards',
        ],
      },
      {
        title: "What You'll Earn",
        type: 'list',
        content: [
          'SXSW survival kit (portable charger, badge holder, hand sanitizer)',
          'Tiered swag based on QR scans (bandana, pins, exclusive merch)',
          'Secret show invites (based on participation)',
          'UT exhibit VIP access',
          "Priority for next year's quest",
        ],
      },
      {
        title: 'Cost',
        type: 'text',
        content: "$45 total. Covers orientation, daily coordination, scavenger hunt access, swag, and wrap party. SXSW badge/wristband NOT included — most events are free for grad students anyway.",
      },
      {
        title: 'Best For',
        type: 'list',
        content: [
          'UT grad students new to Austin or SXSW',
          'Anyone overwhelmed by the SXSW schedule',
          'People who want to discover hidden gems, not just headline acts',
          'Grad students who want to network while having fun',
          'Gamers who love a good scavenger hunt',
        ],
      },
      {
        title: 'Pro Tips from Past Squads',
        type: 'list',
        content: [
          'Comfortable shoes are non-negotiable',
          'The best free stuff is at smaller activations',
          'Secret shows > official showcases',
          'Always have a backup phone charger',
          'The real SXSW happens between 11pm and 2am',
        ],
      },
    ],
  },
  {
    id: 'acl-festival-prep',
    icon: '🎪',
    title: 'ACL Festival Prep Squad',
    image: aclFestivalImg,
    imageAlt: 'Friends at Austin City Limits festival holding a colorful totem flag with Austin skyline at sunset',
    status: 'coming-soon',
    statusLabel: 'Coming Soon - Fall 2025',
    theme: 'Festival Crew',
    themeColor: 'green',
    rewards: 'Festival survival kit + $25 ACL merch credit + squad photo canvas',
    metadata: {
      date: '4 weeks before ACL (Sept 2025)',
      cost: '$85 total (4 prep sessions)',
      duration: '4 weeks prep + festival weekend',
      squadSize: '5-6 people',
    },
    shortDescription: 'Turn strangers into your festival squad. Discover artists, scout Zilker, build a totem, and hit ACL as a crew.',
    progressionTree: 'culture',
    sections: [
      {
        title: 'When & Where',
        type: 'timeline',
        content: [
          'Week 1: Artist Discovery Night at The ABGB (Sept 6)',
          'Week 2: Zilker Park Recon Mission (Sept 13)',
          'Week 3: Festival Prep Workshop at craft space (Sept 20)',
          'Week 4: Pre-Festival Kickoff Party (Sept 27)',
          'Festival Weekend: ACL Fest (Oct 4-6 / 11-13)',
          'Reunion: Post-Festival Debrief (Oct 19)',
        ],
      },
      {
        title: 'The Journey',
        type: 'text',
        content: "ACL is better with a crew. But finding people who want to see YOUR artists? That's the hard part. This quest matches you with 5-6 strangers who share your music taste, then spends 4 weeks turning you into a festival-ready squad. By the time you walk through those gates, you'll have inside jokes, a custom totem, and a plan.",
      },
      {
        title: 'Week-by-Week Breakdown',
        type: 'list',
        content: [
          'Week 1 - Artist Discovery: Listen to undercard artists together. Claim your must-sees. Build a squad playlist.',
          'Week 2 - Zilker Recon: Walk the festival grounds. Learn stage locations, water stations, and best viewing spots.',
          'Week 3 - Prep Workshop: Build your squad totem. Gear check. Safety briefing. Outfit coordination.',
          'Week 4 - Kickoff Party: Finalize schedule. Exchange contacts. Hype playlist. Totem reveal.',
        ],
      },
      {
        title: 'Festival Weekend Coordination',
        type: 'list',
        content: [
          'BUGGS morning check-ins each day',
          'Designated meetup points between sets',
          'Photo challenges throughout the weekend',
          'Emergency contact tree',
          'Post-day debrief texts',
        ],
      },
      {
        title: "What You'll Learn",
        type: 'list',
        content: [
          'How to navigate Zilker like a local',
          'Festival safety and hydration basics',
          'What to bring (and what to leave behind)',
          'How to find your crew when cell service dies',
          'Discovering artists outside your usual rotation',
        ],
      },
      {
        title: 'BUGGS keeps your squad synced with:',
        type: 'list',
        content: [
          'Shared artist discovery prompts',
          'Festival packing checklist',
          'Day-of coordination and meetup reminders',
          'Emergency protocols if someone gets separated',
          'Post-festival photo sharing and memories',
        ],
      },
      {
        title: "What's Included",
        type: 'list',
        content: [
          '4 pre-festival sessions (venues reserved)',
          'Totem-building materials and craft supplies',
          'Festival survival kit (camelback, bandana, sunscreen, earplugs, portable charger)',
          'Squad coordination throughout festival weekend',
          'Post-festival reunion brunch',
        ],
      },
      {
        title: "What You'll Earn",
        type: 'list',
        content: [
          '$25 credit toward ACL merch booth',
          'Squad photo printed on canvas (shipped after festival)',
          'Custom "ACL Squad 2025" enamel pin',
          "Priority access to next year's prep quest",
          'Invitation to Festival Crew alumni group',
        ],
      },
      {
        title: 'Cost',
        type: 'text',
        content: "$85 total. Covers all 4 prep sessions, craft materials, survival kit, festival coordination, reunion brunch, and rewards. ACL ticket NOT included — you bring your own wristband.",
      },
      {
        title: 'Best For',
        type: 'list',
        content: [
          'First-time ACL goers who want to learn the ropes',
          'Solo festival-goers who want a crew',
          "People whose friends don't share their music taste",
          "Anyone who's gotten lost or overwhelmed at festivals before",
          'Music lovers who want to discover new artists',
        ],
      },
      {
        title: 'Not For',
        type: 'list',
        content: [
          'Festival veterans who already have a crew',
          'People who prefer to wander solo',
          "Those who can't commit to 4 prep sessions",
          "Anyone without an ACL wristband (we don't provide tickets)",
        ],
      },
      {
        title: 'Safety & Logistics',
        type: 'text',
        content: "Festival safety is no joke. You'll learn hydration strategies, how to spot heat exhaustion, where medical tents are located, and what to do if separated. We also establish a 'buddy system' and emergency contact tree before the festival.",
      },
      {
        title: 'The Totem Tradition',
        type: 'text',
        content: "Every great festival squad has a totem — that ridiculous flag or sign you hold up so your crew can find you in a sea of 75,000 people. Week 3 is dedicated to designing and building yours together. Past squads have done inflatable dinosaurs, LED signs, and a very large banana. Get creative.",
      },
    ],
  },
];
