/**
 * OpenClique Content Configuration
 * 
 * This file contains all editable content for the OpenClique website.
 * Update values here to change text, links, images, and more without touching component code.
 * 
 * HOW TO UPDATE:
 * 1. Find the section you want to edit
 * 2. Change the value in quotes
 * 3. Save the file
 * 4. Your changes will appear on the site
 */

// =============================================================================
// BRAND & GENERAL
// =============================================================================

export const BRAND = {
  name: "OpenClique",
  tagline: "Build the village you've been missing — One Quest at a time.",
  description: "OpenClique brings people together in small, guided groups through real-world quests — curated activities that help turn shared interests into real friendships.",
  launchCity: "Austin",
};

// =============================================================================
// NAVIGATION LINKS
// =============================================================================

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "About", href: "/about" },
];

export const CTA_NAV_LINKS = [
  { label: "Join the Pilot", href: "/pilot", variant: "primary" as const },
  { label: "Partner With Us", href: "/partners", variant: "secondary" as const },
  { label: "Work With Us", href: "/work-with-us", variant: "link" as const },
];

// =============================================================================
// GOOGLE FORM URLS
// =============================================================================

export const FORM_URLS = {
  pilot: "https://docs.google.com/forms/d/e/1FAIpQLSd9skqXpY1BsmLy4SGro8cItzQd5O486j0MySJzUxeoNd5l0w/viewform",
  partners: "https://docs.google.com/forms/d/e/1FAIpQLSdz0Y2tYSrFsSuiJEtbXFLcAsfsxa5-9KAOSgtYDU8UwRolzA/viewform",
  workWithUs: "https://docs.google.com/forms/d/e/1FAIpQLScSbXEuiYfLBc5p9p-1SJ-rwBE_duj85rW8kDAt8z-KSJqdjw/viewform",
};

// =============================================================================
// SOCIAL MEDIA LINKS
// =============================================================================

export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/openclique/",
  linkedin: "https://www.linkedin.com/company/open-clique/",
};

// =============================================================================
// HOMEPAGE CONTENT
// =============================================================================

export const HERO = {
  headline: "Build the village you've been missing — One Quest at a time.",
  subheadline: "OpenClique brings people together in small, guided groups through real-world quests — curated activities that help turn shared interests into real friendships.",
  primaryCta: "Join the Pilot",
  secondaryCta: "Partner With Us",
  tertiaryCta: "Work With Us",
};

export const VIDEO_SECTION = {
  title: "Watch our 60-second story",
  // Replace with your YouTube or Vimeo embed URL when ready
  embedUrl: "",
  placeholder: true, // Set to false when you add a real video
};

export const BENEFITS = [
  {
    title: "Small Squads",
    description: "Groups of 3-6 people, perfectly sized for real conversation and connection.",
    icon: "users",
  },
  {
    title: "Guided Quests",
    description: "AI-assisted adventures designed to break the ice and create shared memories.",
    icon: "compass",
  },
  {
    title: "Less Planning, More Showing Up",
    description: "We handle the logistics. You just show up and enjoy the experience.",
    icon: "calendar",
  },
];

export const SOCIAL_PROOF = {
  badge: "Now launching in Austin",
  message: "Be among the first to experience connection, reimagined.",
};

// =============================================================================
// HOW IT WORKS PAGE
// =============================================================================

export const HOW_IT_WORKS = {
  heroTitle: "How OpenClique Works",
  heroSubtitle: "From sign-up to your first adventure in 5 simple steps.",
  
  whatIsQuest: {
    title: "What's a Quest?",
    description: "A quest is a curated, time-boxed adventure designed for small groups. Think: sunrise hike with strangers who become friends, a secret speakeasy crawl, or a collaborative art project. Each quest has a clear goal, a small group, and zero awkward planning.",
  },
  
  steps: [
    {
      number: 1,
      title: "Opt In",
      description: "Sign up and tell us a bit about yourself — your interests, availability, and adventure comfort level.",
    },
    {
      number: 2,
      title: "Get Matched",
      description: "Our AI matches you with a small squad (3-6 people) based on shared interests and schedules.",
    },
    {
      number: 3,
      title: "Receive Your Quest",
      description: "Get a curated adventure delivered to your phone — complete with time, place, and what to expect.",
    },
    {
      number: 4,
      title: "Show Up & Connect",
      description: "Meet your squad, complete the quest together, and make real connections in the real world.",
    },
    {
      number: 5,
      title: "Unlock More Adventures",
      description: "Complete quests to unlock new adventures, meet new people, and level up your social life.",
    },
  ],
  
  shep: {
    title: "Meet Shep, Your AI Wingman",
    description: "Every squad has a secret weapon. Shep is our AI shepherd — a friendly guide who's there when you need a nudge, never when you don't.",
    features: [
      "Conversation starters when things get quiet",
      "Gentle reminders so no one forgets the details",
      "Suggestions when plans need a backup",
      "Always helpful, never awkward",
    ],
  },

  whyItWorks: {
    title: "Why It Works",
    reasons: [
      "Structure reduces the friction of 'what should we do?'",
      "Shared purpose creates instant common ground",
      "Small groups mean everyone participates",
      "Low commitment makes it easy to say yes",
    ],
  },
};

// =============================================================================
// ABOUT PAGE
// =============================================================================

export const ABOUT = {
  mission: {
    title: "Our Mission",
    description: "We're on a mission to reduce loneliness through structured, real-world connection. In a world of infinite scrolling and superficial likes, we believe the antidote is showing up — together — for shared adventures.",
  },
  
  story: {
    title: "Our Story",
    description: "We're two UT Austin MBAs who believe that community shouldn't be this hard. With backgrounds in Teach For America and the U.S. Navy, we've seen firsthand how powerful it is when people come together around shared purpose. But somewhere along the way, our cities lost the structures that used to bring us together — the block parties, the neighborhood hangouts, the organic ways we used to meet. OpenClique is our answer: rebuilding the village our cities forgot, one quest at a time.",
  },
  
  team: [
    {
      name: "Andrew Poss",
      role: "CEO & Co-Founder",
      bio: "Former Teach For America corps member and MIINT Impact Investment Competition Winner, driven to build community through shared quests and connection.",
      photo: "andrew",
    },
    {
      name: "Anthony Cami",
      role: "COO & Co-Founder",
      bio: "Former Naval Officer with a background in Operations, passionate about teamwork, excellence, and bringing people together.",
      photo: "anthony",
    },
  ],
  
  values: [
    {
      title: "Safety First",
      description: "Every quest is designed with safety in mind. We vet participants and create trusted environments.",
      icon: "shield",
    },
    {
      title: "Radical Inclusivity",
      description: "OpenClique is for everyone. We celebrate diversity and design for accessibility.",
      icon: "heart",
    },
    {
      title: "Real-World Impact",
      description: "We measure success in friendships formed, not just app downloads.",
      icon: "target",
    },
  ],
  
  traction: [
    {
      image: "tvl-semifinalists",
      title: "Texas Venture Labs Semi-Finalists",
      description: "Selected for the Texas Venture Labs Venture Pitch Competition Semi-Finals at UT Austin McCombs.",
    },
    {
      image: "acl-winners",
      title: "McCombs Marketing Case Competition Winners",
      description: "Won the McCombs Marketing Case Competition for C3 Presents: Austin City Limits.",
    },
    {
      image: "kendra-scott-accelerator",
      title: "Kendra Scott WELI Spark Accelerator",
      description: "Participants in the Kendra Scott Women's Entrepreneurial Leadership Institute Spark Founders Accelerator Program.",
    },
  ],
};

// =============================================================================
// FAQ CONTENT
// =============================================================================

export const FAQ = [
  {
    question: "What exactly is a quest?",
    answer: "A quest is a curated, time-boxed adventure for a small group (3-6 people). It could be anything from a sunrise hike to a cooking class to a scavenger hunt. Each quest has a clear goal and is designed to help strangers become friends.",
  },
  {
    question: "How does matching work?",
    answer: "Our AI considers your interests, availability, location, and adventure preferences to match you with compatible squad members. We optimize for shared interests while also introducing you to people you might not otherwise meet.",
  },
  {
    question: "Is it safe?",
    answer: "Safety is our top priority. All participants go through a verification process, quests happen in public spaces, and we have community guidelines that everyone agrees to. You can also rate your experience and report any concerns.",
  },
  {
    question: "What cities are you in?",
    answer: "We're currently launching our pilot program in Austin, TX. Sign up to be among the first to experience OpenClique, and let us know if you want us in your city next!",
  },
  {
    question: "How is my data used?",
    answer: "We only collect the information needed to match you with great squads and quests. We never sell your data to third parties. Check our Privacy Policy for full details.",
  },
  {
    question: "How much does it cost?",
    answer: "During our pilot phase, OpenClique is free to join. Some quests may have costs associated with the activity itself (like a cooking class fee), but we'll always be transparent about any costs upfront.",
  },
];

// =============================================================================
// INTAKE PAGE CONTENT
// =============================================================================

export const PILOT_PAGE = {
  title: "Join the Austin Pilot",
  subtitle: "Be among the first to experience OpenClique. We're looking for adventurous souls ready to try something new.",
  whatToExpect: [
    "Match with a small squad based on your interests",
    "Receive your first quest within 2 weeks of signing up",
    "Complete 1-2 quests per month during the pilot",
    "Help shape the future of OpenClique with your feedback",
  ],
  ctaText: "Start Your Adventure",
  note: "By signing up, you'll be redirected to our signup form. We'll never share your information with third parties.",
};

export const PARTNERS_PAGE = {
  title: "Partner With OpenClique",
  subtitle: "Join us in bringing people together. We're looking for brands, venues, and organizations who share our mission.",
  explainer: "We bring small groups (3-6 people) to your venue or brand activation for curated, real-world experiences.",
  partnerTypes: [
    {
      title: "Venue Partners",
      description: "Host quests at your location and connect with engaged, adventurous customers.",
    },
    {
      title: "Brand Sponsors",
      description: "Sponsor quests and create memorable experiences that build authentic brand affinity.",
    },
    {
      title: "Community Organizations",
      description: "Partner with us to bring structured connection to your members or constituents.",
    },
  ],
  partnerProcess: [
    {
      step: 1,
      title: "Tell Us About You",
      description: "Quick form about your venue, product, or community.",
    },
    {
      step: 2,
      title: "Co-Design a Quest",
      description: "We follow up to create a custom experience together.",
    },
    {
      step: 3,
      title: "Host a Squad",
      description: "A group of 3-6 people shows up ready to connect.",
    },
  ],
  venueValue: {
    title: "For Venues",
    points: [
      "New foot traffic from groups ready to engage",
      "Repeat visits through quest-chains at your location",
      "Optional rewards drive loyalty at low cost",
      "User feedback and content from real customers",
    ],
  },
  brandValue: {
    title: "For Brands",
    points: [
      "60-90 minutes of dwell time with engaged customers",
      "Quest rewards work like influencer kits — for real users",
      "User-generated content as quest completion steps",
      "Quest-chains build repeat engagement and loyalty",
    ],
  },
  venueFAQ: [
    {
      question: "What do I need to provide?",
      answer: "Just your space and hospitality. Optionally, offer a small reward (drink, discount, swag) to drive repeat visits. We handle the rest.",
    },
  ],
  brandFAQ: [
    {
      question: "What does a brand quest look like?",
      answer: "Think: Nike offering exclusive gear for a first 5K, or a local roaster sponsoring a coffee crawl. Users complete the quest, earn your reward, and share their experience.",
    },
  ],
  ctaText: "Let's Talk",
  note: "You'll be redirected to our partnership inquiry form.",
};

export const WORK_WITH_US_PAGE = {
  title: "Work With Us",
  subtitle: "Join our community of creators helping people find belonging — on your schedule.",
  roles: [
    {
      title: "Quest Creators",
      description: "Design experiences that bring strangers together. Build a reputation, get hired by brand partners.",
    },
    {
      title: "Community Hosts",
      description: "Be the friendly face that welcomes squads. Guide conversations, keep the energy warm.",
    },
    {
      title: "Contributors",
      description: "Help us grow — design, code, content, marketing. Real startup experience, flexible hours.",
    },
  ],
  whoWeLookFor: ["Collaborative", "Creative", "Communicates quickly", "Scrappy", "Loves building community"],
  faq: [
    {
      question: "Is this paid?",
      answer: "We're a pre-seed startup, so most roles are volunteer-based. But quest creators can be hired directly by our brand partners — you build your reputation, they pay for your expertise. OpenClique takes a small coordination fee.",
    },
    {
      question: "What skills will I gain?",
      answer: "Event planning, community management, brand partnerships, UX design, marketing, and hands-on startup operations. Great for your resume or portfolio.",
    },
    {
      question: "Can I get college credit?",
      answer: "Yes! We're happy to work with your school's internship or independent study program.",
    },
    {
      question: "How much time do I need to commit?",
      answer: "Totally flexible. Some folks help a few hours a month, others dive deeper. You set your pace.",
    },
    {
      question: "What's the path to getting paid?",
      answer: "Quest creators build a reputation like Airbnb hosts. As brands sponsor quests, they hire top creators directly. Priority for future full-time roles as we grow.",
    },
  ],
  ctaText: "Get Involved",
  note: "You'll be redirected to our collaborator application.",
};

// =============================================================================
// FOOTER CONTENT
// =============================================================================

export const FOOTER = {
  copyright: `© ${new Date().getFullYear()} OpenClique. All rights reserved.`,
  links: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
  contactEmail: "Andrew.poss@openclique.net",
};

// =============================================================================
// EMAIL CAPTURE SECTION
// =============================================================================

export const EMAIL_CAPTURE = {
  title: "Stay in the loop",
  description: "Get updates on our Austin launch and be the first to know when we expand to new cities.",
  placeholder: "Enter your email",
  buttonText: "Subscribe",
  successMessage: "Thanks for subscribing! We'll be in touch.",
};

// =============================================================================
// QUEST PHOTOS
// 
// Add your quest photos here. Each photo should have:
// - src: The image path (put images in src/assets/photos/)
// - alt: Description for accessibility
// - caption: Optional caption to display
// 
// HOW TO ADD PHOTOS:
// 1. Add your image file to src/assets/photos/
// 2. Add an entry below with the path, alt text, and optional caption
// =============================================================================

export const QUEST_PHOTOS = [
  // Example entries (uncomment and update when you add photos):
  // {
  //   src: "/src/assets/photos/quest-1.jpg",
  //   alt: "Group hiking at sunrise",
  //   caption: "Sunrise squad conquering Mount Bonnell",
  // },
  // {
  //   src: "/src/assets/photos/quest-2.jpg",
  //   alt: "Friends at a cooking class",
  //   caption: "Making pasta and memories",
  // },
];

// =============================================================================
// SEO & META
// =============================================================================

export const SEO = {
  defaultTitle: "OpenClique — The invite that plans itself",
  titleTemplate: "%s | OpenClique",
  description: "Join small squads. Complete AI-curated quests. Show up and connect — no awkward planning required. Now launching in Austin.",
  ogImage: "/og-image.jpg", // Add your OG image to public folder
  twitterHandle: "@openclique",
};
