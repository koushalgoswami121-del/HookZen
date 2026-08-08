import { IndustryType } from '../types';
import { extractScriptInsights, generateSmartScriptHooks } from './scriptBrain';

export interface HookIdea {
  id: string;
  category: 'wish-i-knew' | 'negative-framed' | 'curiosity-gap' | 'pattern-interrupt' | 'direct-calling' | 'quantified-hack';
  template: string;
  whyItWorks: string;
}

export const VIRAL_HOOKS_100: HookIdea[] = [
  // --- CATEGORY 1: "Wish I Knew..." & Secret Reveals ---
  {
    id: 'hook-wik-1',
    category: 'wish-i-knew',
    template: 'Wish I knew this 3 years ago before I started [topic]...',
    whyItWorks: 'Creates instant regret FOMO and positions your advice as time-saving wisdom.',
  },
  {
    id: 'hook-wik-2',
    category: 'wish-i-knew',
    template: 'Wish I knew this secret trick before I wasted $1,000 on [topic]...',
    whyItWorks: 'High financial or effort stakes grab viewers before they swipe away.',
  },
  {
    id: 'hook-wik-3',
    category: 'wish-i-knew',
    template: 'I wish someone told me this about [topic] when I was starting out...',
    whyItWorks: 'Relatable vulnerability combined with actionable shortcut value.',
  },
  {
    id: 'hook-wik-4',
    category: 'wish-i-knew',
    template: 'Wish I knew this earlier: 90% of people get [topic] completely wrong!',
    whyItWorks: 'Challenges common belief while promising beginner-friendly clarity.',
  },
  {
    id: 'hook-wik-5',
    category: 'wish-i-knew',
    template: 'Wish I knew this 10-second hack before I struggled with [topic]...',
    whyItWorks: 'Low barrier to entry ("10 seconds") makes watching frictionless.',
  },
  {
    id: 'hook-wik-6',
    category: 'wish-i-knew',
    template: 'I wish I stopped doing [topic] the hard way months ago!',
    whyItWorks: 'Promises an easier, faster alternative to everyday frustration.',
  },
  {
    id: 'hook-wik-7',
    category: 'wish-i-knew',
    template: 'Wish I knew this hidden setting in [topic] that changes everything...',
    whyItWorks: 'Triggers curiosity about a secret feature or loophole.',
  },
  {
    id: 'hook-wik-8',
    category: 'wish-i-knew',
    template: 'I wish I knew why experts in [topic] keep this secret to themselves...',
    whyItWorks: 'Creates an "us vs. insider" dynamic that drives retention.',
  },
  {
    id: 'hook-wik-9',
    category: 'wish-i-knew',
    template: 'Wish I knew this simple formula before failing 5 times in [topic]...',
    whyItWorks: 'Storytelling proof of overcoming failure catches viewer empathy.',
  },
  {
    id: 'hook-wik-10',
    category: 'wish-i-knew',
    template: 'I wish I discovered this [topic] shortcut before everyone else did!',
    whyItWorks: 'Taps into early-adopter advantage and trend urgency.',
  },
  {
    id: 'hook-wik-11',
    category: 'wish-i-knew',
    template: 'Wish I knew how easy [topic] actually is once you turn this off...',
    whyItWorks: 'Simplifies complex topics down to a single actionable step.',
  },
  {
    id: 'hook-wik-12',
    category: 'wish-i-knew',
    template: 'I wish someone handed me this cheat sheet for [topic] on day one.',
    whyItWorks: 'Visual cheat sheet framing increases saves and shares.',
  },
  {
    id: 'hook-wik-13',
    category: 'wish-i-knew',
    template: 'Wish I knew this truth about [topic] before following bad advice!',
    whyItWorks: 'Warns viewers against misinformation.',
  },
  {
    id: 'hook-wik-14',
    category: 'wish-i-knew',
    template: 'Wish I knew that fixing [topic] only takes 3 simple steps...',
    whyItWorks: 'Micro-learning promise keeps watch time high.',
  },
  {
    id: 'hook-wik-15',
    category: 'wish-i-knew',
    template: 'I wish I stopped ignoring this red flag in [topic] sooner!',
    whyItWorks: 'Urgent warning phrasing prevents scroll-past.',
  },
  {
    id: 'hook-wik-16',
    category: 'wish-i-knew',
    template: 'Wish I knew this free tool existed before paying for [topic]...',
    whyItWorks: 'Free value hook drives massive comment engagement.',
  },

  // --- CATEGORY 2: Negative Framing & Warning Hooks ---
  {
    id: 'hook-neg-1',
    category: 'negative-framed',
    template: 'Stop scrolling if you want to fix your [topic] right now!',
    whyItWorks: 'Direct command interrupts mindless scrolling.',
  },
  {
    id: 'hook-neg-2',
    category: 'negative-framed',
    template: 'The #1 mistake people make when trying to improve [topic]...',
    whyItWorks: 'Loss aversion: viewers hate making avoidable mistakes.',
  },
  {
    id: 'hook-neg-3',
    category: 'negative-framed',
    template: 'Stop doing [topic] like this! It’s completely ruining your results.',
    whyItWorks: 'High shock value makes viewers pause to see if they are doing it wrong.',
  },
  {
    id: 'hook-neg-4',
    category: 'negative-framed',
    template: 'If you’re still doing [topic] the old way, you need to stop immediately!',
    whyItWorks: 'Appeals to modernity and staying up to date.',
  },
  {
    id: 'hook-neg-5',
    category: 'negative-framed',
    template: 'Never start [topic] until you check this one critical detail!',
    whyItWorks: 'Creates a safety check barrier before taking action.',
  },
  {
    id: 'hook-neg-6',
    category: 'negative-framed',
    template: '3 things you must NEVER do if you want to succeed in [topic]...',
    whyItWorks: 'Listicle format + negative warning = peak short-form retention.',
  },
  {
    id: 'hook-neg-7',
    category: 'negative-framed',
    template: 'Why 95% of creators fail at [topic] within their first 30 days...',
    whyItWorks: 'Identifies a common pain point and promises the solution.',
  },
  {
    id: 'hook-neg-8',
    category: 'negative-framed',
    template: 'This habit is secretly destroying your progress in [topic]!',
    whyItWorks: 'Uncovers hidden mistakes viewers might not be aware of.',
  },
  {
    id: 'hook-neg-9',
    category: 'negative-framed',
    template: 'Don’t waste another dollar on [topic] until you watch this video!',
    whyItWorks: 'Protects the viewer’s wallet and builds trust.',
  },
  {
    id: 'hook-neg-10',
    category: 'negative-framed',
    template: 'The worst advice I ever received about [topic] (and what to do instead)...',
    whyItWorks: 'Debunks bad industry advice and offers an alternative.',
  },
  {
    id: 'hook-neg-11',
    category: 'negative-framed',
    template: 'Stop ignoring this warning sign in your [topic] routine!',
    whyItWorks: 'Creates urgent self-diagnostic interest.',
  },
  {
    id: 'hook-neg-12',
    category: 'negative-framed',
    template: 'Why your current [topic] strategy is completely holding you back...',
    whyItWorks: 'Explains lack of progress and points to a missing piece.',
  },
  {
    id: 'hook-neg-13',
    category: 'negative-framed',
    template: 'If you do this in [topic], you are losing time every single day!',
    whyItWorks: 'Time loss triggers strong psychological urgency.',
  },
  {
    id: 'hook-neg-14',
    category: 'negative-framed',
    template: 'Delete these 3 bad habits if you want better [topic] results!',
    whyItWorks: 'Actionable elimination advice is easy to digest.',
  },
  {
    id: 'hook-neg-15',
    category: 'negative-framed',
    template: 'The biggest lie you’ve been told about mastering [topic]...',
    whyItWorks: 'Exposing myths generates controversy and debate in comments.',
  },
  {
    id: 'hook-neg-16',
    category: 'negative-framed',
    template: 'Stop overcomplicating [topic]! Here is the lazy person’s way.',
    whyItWorks: 'Appeals to efficiency and desire for simplicity.',
  },

  // --- CATEGORY 3: Curiosity Gap & Unpopular Opinions ---
  {
    id: 'hook-cg-1',
    category: 'curiosity-gap',
    template: 'Nobody is talking about this, but it changes everything for [topic]...',
    whyItWorks: 'Positions your video as exclusive, breaking news.',
  },
  {
    id: 'hook-cg-2',
    category: 'curiosity-gap',
    template: 'Unpopular opinion: Most advice about [topic] is totally wrong.',
    whyItWorks: 'Controversy drives high comment section activity.',
  },
  {
    id: 'hook-cg-3',
    category: 'curiosity-gap',
    template: 'Why 99% of people struggle with [topic] (and how to be the 1%)...',
    whyItWorks: 'Elitism / aspirational hook drives retention.',
  },
  {
    id: 'hook-cg-4',
    category: 'curiosity-gap',
    template: 'The dirty secret about [topic] that nobody wants to admit...',
    whyItWorks: 'Taboo framing generates intense curiosity.',
  },
  {
    id: 'hook-cg-5',
    category: 'curiosity-gap',
    template: 'Here’s what happens when you actually test [topic] for 30 days straight...',
    whyItWorks: 'Experiment storytelling format keeps watch time high.',
  },
  {
    id: 'hook-cg-6',
    category: 'curiosity-gap',
    template: 'This 10-second change doubled my results in [topic] overnight...',
    whyItWorks: 'High impact result in minimal time.',
  },
  {
    id: 'hook-cg-7',
    category: 'curiosity-gap',
    template: 'The real reason why [topic] feels so hard right now...',
    whyItWorks: 'Validates viewer struggle while offering clarity.',
  },
  {
    id: 'hook-cg-8',
    category: 'curiosity-gap',
    template: 'I tried the most viral [topic] hack on the internet. Here’s what happened...',
    whyItWorks: 'Myth-busting and testing viral trends.',
  },
  {
    id: 'hook-cg-9',
    category: 'curiosity-gap',
    template: 'There are two types of people when it comes to [topic]...',
    whyItWorks: 'Polarization forces viewers to self-identify.',
  },
  {
    id: 'hook-cg-10',
    category: 'curiosity-gap',
    template: 'This hidden trick in [topic] feels almost illegal to know...',
    whyItWorks: 'Curiosity trigger that promises extreme value.',
  },
  {
    id: 'hook-cg-11',
    category: 'curiosity-gap',
    template: 'What happens if you combine [topic] with this simple technique?',
    whyItWorks: 'Formulaic synergy hook creates curiosity.',
  },
  {
    id: 'hook-cg-12',
    category: 'curiosity-gap',
    template: 'The one question you should always ask before doing [topic]...',
    whyItWorks: 'Single question framework holds attention.',
  },
  {
    id: 'hook-cg-13',
    category: 'curiosity-gap',
    template: 'I analyzed 100 top experts in [topic] and found this single pattern...',
    whyItWorks: 'Data-driven authority hook builds immediate trust.',
  },
  {
    id: 'hook-cg-14',
    category: 'curiosity-gap',
    template: 'Why everyone is suddenly switching their strategy for [topic]...',
    whyItWorks: 'Social proof and fear of missing out on new trends.',
  },
  {
    id: 'hook-cg-15',
    category: 'curiosity-gap',
    template: 'This tiny detail in [topic] separates amateurs from pros...',
    whyItWorks: 'Aspirational leveling-up hook.',
  },
  {
    id: 'hook-cg-16',
    category: 'curiosity-gap',
    template: 'How one simple change in [topic] saved me 5 hours every week...',
    whyItWorks: 'Quantified time savings speaks to busy viewers.',
  },

  // --- CATEGORY 4: Pattern Interrupts & Surprises ---
  {
    id: 'hook-pi-1',
    category: 'pattern-interrupt',
    template: 'Wait! Don’t scroll past if you care about your [topic]...',
    whyItWorks: 'Direct callout stops automated thumb movement.',
  },
  {
    id: 'hook-pi-2',
    category: 'pattern-interrupt',
    template: 'Forget everything you’ve been told about [topic]. Do this instead!',
    whyItWorks: 'Resets expectation and promises a fresh perspective.',
  },
  {
    id: 'hook-pi-3',
    category: 'pattern-interrupt',
    template: 'I tested every single [topic] strategy so you don’t have to...',
    whyItWorks: 'Saves viewer effort and acts as a research shortcut.',
  },
  {
    id: 'hook-pi-4',
    category: 'pattern-interrupt',
    template: 'This is going to surprise a lot of people in [topic], but hear me out...',
    whyItWorks: 'Prepares viewer for a hot take without aggressive tone.',
  },
  {
    id: 'hook-pi-5',
    category: 'pattern-interrupt',
    template: 'Look at this before you make your next move in [topic]!',
    whyItWorks: 'Visual call-to-look holds gaze on screen.',
  },
  {
    id: 'hook-pi-6',
    category: 'pattern-interrupt',
    template: 'Pause this video right now if you are working on [topic] today!',
    whyItWorks: 'Action-oriented pause command.',
  },
  {
    id: 'hook-pi-7',
    category: 'pattern-interrupt',
    template: 'If I had to rebuild my entire [topic] setup from scratch, I’d start here...',
    whyItWorks: 'Fresh start roadmap is extremely popular for saves.',
  },
  {
    id: 'hook-pi-8',
    category: 'pattern-interrupt',
    template: 'Watch what happens to [topic] when you make this tiny tweak...',
    whyItWorks: 'Before-and-after expectation hook.',
  },
  {
    id: 'hook-pi-9',
    category: 'pattern-interrupt',
    template: 'Put down what you’re doing and check your [topic] right now!',
    whyItWorks: 'High urgency real-time check.',
  },
  {
    id: 'hook-pi-10',
    category: 'pattern-interrupt',
    template: 'This 5-second rule changed how I view [topic] forever...',
    whyItWorks: 'Memorable rule framework encourages re-watching.',
  },
  {
    id: 'hook-pi-11',
    category: 'pattern-interrupt',
    template: 'Stop scrolling! Here is the exact [topic] formula you needed today.',
    whyItWorks: 'Serendipity hook ("you needed today").',
  },
  {
    id: 'hook-pi-12',
    category: 'pattern-interrupt',
    template: 'Before you post your next video about [topic], check this checklist!',
    whyItWorks: 'Pre-flight check value hook.',
  },
  {
    id: 'hook-pi-13',
    category: 'pattern-interrupt',
    template: 'I’m only going to say this once about [topic]...',
    whyItWorks: 'Scarcity and exclusive tone.',
  },
  {
    id: 'hook-pi-14',
    category: 'pattern-interrupt',
    template: 'This visual trick makes [topic] 10x easier to understand!',
    whyItWorks: 'Promises visual clarity.',
  },
  {
    id: 'hook-pi-15',
    category: 'pattern-interrupt',
    template: 'If you only take away one tip about [topic] this week, make it this one!',
    whyItWorks: 'Filters out noise down to top recommendation.',
  },
  {
    id: 'hook-pi-16',
    category: 'pattern-interrupt',
    template: 'Here is what nobody tells you before entering [topic]...',
    whyItWorks: 'Behind-the-scenes reality check.',
  },

  // --- CATEGORY 5: Direct Calling & Audience Qualification ---
  {
    id: 'hook-dc-1',
    category: 'direct-calling',
    template: 'If you are struggling with [topic], this video was made specifically for you.',
    whyItWorks: 'Extreme personalization makes the viewer feel seen.',
  },
  {
    id: 'hook-dc-2',
    category: 'direct-calling',
    template: 'For anyone who feels stuck doing [topic], this is your 30-second sign.',
    whyItWorks: 'Empathetic validation creates trust.',
  },
  {
    id: 'hook-dc-3',
    category: 'direct-calling',
    template: 'Calling all people interested in [topic]: stop scrolling and save this!',
    whyItWorks: 'Direct qualification filters for high-intent viewers.',
  },
  {
    id: 'hook-dc-4',
    category: 'direct-calling',
    template: 'If your goal is to master [topic] in 2026, start with these 3 rules.',
    whyItWorks: 'Future-focused goal alignment.',
  },
  {
    id: 'hook-dc-5',
    category: 'direct-calling',
    template: 'Are you still trying to figure out [topic]? Here is the exact shortcut.',
    whyItWorks: 'Addresses active confusion with direct remedy.',
  },
  {
    id: 'hook-dc-6',
    category: 'direct-calling',
    template: 'If you want better results in [topic] without spending hours, watch this.',
    whyItWorks: 'Promises high output for low effort input.',
  },
  {
    id: 'hook-dc-7',
    category: 'direct-calling',
    template: 'To anyone struggling to stay consistent with [topic]...',
    whyItWorks: 'Targets consistency pain point.',
  },
  {
    id: 'hook-dc-8',
    category: 'direct-calling',
    template: 'If you’ve been doing [topic] for more than 3 months and see no progress...',
    whyItWorks: 'Addresses frustration plateau.',
  },
  {
    id: 'hook-dc-9',
    category: 'direct-calling',
    template: 'Beginner in [topic]? Here are 3 things you can safely ignore.',
    whyItWorks: 'Relieves overwhelmed beginners.',
  },
  {
    id: 'hook-dc-10',
    category: 'direct-calling',
    template: 'If you love [topic], this new update is about to blow your mind!',
    whyItWorks: 'Enthusiast excitement trigger.',
  },
  {
    id: 'hook-dc-11',
    category: 'direct-calling',
    template: 'Attention: if you handle [topic] daily, you need this workflow.',
    whyItWorks: 'Workplace/daily routine efficiency hook.',
  },
  {
    id: 'hook-dc-12',
    category: 'direct-calling',
    template: 'If you want to stand out in [topic], stop doing what everyone else is doing.',
    whyItWorks: 'Differentiation callout.',
  },
  {
    id: 'hook-dc-13',
    category: 'direct-calling',
    template: 'For anyone who wants to level up their [topic] skills this weekend...',
    whyItWorks: 'Time-bounded weekend challenge.',
  },
  {
    id: 'hook-dc-14',
    category: 'direct-calling',
    template: 'If you’re tired of overthinking [topic], use this simple framework.',
    whyItWorks: 'Eliminates mental fatigue.',
  },
  {
    id: 'hook-dc-15',
    category: 'direct-calling',
    template: 'Hey you! Yes, you trying to figure out [topic]... listen up!',
    whyItWorks: 'Conversational direct address.',
  },
  {
    id: 'hook-dc-16',
    category: 'direct-calling',
    template: 'If you care about getting real results in [topic], do this first.',
    whyItWorks: 'Prioritization hook.',
  },

  // --- CATEGORY 6: Quantified Hacks & Quick Step Formulas ---
  {
    id: 'hook-qh-1',
    category: 'quantified-hack',
    template: '3 simple steps to master [topic] in under 60 seconds.',
    whyItWorks: 'Bite-sized structured value proposition.',
  },
  {
    id: 'hook-qh-2',
    category: 'quantified-hack',
    template: 'How I went from struggling at [topic] to 10x results in 14 days...',
    whyItWorks: 'Transformation journey with clear metrics.',
  },
  {
    id: 'hook-qh-3',
    category: 'quantified-hack',
    template: 'The exact 3-minute framework that solved my biggest [topic] problem...',
    whyItWorks: 'Framework naming increases authority.',
  },
  {
    id: 'hook-qh-4',
    category: 'quantified-hack',
    template: 'Try this 5-second hack next time you do [topic]!',
    whyItWorks: 'Actionable micro-experiment.',
  },
  {
    id: 'hook-qh-5',
    category: 'quantified-hack',
    template: '3 free tools for [topic] that feel like cheat codes!',
    whyItWorks: 'Tool roundups generate massive bookmarks/shares.',
  },
  {
    id: 'hook-qh-6',
    category: 'quantified-hack',
    template: 'How to fix your entire [topic] setup in just 4 clicks...',
    whyItWorks: 'Ultra-low friction solution.',
  },
  {
    id: 'hook-qh-7',
    category: 'quantified-hack',
    template: 'The 80/20 rule of [topic]: 20% effort for 80% of your results!',
    whyItWorks: 'Leverages Pareto Principle efficiency.',
  },
  {
    id: 'hook-qh-8',
    category: 'quantified-hack',
    template: 'Steal my exact step-by-step checklist for [topic]!',
    whyItWorks: 'Ethical "stealing" offer drives bookmark retention.',
  },
  {
    id: 'hook-qh-9',
    category: 'quantified-hack',
    template: '1 simple tweak to boost your [topic] performance by 50%!',
    whyItWorks: 'Percentage gain promise.',
  },
  {
    id: 'hook-qh-10',
    category: 'quantified-hack',
    template: 'The 3-word phrase that instantly improves your [topic]...',
    whyItWorks: 'Ultra-specific language hack.',
  },
  {
    id: 'hook-qh-11',
    category: 'quantified-hack',
    template: 'How to automate 90% of your [topic] tasks for free...',
    whyItWorks: 'Automation + free = viral formula.',
  },
  {
    id: 'hook-qh-12',
    category: 'quantified-hack',
    template: '5 quick fixes for [topic] you can do right now on your phone.',
    whyItWorks: 'Mobile convenience hook.',
  },
  {
    id: 'hook-qh-13',
    category: 'quantified-hack',
    template: 'The 1-minute daily habit that makes [topic] effortless...',
    whyItWorks: 'Habit stacking promise.',
  },
  {
    id: 'hook-qh-14',
    category: 'quantified-hack',
    template: 'How to double your progress in [topic] without working extra hours...',
    whyItWorks: 'Eliminates burn-out mindset.',
  },
  {
    id: 'hook-qh-15',
    category: 'quantified-hack',
    template: '3 secret shortcuts in [topic] that save me 10 hours every month!',
    whyItWorks: 'Time saving quantification.',
  },
  {
    id: 'hook-qh-16',
    category: 'quantified-hack',
    template: 'The zero-cost strategy that transformed my [topic] forever...',
    whyItWorks: 'Zero cost removes financial resistance.',
  },
  {
    id: 'hook-qh-17',
    category: 'quantified-hack',
    template: 'Master [topic] with this simple 3-part blueprint!',
    whyItWorks: 'Blueprint terminology implies structured success.',
  },
  {
    id: 'hook-qh-18',
    category: 'quantified-hack',
    template: 'How to get professional results in [topic] using basic tools.',
    whyItWorks: 'Democratizes high-end output.',
  },
  {
    id: 'hook-qh-19',
    category: 'quantified-hack',
    template: 'The 2-minute test to see if your [topic] strategy is actually working.',
    whyItWorks: 'Self-assessment quiz hook.',
  },
  {
    id: 'hook-qh-20',
    category: 'quantified-hack',
    template: 'Copy these 3 exact templates to level up your [topic] today!',
    whyItWorks: 'Copy-paste convenience value.',
  },
];

/**
 * Formats template strings by converting placeholders using the local NLP script brain or default fallback placeholders.
 */
export function formatHookTemplate(template: string, inputString?: string): string {
  const isGenericIndustry = !inputString || ['tech', 'fitness', 'finance', 'real estate', 'gaming', 'fashion', 'e-commerce', 'general'].includes(inputString.toLowerCase().trim());

  let topicToUse = '[your topic]';
  let audienceToUse = '[your audience]';
  let goalToUse = '[your goal]';

  if (inputString && inputString.trim().length > 2 && !isGenericIndustry) {
    const insights = extractScriptInsights(inputString, inputString);
    if (insights.cleanTopic && !['tech', 'fitness', 'finance', 'real estate', 'gaming', 'fashion', 'e-commerce', 'general'].includes(insights.cleanTopic.toLowerCase().trim())) {
      topicToUse = insights.cleanTopic;
    }
    if (insights.extractedAudience) audienceToUse = insights.extractedAudience;
    if (insights.extractedSolution) goalToUse = insights.extractedSolution;
  }

  return template
    .replace(/\[topic name\]/gi, topicToUse)
    .replace(/\[topic\]/gi, topicToUse)
    .replace(/\[industry\]/gi, topicToUse)
    .replace(/\[your industry\]/gi, topicToUse)
    .replace(/\[goal\]/gi, goalToUse)
    .replace(/\[product\/service\]/gi, '[your product]')
    .replace(/\[target audience\]/gi, audienceToUse)
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Returns a randomized set of custom hook suggestions analyzed directly from the user's script content
 * using the local AI script brain without any external API dependencies.
 */
export function getRandomHookSuggestions(inputString?: string, count: number = 6): { title: string; explanation: string; category: string }[] {
  if (inputString && inputString.trim().length > 3) {
    const smartHooks = generateSmartScriptHooks(inputString, inputString);
    if (smartHooks && smartHooks.length > 0) {
      return smartHooks.slice(0, count);
    }
  }

  const wishIKnewHooks = VIRAL_HOOKS_100.filter(h => h.category === 'wish-i-knew');
  const otherHooks = VIRAL_HOOKS_100.filter(h => h.category !== 'wish-i-knew');

  const shuffle = <T>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const shuffledWish = shuffle(wishIKnewHooks);
  const shuffledOther = shuffle(otherHooks);

  // Guarantee at least 3 'wish-i-knew' hooks in the suggestions
  const selected = [...shuffledWish.slice(0, 3), ...shuffledOther.slice(0, count - 3)];
  const finalShuffled = shuffle(selected);

  return finalShuffled.map((item) => ({
    title: formatHookTemplate(item.template, inputString),
    explanation: item.whyItWorks,
    category: item.category,
  }));
}
