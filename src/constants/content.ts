/**
 * =============================================================================
 * CONTENT.TS - MASTER CONTENT CONFIGURATION FILE
 * =============================================================================
 * 
 * This is the MOST IMPORTANT file for non-developers to edit.
 * It contains ALL the text, links, and content for the OpenClique website.
 * 
 * WHAT'S IN THIS FILE:
 * - Brand name and tagline
 * - Navigation menu links
 * - Google Form URLs (for signups)
 * - Social media links
 * - Page-by-page content (headlines, descriptions, etc.)
 * - FAQ questions and answers
 * - SEO metadata
 * 
 * HOW TO EDIT:
 * 1. Use Ctrl+F (or Cmd+F on Mac) to search for the text you want to change
 * 2. Edit the text inside the quotes "like this"
 * 3. Save the file
 * 4. Your changes appear on the site immediately
 * 
 * IMPORTANT RULES:
 * - Don't delete the quotes around text
 * - Don't delete commas at the end of lines
 * - Don't change variable names (the words before the colon)
 * - If you break something, use Ctrl+Z to undo
 * 
 * EXAMPLE:
 * To change the tagline from "You've got a squad waiting..." to something else:
 *   BEFORE: tagline: "You've got a squad waiting. You just haven't met them yet.",
 *   AFTER:  tagline: "Your new tagline here.",
 *
 * =============================================================================
 */


// =============================================================================
// SECTION 1: BRAND INFORMATION
// =============================================================================
// The core brand name, tagline, and description used across the site.
// These appear in the footer, meta tags, and various pages.

export const BRAND = {
  name: "OpenClique",                                    // Company/product name
  tagline: "You've got a clique waiting. You just haven't met them yet.", // Main slogan
  description: "We plan the adventure. You bring yourself—plus whoever you want. Match with a clique, complete curated quests, and make real friends.",
  launchCity: "Austin",                                  // Current pilot city
};


// =============================================================================
// SECTION 2: NAVIGATION LINKS
// =============================================================================
// These define what appears in the top navigation bar.
// To add a new page: add a new { label: "Page Name", href: "/page-url" }

export const NAV_LINKS = [
  { label: "Home", href: "/" },                          // Homepage
  { label: "Quests", href: "/quests" },                  // Quest catalog
  { label: "Pricing", href: "/pricing" },                // Pricing page
  { label: "How It Works", href: "/how-it-works" },      // Process explanation
  { label: "About", href: "/about" },                    // About us
];

// CTA (Call-to-Action) links - the buttons in the nav header
// variant: "primary" = solid button, "secondary" = outline, "link" = text only
export const CTA_NAV_LINKS = [
  { label: "Join the Pilot", href: "/pilot", variant: "primary" as const },
  { label: "Partner With Us", href: "/partners", variant: "secondary" as const },
  { label: "Work With Us", href: "/work-with-us", variant: "link" as const },
];

// =============================================================================
// SECTION 3: INTERNAL ROUTES (Replaced Google Forms)
// =============================================================================
// All CTAs now route to in-app pages or modals instead of external forms.

// =============================================================================
// SECTION 4: SOCIAL MEDIA LINKS
// =============================================================================
// Links to official OpenClique social media profiles.
// These appear in the footer and can be referenced elsewhere.

export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/openclique/",
  linkedin: "https://www.linkedin.com/company/open-clique/",
};

// =============================================================================
// WHO'S OPENCLIQUE FOR - PERSONA DATA
// =============================================================================

export const WHO_ITS_FOR = {
  individualPersonas: [
    {
      id: "students",
      icon: "GraduationCap",
      label: "Students",
      description: "Finding your people beyond the lecture hall",
      relatableHook: "Class friends disappear after finals. You want something that sticks.",
      whatToExpect: [
        "Squads that meet weekly, not just once",
        "Activities beyond bars and parties",
        "Built-in icebreakers (no awkward small talk)",
        "Friends who actually text back",
      ],
      perfectIf: "you're tired of surface-level campus connections.",
    },
    {
      id: "newcomers",
      icon: "MapPin",
      label: "Newcomers",
      description: "New to Austin, ready for real connections",
      relatableHook: "You moved here excited. Now you're eating dinner alone... again.",
      whatToExpect: [
        "Pre-formed groups so you're not showing up solo",
        "Locals who know the hidden gems",
        "A reason to explore beyond your apartment radius",
        "Connections that feel organic, not forced",
      ],
      perfectIf: "you're new in town and tired of apps that don't deliver.",
    },
    {
      id: "remote-workers",
      icon: "Home",
      label: "Remote Workers",
      description: "Craving IRL when your office is your couch",
      relatableHook: "Slack is great, but it doesn't grab a beer with you.",
      whatToExpect: [
        "Midday coffee breaks with other remote folks",
        "Coworking buddy system",
        "Happy hours that aren't networking events",
        "IRL accountability partners",
      ],
      perfectIf: "your social life has become your calendar's afterthought.",
    },
    {
      id: "hobby-explorers",
      icon: "Palette",
      label: "Hobby Explorers",
      description: "Meet people who share your niche interests",
      relatableHook: "Your niche interest? Other people have it too.",
      whatToExpect: [
        "Find your weird (board games, birding, vintage vinyl)",
        "Small groups who actually show up",
        "Skill-sharing without judgment",
        "Turn solo hobbies into social ones",
      ],
      perfectIf: "you've been doing your thing alone and want company.",
    },
    {
      id: "coworkers",
      icon: "Briefcase",
      label: "Coworkers",
      description: "Bond with your team outside the Slack channel",
      relatableHook: "Team building shouldn't feel like team building.",
      whatToExpect: [
        "Off-site activities that don't feel corporate",
        "Bond over shared interests, not just deadlines",
        "Optional, low-pressure participation",
        "Actually get to know the people you Slack daily",
      ],
      perfectIf: "you want to know your teammates beyond their job titles.",
    },
    {
      id: "empty-nesters",
      icon: "Heart",
      label: "Empty Nesters",
      description: "Kids left. Time to build your next chapter",
      relatableHook: "Kids left. Now what?",
      whatToExpect: [
        "Meet others in the same life chapter",
        "Rediscover old hobbies or try new ones",
        "Daytime activities (not just evening bar crawls)",
        "Build your next friend group intentionally",
      ],
      perfectIf: "you're ready to invest in yourself again.",
    },
  ],
  organizationPersonas: [
    {
      id: "communities",
      icon: "Building2",
      label: "Communities",
      description: "Keep members engaged between meetups",
      relatableHook: "Events get attendance. But not community.",
      whatToExpect: [
        "Turn one-time attendees into regulars",
        "Gamified engagement between meetups",
        "Member retention through shared progression",
        "Analytics on who's actually connecting",
      ],
      perfectIf: "your members show up once and disappear.",
    },
    {
      id: "clubs-orgs",
      icon: "ClipboardList",
      label: "Clubs & Orgs",
      description: "Structured rituals that reward commitment",
      relatableHook: "Membership is easy. Showing up consistently is hard.",
      whatToExpect: [
        "Quest-chains that reward commitment",
        "Ritualized gatherings that stick",
        "New member onboarding that actually integrates",
        "Reduce churn with structured belonging",
      ],
      perfectIf: "you want members who engage, not just enroll.",
    },
  ],
};

// =============================================================================
// HOMEPAGE CONTENT
// =============================================================================

export const HERO = {
  tagline: "Match. Meet. Return.",
  headline: "You've got a clique waiting.",
  headlineAccent: "You just haven't met them yet.",
  subheadline: "We plan the adventure. You bring yourself—plus whoever you want.",
  primaryCta: "Find Your Quest",
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
    title: "Small, Easy to Join Cliques",
    description: "Groups of 3-6 people. Finish together, unlock rewards together.",
    icon: "users",
  },
  {
    title: "Curated Quests",
    description: "Thoughtfully designed adventures that spark conversation and create shared memories.",
    icon: "compass",
  },
  {
    title: "Less Planning,\nMore Showing Up",
    description: "We handle the logistics. You just show up and enjoy the experience.",
    icon: "calendar",
  },
];

export const SOCIAL_PROOF = {
  badge: "Now launching in Austin",
  message: "Browse open quests and join your first adventure.",
};

// =============================================================================
// HOW IT WORKS PAGE
// =============================================================================

export const HOW_IT_WORKS = {
  heroTitle: "How OpenClique Works",
  heroSubtitle: "From sign-up to your first adventure in 4 simple steps.",
  
  steps: [
    {
      number: 1,
      title: "Sign Up",
      description: "Tell us your interests, availability, and adventure comfort level.",
    },
    {
      number: 2,
      title: "Get Matched",
      description: "We pair you with a small clique (3-6 people) based on shared interests.",
    },
    {
      number: 3,
      title: "Receive Your Quest",
      description: "A curated adventure lands in your inbox — time, place, and what to expect.",
    },
    {
      number: 4,
      title: "Show Up & Unlock",
      description: "Complete the quest. Earn rewards. Unlock what's next.",
    },
  ],
  
  buggs: {
    title: "Meet BUGGS, Your AI Guide",
    subtitle: "The rabbit pulling levers behind the curtain",
    description: "BUGGS is your clique's guide: there when you need a nudge, never when you don't.",
    features: [
      "Conversation starters when things get quiet",
      "Gentle reminders so no one forgets the details",
      "Suggestions when plans need a backup",
      "Always helpful, never awkward",
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
    description: "We're two UT Austin MBAs who believe that community shouldn't be this hard. With backgrounds in Teach For America and the U.S. Navy, we've seen firsthand how powerful it is when people come together around shared purpose. But somewhere along the way, our cities lost the structures that used to bring us together — the block parties, the neighborhood hangouts, the organic ways we used to meet. OpenClique is our answer: your squad is waiting, you just haven't met them yet.",
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
// FAQ CONTENT (Legacy - kept for backwards compatibility)
// =============================================================================

export const FAQ = [
  {
    question: "What exactly is a quest?",
    answer: "A quest is a curated, time-boxed adventure for a small group (3-6 people). It could be anything from a sunrise hike to a cooking class to a scavenger hunt. Each quest has a clear goal and is designed to help strangers become friends.",
  },
  {
    question: "How does matching work?",
    answer: "Our AI considers your interests, availability, location, and adventure preferences to match you with compatible clique members. We optimize for shared interests while also introducing you to people you might not otherwise meet.",
  },
  {
    question: "How much does it cost?",
    answer: "During our pilot phase, OpenClique is free to join. Some quests may have costs associated with the activity itself (like a cooking class fee), but we'll always be transparent about any costs upfront.",
  },
];

// =============================================================================
// HELP CENTER - CONSOLIDATED FAQ & GLOSSARY
// =============================================================================

export const HELP_CENTER = {
  categories: [
    { id: 'all', label: 'All', icon: 'HelpCircle' },
    { id: 'general', label: 'General', icon: 'HelpCircle' },
    { id: 'quests', label: 'Quests', icon: 'Compass' },
    { id: 'matching', label: 'Matching & Cliques', icon: 'Users' },
    { id: 'safety', label: 'Safety & Privacy', icon: 'Shield' },
    { id: 'costs', label: 'Costs & Pricing', icon: 'CreditCard' },
  ],
  
  faqs: [
    // General
    {
      category: 'general',
      question: "What exactly is a quest?",
      answer: "A quest is a curated, time-boxed adventure for a small group (3-6 people). It could be anything from a sunrise hike to a cooking class to a scavenger hunt. Each quest has a clear goal and is designed to help strangers become friends.",
    },
    {
      category: 'general',
      question: "What cities are you in?",
      answer: "We're currently launching our pilot program in Austin, TX. Sign up to be among the first to experience OpenClique, and let us know if you want us in your city next!",
    },
    {
      category: 'general',
      question: "Who is OpenClique for?",
      answer: "Anyone looking for real-world connection! Students, newcomers to a city, remote workers, hobby explorers, and anyone tired of superficial social apps. If you want to meet people who actually show up, you're in the right place.",
    },
    
    // Quests
    {
      category: 'quests',
      question: "How long do quests last?",
      answer: "Most quests are 60-90 minutes, designed to be meaningful without eating your whole day. Some special quests (like day trips or multi-part adventures) may be longer — we always tell you upfront.",
    },
    {
      category: 'quests',
      question: "Can I bring friends?",
      answer: "Absolutely! You can sign up solo or bring friends. When you join a quest, you can choose to go alone (get matched with others) or bring up to 2 friends. Just make sure everyone signs up.",
    },
    {
      category: 'quests',
      question: "What if I need to cancel?",
      answer: "We get it — life happens. You can cancel up to 24 hours before a quest with no penalty. Late cancellations may affect your reliability score, which helps us match committed groups.",
    },
    {
      category: 'quests',
      question: "What types of quests are available?",
      answer: "Quests span many categories: outdoor adventures, food & drink, arts & culture, wellness, social games, and more. Browse the quest catalog to see what's available in your area.",
    },
    
    // Matching & Cliques
    {
      category: 'matching',
      question: "How does matching work?",
      answer: "Our AI considers your interests, availability, location, and adventure preferences to match you with compatible clique members. We optimize for shared interests while also introducing you to people you might not otherwise meet.",
    },
    {
      category: 'matching',
      question: "What is a clique?",
      answer: "A clique is your small group of 3-6 people matched to complete a quest together. Cliques can be one-time (just for that quest) or recurring (your regular adventure crew). Think of it as a built-in friend group for shared experiences.",
    },
    {
      category: 'matching',
      question: "What if I don't like my match?",
      answer: "Not every group is a perfect fit, and that's okay! Give honest feedback after each quest, and our matching algorithm learns your preferences. You can also add people you click with to your contacts for future adventures.",
    },
    {
      category: 'matching',
      question: "Can I see who I'm matched with before the quest?",
      answer: "Yes! Once matched, you'll see first names and brief profiles of your clique members. This helps break the ice before you meet up. Full introductions happen in the warm-up chat before the quest.",
    },
    
    // Safety & Privacy
    {
      category: 'safety',
      question: "How is my data used?",
      answer: "We only collect the information needed to match you with great squads and quests. We never sell your data to third parties. Check our Privacy Policy for full details.",
    },
    {
      category: 'safety',
      question: "How do I report someone?",
      answer: "If you feel uncomfortable or witness inappropriate behavior, use the 'Report' button in the app or contact our support team directly. We take all reports seriously and respond within 24 hours.",
    },
    {
      category: 'safety',
      question: "Are quests safe?",
      answer: "Safety is our priority. All quests take place in public venues. We verify participants and provide clear guidelines. Quest hosts are trained to create welcoming environments. Trust your instincts — if something feels off, reach out to us.",
    },
    {
      category: 'safety',
      question: "What are the community guidelines?",
      answer: "Be respectful, show up on time, participate with an open mind, and treat others how you want to be treated. Harassment, discrimination, and no-shows are not tolerated. Full guidelines are in our Terms of Service.",
    },
    
    // Costs & Pricing
    {
      category: 'costs',
      question: "How much does it cost?",
      answer: "During our pilot phase, OpenClique is free to join. Some quests may have costs associated with the activity itself (like a cooking class fee), but we'll always be transparent about any costs upfront.",
    },
    {
      category: 'costs',
      question: "Are there refunds?",
      answer: "For paid quests, refunds are available if you cancel more than 24 hours before the start time. Within 24 hours, refunds are at the discretion of the quest creator. Platform fees are generally non-refundable.",
    },
    {
      category: 'costs',
      question: "What are Clique Coins?",
      answer: "Clique Coins are our in-app currency earned by completing quests, giving feedback, and achieving milestones. Use them for discounts on paid quests, exclusive experiences, and special perks.",
    },
  ],
  
  glossary: [
    {
      term: "Quest",
      definition: "A time-bound, real-world adventure for a small group (3-6 people). Each quest has clear objectives and is designed to spark genuine connection through shared experiences.",
    },
    {
      term: "Clique",
      definition: "Your squad — a small group of people matched to complete a quest together. Cliques can be temporary (one quest) or recurring (your regular adventure crew).",
    },
    {
      term: "BUGGS",
      definition: "Behavioral Utility for Group Guidance & Structure — your AI guide that handles logistics, icebreakers, and gentle nudges. Always helpful, never awkward.",
    },
    {
      term: "XP",
      definition: "Experience points earned by completing quests, giving feedback, and engaging with the platform. XP tracks your OpenClique journey and unlocks rewards.",
    },
    {
      term: "Meta-Quest",
      definition: "A monthly challenge that tracks progress across multiple quests and activities. Complete meta-quests to earn bonus rewards and special badges.",
    },
    {
      term: "Squad",
      definition: "Another term for your clique — the people matched to complete a quest together.",
    },
    {
      term: "Creator",
      definition: "Someone who designs and hosts quests. Creators build their reputation through ratings and can be discovered by brands for sponsored activations.",
    },
    {
      term: "Sponsor",
      definition: "A brand or venue that partners with OpenClique to host or sponsor quests, providing perks and rewards for participants.",
    },
    {
      term: "Friend Code",
      definition: "A unique code you can share to add people directly to your contacts list without needing to search for them.",
    },
    {
      term: "LFG",
      definition: "Looking for Group — a broadcast feature to invite your contacts to join open quest slots when you need more people.",
    },
    {
      term: "Contacts",
      definition: "Your personal roster of OpenClique users you've connected with — like a friend list for future adventures together.",
    },
    {
      term: "Warm-Up",
      definition: "The pre-quest chat phase where your clique introduces themselves and gets ready for the adventure ahead.",
    },
    {
      term: "Clique Coins",
      definition: "In-app currency earned through quests and achievements. Use them for discounts, exclusive experiences, and special perks.",
    },
    {
      term: "Quest Chain",
      definition: "A series of connected quests that build on each other, often with a narrative arc and bonus rewards for completing the full chain.",
    },
    {
      term: "Reliability Score",
      definition: "A measure of how consistently you show up to quests you've signed up for. High reliability helps you get matched with other committed adventurers.",
    },
  ],
  
  // Top 3 questions for homepage teaser
  teaserQuestions: [
    "What exactly is a quest?",
    "How does matching work?",
    "How much does it cost?",
  ],
};

// =============================================================================
// INTAKE PAGE CONTENT
// =============================================================================

export const PILOT_PAGE = {
  title: "Find Your Quest",
  subtitle: "Your clique is waiting. Pick an adventure and show up.",
  whatToExpect: [
    "Come solo, bring friends, or rally your crew",
    "Get matched with a small clique of 3-6 people",
    "We plan the adventure—you just show up",
    "Keep coming back to the people you vibe with",
  ],
  ctaText: "Browse Quests",
  note: "Sign up to join quests and track your progress.",
};

export const PARTNERS_PAGE = {
  title: "Turn Foot Traffic Into Belonging",
  subtitle: "Solve the cold start problem for your community. We help people show up, connect, and come back.",
  problemHook: "People show up. But they don't connect. Third places are dying. We help you ritualize repeat visits.",
  
  // Partner categories with example quests
  categories: [
    {
      id: "venues",
      title: "Venues",
      icon: "Beer",
      tagline: "Turn regulars into community",
      exampleQuest: {
        name: "Trivia Tuesday Regulars",
        emoji: "🧠",
        description: "4-week trivia league. Same squad, same table, same night. Strangers become regulars.",
        reward: "Tab credit for season winners",
        whyItWorks: "Repeat visits become ritual. Strangers become crew.",
      },
      valuePoints: [
        "Groups of 3-6 show up ready to stay 60-90 minutes",
        "Quest-chains drive repeat visits to your location",
        "Real engagement, not just foot traffic",
      ],
    },
    {
      id: "brands",
      title: "Brands",
      icon: "Gift",
      tagline: "Dwell time > impressions",
      exampleQuest: {
        name: "First 5K Crew",
        emoji: "🏃",
        description: "Sponsor a Couch-to-5K squad. 8 weeks of training, real friendships, your gear.",
        reward: "Exclusive gear drop for finishers",
        whyItWorks: "60-90 min of real engagement vs. 3-second scroll.",
      },
      valuePoints: [
        "60-90 minutes of genuine brand engagement",
        "Quest rewards work like influencer kits — for real users",
        "User-generated content as quest completion steps",
      ],
    },
    {
      id: "apartments",
      title: "Apartments & HOAs",
      icon: "Building",
      tagline: "Turn neighbors into friends",
      exampleQuest: {
        name: "Coffee Crawl Neighbors",
        emoji: "☕",
        description: "Residents explore 4 local cafes together. Build the hallway wave into real friendship.",
        reward: "Gift card to the winning cafe",
        whyItWorks: "Resident retention through belonging, not just amenities.",
      },
      valuePoints: [
        "Boost resident retention through real community",
        "Reduce turnover costs with social stickiness",
        "Differentiate your property with unique programming",
      ],
    },
    {
      id: "corporate",
      title: "Corporate Teams",
      icon: "Briefcase",
      tagline: "Bond before the first Monday",
      exampleQuest: {
        name: "New Hire Explorer Squad",
        emoji: "🗺️",
        description: "Onboarding cohort discovers the city together. Team bonds before the first standup.",
        reward: "Team lunch on the company",
        whyItWorks: "Remote-first teams need IRL rituals to stick.",
      },
      valuePoints: [
        "Onboard remote employees with real connection",
        "Build team culture across distributed offices",
        "Reduce early attrition through belonging",
      ],
    },
    {
      id: "communities",
      title: "Community Orgs",
      icon: "Users",
      tagline: "From members to friends",
      exampleQuest: {
        name: "Alumni Happy Hour Chain",
        emoji: "🍻",
        description: "Monthly rotating venue. Same crew shows up. Network becomes friendship.",
        reward: "First round on the alumni association",
        whyItWorks: "Membership means nothing without showing up.",
      },
      valuePoints: [
        "Activate passive members into engaged participants",
        "Create sticky rituals that drive renewals",
        "Build real community, not just email lists",
      ],
    },
    {
      id: "founders",
      title: "Creators & Founders",
      icon: "Rocket",
      tagline: "Test with real users",
      exampleQuest: {
        name: "Beta Tester Breakfast",
        emoji: "🍳",
        description: "Host 6 early adopters for feedback brunch. Real users, real insights, real conversation.",
        reward: "Free product + founding member status",
        whyItWorks: "Eager adventurers give honest feedback over good food.",
      },
      valuePoints: [
        "Recruit engaged beta testers for your product",
        "Get qualitative feedback in a structured setting",
        "Build a founding community of early advocates",
      ],
    },
  ],
  
  // Educational concept cards
  concepts: [
    {
      title: "Dwell Time",
      icon: "Clock",
      description: "60-90 minutes of real engagement vs. 3-second scroll. Attention you can't buy.",
    },
    {
      title: "Ritualized Third Places",
      icon: "Home",
      description: "Regular spots + regular crews = belonging. The coffee shop becomes their coffee shop.",
    },
    {
      title: "Low-Stakes Activation",
      icon: "Gift",
      description: "Reward kits for real users, not just influencers. Authentic advocacy at scale.",
    },
  ],
  
  // Process steps (keeping similar structure)
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
  
  ctaText: "Partner With Us",
  note: "Fill out our quick form and we'll reach out within 48 hours.",
};

export const WORK_WITH_US_PAGE = {
  title: "Work With Us",
  subtitle: "Help people find belonging. Build your reputation. On your schedule.",
  roles: [
    {
      title: "Community Hosts",
      description: "Be the friendly face that welcomes squads. Guide conversations, keep the energy warm.",
    },
    {
      title: "Contributors",
      description: "Help us grow: design, code, content, marketing. Real startup experience, flexible hours.",
    },
    {
      title: "Campus Ambassadors",
      description: "Represent OpenClique at your university. Build community, gain leadership experience.",
    },
  ],
  whoWeLookFor: ["Collaborative", "Creative", "Communicates quickly", "Scrappy", "Community-Driven"],
  faq: [
    {
      question: "Is this paid?",
      answer: "Most roles are volunteer-based with priority for future full-time positions as we grow. Looking to create paid experiences? Check out our Quest Creator program on the Creators page.",
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
      question: "Want to design and lead quests?",
      answer: "Check out our Quest Creator program on the Creators page. Build your reputation, get discovered by brands, and earn from your experiences.",
    },
  ],
  ctaText: "Join the Team",
  note: "No pressure. Apply in 2 minutes.",
  creatorsLink: "/creators",
};

// =============================================================================
// CREATORS PAGE CONTENT
// =============================================================================

export const CREATORS_PAGE = {
  title: "Turn Your Followers Into Real-World Communities",
  subtitle: "Create custom quests for your audience. Watch them form lasting friendships around what you teach.",
  
  valueProps: [
    {
      title: "Design Your Quest",
      description: "Use our templates to create branded experiences for your audience in any city.",
      icon: "palette",
    },
    {
      title: "Activate Your Community",
      description: "Give followers a structured way to connect IRL around your content.",
      icon: "users",
    },
    {
      title: "Track Your Impact",
      description: "See real engagement from your audience — not just likes, but lasting connections.",
      icon: "trending-up",
    },
  ],
  
  useCases: [
    {
      title: "Fitness & Wellness",
      description: "City-wide workout challenges that turn online followers into running buddies.",
      icon: "dumbbell",
      image: "running",
      expandedDescription: "Transform your fitness community from passive followers to active workout partners who push each other IRL.",
      exampleQuests: [
        "5K training squad with weekly group runs",
        "Yoga in the park sunrise sessions",
        "CrossFit challenge with local box partnerships"
      ],
      perfectFor: "Trainers, fitness influencers, running coaches, yoga instructors"
    },
    {
      title: "Food & Lifestyle",
      description: "Local food tours & experience trails curated by your taste.",
      icon: "utensils",
      image: "food-truck",
      expandedDescription: "Turn your food recs into shared experiences. Your followers don't just see your content — they taste it together.",
      exampleQuests: [
        "Hidden gem restaurant crawl",
        "Farmers market cooking challenge",
        "Coffee shop tour with latte art contest"
      ],
      perfectFor: "Food bloggers, lifestyle influencers, travel content creators"
    },
    {
      title: "Musicians & Bands",
      description: "Fan meetups, listening parties, and local music experiences.",
      icon: "music",
      image: "concert",
      expandedDescription: "Connect your fans beyond the show. Build a community that shares your music IRL, not just in their headphones.",
      exampleQuests: [
        "Album release listening party",
        "Pre-show fan meetup and hangout",
        "Local venue discovery crawl"
      ],
      perfectFor: "Independent artists, bands building local scenes, DJs with dedicated followers"
    },
    {
      title: "Podcasters",
      description: "Live recordings, listener meetups, and topic-based discussions.",
      icon: "mic",
      image: "coffee-shop",
      expandedDescription: "Your listeners already feel like they know you. Give them a chance to know each other too.",
      exampleQuests: [
        "Live podcast recording with audience",
        "Book club for podcast episodes",
        "Topic deep-dive discussion groups"
      ],
      perfectFor: "Podcast hosts, audio creators, interview-style content makers"
    },
    {
      title: "Hobby & Nerd Groups",
      description: "Board game nights, book clubs, crafting circles, and cosplay meetups.",
      icon: "gamepad",
      image: "rooftop",
      expandedDescription: "Your niche community is already passionate. Help them find each other and geek out together.",
      exampleQuests: [
        "Board game tournament night",
        "Book club with themed snacks",
        "Crafting circle with skill shares"
      ],
      perfectFor: "Gaming streamers, book reviewers, craft tutorials, fandom creators"
    },
    {
      title: "Educators & Coaches",
      description: "Learning squads & project groups that bring your lessons to life.",
      icon: "graduation-cap",
      image: "mural",
      expandedDescription: "Move your students from passive learning to active practice. Real skills stick when learned together.",
      exampleQuests: [
        "Photography walk with peer feedback",
        "Language practice conversation circles",
        "Business mastermind lunch sessions"
      ],
      perfectFor: "Course creators, skill teachers, coaches, mentorship programs"
    },
  ],
  
  howItWorks: [
    {
      step: 1,
      title: "Build Your Quest",
      description: "Use our creator studio to design experiences that match your brand.",
    },
    {
      step: 2,
      title: "Share With Your Audience",
      description: "Promote via email, social, or link in bio. We handle the rest.",
    },
    {
      step: 3,
      title: "Followers Form Squads",
      description: "Your audience gets matched into small groups and completes challenges.",
    },
    {
      step: 4,
      title: "Track & Earn",
      description: "See real engagement analytics and earn from participation.",
    },
  ],
  
  buggs: {
    title: "Your Secret Weapon: BUGGS",
    subtitle: "The rabbit pulling levers behind the curtain",
    description: "While you focus on creating content, BUGGS handles the logistics. Conversation starters, gentle reminders, and backup plans so every squad has a great experience.",
  },
  
  faq: [
    {
      question: "What kind of creators is this for?",
      answer: "Any creator with an engaged audience who wants to help followers connect IRL. Fitness coaches, musicians, podcasters, food bloggers, hobby groups, educators — if your audience shares an interest, you can build a quest around it.",
    },
    {
      question: "Do I need to be there in person?",
      answer: "No! Your quests run independently with BUGGS guiding the squads. You design the experience once, and it can run in any city where you have followers.",
    },
    {
      question: "How do I get started?",
      answer: "Apply through our form. We'll review your audience and reach out within 48 hours to discuss next steps and how we can work together.",
    },
    {
      question: "What's the creator studio?",
      answer: "A simple tool to design quests using templates. Set the activity, challenges, rewards, and branding — no technical skills required.",
    },
  ],
  
  ctaText: "Become a Creator Partner",
  note: "Apply in 2 minutes. We'll reach out within 48 hours.",
  
  // Quest Creator Marketplace Section
  questCreators: {
    sectionTitle: "For Quest Creators",
    subtitle: "The Airbnb of Local Experiences",
    description: "You don't need a following. You just need great ideas. Build your reputation through incredible quests, and let brands discover you.",
    hook: "The best quests make the community feel alive. Top creators get hired directly by brands to craft unique, niche experiences from a local perspective.",
    pathSteps: [
      {
        step: 1,
        title: "Lead Your First Quest",
        description: "Start small. Host a coffee crawl, a park cleanup, or a sunset photo walk."
      },
      {
        step: 2,
        title: "Collect Reviews",
        description: "Squad members rate their experience. Great hosts build great reputations."
      },
      {
        step: 3,
        title: "Build Your Portfolio",
        description: "Your completed quests become your resume. Showcase what you do best."
      },
      {
        step: 4,
        title: "Get Discovered",
        description: "High-rated creators get matched with brand sponsors looking for local activations."
      },
    ],
    benefits: [
      {
        title: "Reviews & Ratings",
        description: "Every squad member rates their experience. Build social proof.",
        icon: "star",
      },
      {
        title: "Quest Portfolio",
        description: "Showcase completed experiences. Your track record is your resume.",
        icon: "briefcase",
      },
      {
        title: "Audience Tags",
        description: "Get tagged for your niche: fitness, nightlife, food, art, wellness.",
        icon: "tag",
      },
      {
        title: "Brand Matching",
        description: "Top performers get hired by sponsors for paid activations.",
        icon: "handshake",
      },
    ],
  },
};

// =============================================================================
// FOOTER CONTENT
// =============================================================================

export const FOOTER = {
  copyright: `© ${new Date().getFullYear()} OpenClique. All rights reserved.`,
  links: [
    { label: "For Businesses", href: "/partners" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Community Guidelines", href: "/terms#community-guidelines" },
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
