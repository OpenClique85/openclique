// Bot personas for solo squad simulation
// These synthetic users allow admins to test squad features solo

export interface BotPersona {
  id: string;
  name: string;
  emoji: string;
  personality: string;
  responseStyle: 'enthusiastic' | 'supportive' | 'thoughtful';
  avatarUrl?: string;
}

export const BOT_PERSONAS: BotPersona[] = [
  {
    id: 'bot-luna',
    name: 'Luna Martinez',
    emoji: '🌙',
    personality: 'Enthusiastic first-timer, asks questions',
    responseStyle: 'enthusiastic',
  },
  {
    id: 'bot-max',
    name: 'Max Chen',
    emoji: '⛰️',
    personality: 'Experienced adventurer, supportive',
    responseStyle: 'supportive',
  },
  {
    id: 'bot-riley',
    name: 'Riley Kim',
    emoji: '📚',
    personality: 'Quiet observer, thoughtful responses',
    responseStyle: 'thoughtful',
  },
];

// Response templates by category
export const BOT_RESPONSES = {
  greeting: [
    "Hey! Excited to meet everyone! 👋",
    "Hello squad! Can't wait for this adventure!",
    "Hi all! First time doing something like this 😊",
    "Hey there! Super pumped to be here!",
    "Hi everyone! Looking forward to this!",
  ],
  enthusiasm: [
    "This is going to be so much fun!",
    "I've been looking forward to this all week!",
    "Love the energy in this group already!",
    "So excited for this experience!",
    "Can't wait to see how this goes!",
  ],
  question: [
    "What should we bring?",
    "Anyone been to this location before?",
    "What time are we meeting exactly?",
    "Any tips for first-timers?",
    "Should we coordinate on anything beforehand?",
  ],
  ready: [
    "I'm all set! See you there!",
    "Ready to go! 🎒",
    "Confirmed and excited!",
    "All prepared! Let's do this!",
    "Count me in, ready when you are!",
  ],
  supportive: [
    "Great question! I was wondering the same.",
    "That's a good point!",
    "Sounds like a solid plan!",
    "I'm in! Whatever works for the group.",
    "Thanks for organizing this!",
  ],
  thoughtful: [
    "I think that could work well.",
    "Makes sense to me.",
    "Good idea, I'll keep that in mind.",
    "Agreed, let's go with that.",
    "Hmm, interesting thought!",
  ],
  checkin: [
    "Just arrived! Looking around for the group.",
    "I'm here! Where is everyone?",
    "Made it! 🎉",
    "Checking in! See you all soon.",
    "Here and ready!",
  ],
  farewell: [
    "That was amazing! Thanks everyone!",
    "Had such a great time! Hope to see you all again!",
    "What a fun experience! 🙌",
    "Really enjoyed meeting everyone!",
    "Great squad! Let's do this again sometime!",
  ],
};

// Personality-specific response modifiers
export const PERSONALITY_PREFIXES: Record<BotPersona['responseStyle'], string[]> = {
  enthusiastic: ['Omg', 'Yay', 'So cool', 'Awesome', 'Woohoo'],
  supportive: ['Totally', 'For sure', 'Absolutely', 'Definitely', 'Great thinking'],
  thoughtful: ['I think', 'Hmm', 'Interesting', 'That makes sense', 'Good point'],
};

/**
 * Generate a contextual bot reply based on the user's message
 */
export function generateBotReply(
  userMessage: string,
  botPersonality: BotPersona['responseStyle']
): string {
  const lowerMessage = userMessage.toLowerCase();
  
  // Determine response category based on message content
  let category: keyof typeof BOT_RESPONSES = 'supportive';
  
  if (lowerMessage.includes('hi') || lowerMessage.includes('hey') || lowerMessage.includes('hello')) {
    category = 'greeting';
  } else if (lowerMessage.includes('?')) {
    // If user asks a question, respond supportively or answer with enthusiasm
    category = botPersonality === 'enthusiastic' ? 'enthusiasm' : 'supportive';
  } else if (lowerMessage.includes('ready') || lowerMessage.includes('confirm') || lowerMessage.includes('set')) {
    category = 'ready';
  } else if (lowerMessage.includes('here') || lowerMessage.includes('arrived') || lowerMessage.includes('check')) {
    category = 'checkin';
  } else if (lowerMessage.includes('bye') || lowerMessage.includes('thanks') || lowerMessage.includes('great time')) {
    category = 'farewell';
  } else if (botPersonality === 'enthusiastic') {
    category = 'enthusiasm';
  } else if (botPersonality === 'thoughtful') {
    category = 'thoughtful';
  }
  
  const responses = BOT_RESPONSES[category];
  const response = responses[Math.floor(Math.random() * responses.length)];
  
  // Occasionally add a personality prefix
  if (Math.random() > 0.6) {
    const prefixes = PERSONALITY_PREFIXES[botPersonality];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    return `${prefix}! ${response}`;
  }
  
  return response;
}

/**
 * Get a random response for a specific category
 */
export function getRandomResponse(category: keyof typeof BOT_RESPONSES): string {
  const responses = BOT_RESPONSES[category];
  return responses[Math.floor(Math.random() * responses.length)];
}
