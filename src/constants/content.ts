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
 * To change the tagline from "Build the village..." to "Find your people...":
 *   BEFORE: tagline: "Build the village you've been missing.",
 *   AFTER:  tagline: "Find your people. One Quest at a time.",
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
  tagline: "Build the village you've been missing. One Quest at a time.", // Main slogan
  description: "OpenClique brings people together in small, guided groups through real-world quests: curated activities that help turn shared interests into real friendships.",
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
  { label: "How It Works", href: "/how-it-works" },      // Process explanation
  { label: "For Creators", href: "/creators" },          // Creator landing page
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
// SECTION 3: GOOGLE FORM URLS
// =============================================================================
// These are the links to Google Forms for collecting signups.
// To update a form: replace the URL inside the quotes.
// 
// HOW TO GET YOUR FORM URL:
// 1. Open your Google Form
// 2. Click "Send" button
// 3. Click the link icon
// 4. Copy the URL and paste here

export const FORM_URLS = {
  pilot: "https://docs.google.com/forms/d/e/1FAIpQLSd9skqXpY1BsmLy4SGro8cItzQd5O486j0MySJzUxeoNd5l0w/viewform",
  partners: "https://docs.google.com/forms/d/e/1FAIpQLSdz0Y2tYSrFsSuiJEtbXFLcAsfsxa5-9KAOSgtYDU8UwRolzA/viewform",
  workWithUs: "https://docs.google.com/forms/d/e/1FAIpQLScSbXEuiYfLBc5p9p-1SJ-rwBE_duj85rW8kDAt8z-KSJqdjw/viewform",
  creators: "https://docs.google.com/forms/d/e/1FAIpQLSd9skqXpY1BsmLy4SGro8cItzQd5O486j0MySJzUxeoNd5l0w/viewform",
};


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
  headline: "Build the village you've been missing.",
  headlineAccent: "One Quest at a time.",
  subheadline: "Join a small squad. Complete a curated adventure. Make real friends.",
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
    title: "Small, Easy to Join Squads",
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
  message: "Now accepting applications for the Austin pilot.",
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
      description: "We pair you with a small squad (3-6 people) based on shared interests.",
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
    description: "BUGGS is your squad's guide: there when you need a nudge, never when you don't.",
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
  
  ctaText: "Let's Talk",
  note: "You'll be redirected to our partnership inquiry form.",
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
