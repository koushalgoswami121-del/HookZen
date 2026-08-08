import { IndustryType } from '../types';

export const VIRAL_POWER_WORDS = [
  // English
  'secret', 'stop', 'mistake', 'nobody', 'hack', 'hidden', 'exposed', 'never',
  'proven', 'crazy', 'insane', 'weird', 'shocking', 'truth', 'finally', 'worst',
  'best', 'how to', 'fastest', 'guaranteed', 'banned', 'illegal', 'free', 'save',
  'don\'t', 'avoid', 'destroy', 'unlocked', 'shortcut', 'genius', 'formula',
  'ruined', 'gamechanger', 'mindblowing', 'steal', 'exact', 'step-by-step', 'zero',
  // Spanish
  'secreto', 'error', 'nunca', 'increíble', 'truco', 'cómo', 'mejor', 'evita', 'gratis', 'verdad', 'jamás', 'peligro',
  // Hindi / Hinglish
  'galti', 'raaz', 'sach', 'mat', 'kaise', 'nuksan', 'pagal', 'sachai', 'batao',
  // French
  'erreur', 'jamais', 'astuce', 'comment', 'meilleur', 'pourquoi', 'stopper', 'vérité', 'gratuit',
  // German
  'geheimnis', 'fehler', 'nie', 'trick', 'wie', 'beste', 'stopp', 'warum', 'gratis', 'wahrheit',
  // Portuguese
  'segredo', 'erro', 'nunca', 'truque', 'como', 'melhor', 'pare', 'grátis', 'verdade',
  // Russian
  'секрет', 'ошибка', 'никогда', 'как', 'лучший', 'правда', 'бесплатно', 'фишка', 'топ',
  // Japanese
  '秘密', '必見', 'やばい', '神', '伸びる', '失敗', '理由', '方法', '無料', '裏ワザ', 'バズる',
  // Chinese
  '秘密', '必看', '避坑', '绝了', '方法', '为什么', '千万别', '爆款', '技巧', '免费',
  // Arabic
  'سر', 'خطأ', 'كيف', 'أفضل', 'حقيقة', 'مجانا', 'تجنب', 'حيلة',
  // Korean
  '비밀', '실수', '절대로', '방법', '최고', '꿀팁', '이유', '공짜'
];

export const CURIOSITY_PATTERNS = [
  /stop (doing|using|buying|making|saying)/i,
  /nobody is talking about/i,
  /the secret reason why/i,
  /\d+\s*(mistakes|hacks|reasons|steps|galti|errores|astuces|fehler|trucos)/i,
  /why your .+ is failing/i,
  /how to .+ in \d+/i,
  /what happens when you/i,
  /this one change/i,
  /never do this/i,
  /the biggest mistake/i,
  /steal my/i,
  /here's how/i,
  /don't buy/i,
  /unpopular opinion/i,
  /hack you didn't know/i,
  // Multi-lingual patterns
  /no cometas|no hagas|error que|secreto que/i, // Spanish
  /ye galti|yeh mat karo|raaz jo|sach jo/i, // Hindi / Hinglish
  /ne faites jamais|l'erreur de|l'astuce pour/i, // French
  /mach nicht|der fehler|das geheimnis/i, // German
  /não faça|o erro que|o segredo/i, // Portuguese
  /не делайте|ошибка которую|секрет который/i, // Russian
  /千万别|避坑|爆款/i, // Chinese
  /必見|やばい|絶対に/i, // Japanese
  /لا تفعل|السبب السرّي|خطأ شائع/i, // Arabic
];

export const FLUFF_WORDS = [
  'basically', 'literally', 'you know', 'kind of', 'sort of', 'um', 'uh',
  'in this video', 'today i am going to', 'welcome back', 'what is up guys',
  'so yeah', 'like i said', 'as you can see', 'without further ado',
  'make sure to like and subscribe', 'before we get started'
];

export const CALL_TO_ACTION_PATTERNS = [
  /comment/i, /save this/i, /share this/i, /link in bio/i, /follow for more/i,
  /try this/i, /let me know/i, /drop a/i, /send this to/i, /tag a friend/i,
  // Multilingual CTAs
  /comenta|guarda|comparte|sígueme/i, // Spanish
  /commentez|enregistrez|partagez|abonnez-vous/i, // French
  /kommentiere|speichern|teilen|folge mir/i, // German
  /comente|salve|compartilhe|siga/i, // Portuguese
  /комментарий|сохрани|поделись|подпишись/i, // Russian
  /कमेंट|शेयर|फॉलो|सेव/i, // Hindi
  /コメント|保存|シェア|フォロー/i, // Japanese
  /评论|保存|分享|关注/i, // Chinese
  /تعليق|حفظ|مشاركة|متابعة/i, // Arabic
  /댓글|저장|공유|팔로우/i, // Korean
];

export const INDUSTRY_KEYWORDS: Record<IndustryType, { keywords: string[]; optimalWpm: [number, number]; titleFormulas: string[] }> = {
  tech: {
    keywords: ['ai', 'chatgpt', 'code', 'app', 'iphone', 'software', 'tools', 'automation', 'productivity', 'feature', 'setup', 'update', 'macbook', 'api', 'prompt'],
    optimalWpm: [165, 195],
    titleFormulas: [
      'Stop Using [Tool] Until You Try This New AI Feature',
      '3 ChatGPT Prompts That Will Save You 10 Hours',
      'The Hidden iPhone Trick Nobody Is Using in 2026',
      'How I Built a Viral App in 48 Hours Without Coding',
    ],
  },
  finance: {
    keywords: ['money', 'tax', 'invest', 'stocks', 'wealth', 'passive income', 'credit card', 'bank', 'millionaire', 'budget', 'roi', 'crypto', 'savings', 'rich'],
    optimalWpm: [155, 185],
    titleFormulas: [
      'The 3-Minute Tax Loophole Banks Don\'t Want You to Know',
      'How to Invest $100/Month and Retire a Millionaire',
      'Stop Saving Money in a Normal Bank Account (Do This Instead)',
      '3 Credit Card Hacks That Get You Free Flights Every Year',
    ],
  },
  fitness: {
    keywords: ['muscle', 'fat loss', 'protein', 'gym', 'workout', 'abs', 'calories', 'growth', 'form', 'bench press', 'squat', 'diet', 'physique', 'gains'],
    optimalWpm: [170, 205],
    titleFormulas: [
      '3 Chest Exercise Mistakes Stopping Your Muscle Growth',
      'Eat This 50g Protein Breakfast to Burn Fat Fast',
      'Stop Doing Bicep Curls Like This (Fix Your Form)',
      'The Only Ab Workout You Need for 6-Pack Abs',
    ],
  },
  entertainment: {
    keywords: ['funny', 'reaction', 'pov', 'relatable', 'story', 'crazy', 'joke', 'movie', 'actor', 'behind the scenes', 'challenge', 'fails', 'trend'],
    optimalWpm: [160, 210],
    titleFormulas: [
      'POV: When You Realize What You Just Said Out Loud',
      'I Tried the Hardest Trend on TikTok so You Don\'t Have To',
      'The Craziest Thing That Happened at 3 AM',
      'Only 1% of People Notice What Happens in the Background',
    ],
  },
  beauty: {
    keywords: ['skincare', 'makeup', 'glow', 'dermatologist', 'routine', 'haircare', 'acne', 'dupe', 'products', 'serum', 'anti-aging', 'filter', 'aesthetic'],
    optimalWpm: [150, 180],
    titleFormulas: [
      'Stop Buying $80 Serums! This $12 Drugstore Dupe Is Better',
      '3 Skincare Habits Destroying Your Skin Barrier',
      'Dermatologist Explains: How to Get Glass Skin in 7 Days',
      'The Makeup Mistake Making You Look 10 Years Older',
    ],
  },
  education: {
    keywords: ['learn', 'study', 'psychology', 'fact', 'brain', 'history', 'science', 'trick', 'memory', 'focus', 'exam', 'book', 'skills', 'career'],
    optimalWpm: [150, 180],
    titleFormulas: [
      '3 Dark Psychology Tricks to Read Anyone Instantly',
      'Study Less, Score Higher: The 80/20 Memory Technique',
      'The 1-Minute Rule That Cures Procrastination Forever',
      'Science Explains Why You Wake Up Tired Every Morning',
    ],
  },
  gaming: {
    keywords: ['fps', 'gameplay', 'build', 'meta', 'glitch', 'easter egg', 'level', 'boss', 'setup', 'rank', 'console', 'pc', 'steam', 'skins'],
    optimalWpm: [175, 215],
    titleFormulas: [
      'The Broken Weapon Meta That Everyone Is Sleeping On',
      '3 Secret Settings That Double Your Aim Accuracy Instantly',
      'I Found an Undiscovered Secret in [Game Name]',
      'How to Rank Up from Silver to Radiant in 7 Days',
    ],
  },
  business: {
    keywords: ['side hustle', 'sales', 'clients', 'revenue', 'ecommerce', 'marketing', 'scale', 'brand', 'ceo', 'agency', 'business', 'profit', 'funnel'],
    optimalWpm: [160, 190],
    titleFormulas: [
      '3 Side Hustles You Can Start Today With $0',
      'How to Get Your First 100 Paying Clients in 30 Days',
      'The E-Commerce Strategy That Generated $50,000 in 1 Week',
      'Why 90% of Small Businesses Fail in Their First Year',
    ],
  },
  storytelling: {
    keywords: ['story', 'unbelievable', 'lesson', 'journey', 'life', 'moment', 'happened', 'secret', 'truth', 'plot twist', 'changed everything', 'discovered'],
    optimalWpm: [145, 175],
    titleFormulas: [
      'The Unbelievable Story of How One Phone Call Saved My Life',
      'I Left My $200k Job and What Happened Next Shocked Everyone',
      'The Moment Everything Changed Forever',
      'The Dark Secret Behind the World\'s Biggest Brand',
    ],
  },
  lifestyle: {
    keywords: ['day in my life', 'routine', 'vlog', 'apartment', 'minimalist', 'reset', 'travel', 'food', 'coffee', 'unboxing', 'fits', 'organization'],
    optimalWpm: [150, 185],
    titleFormulas: [
      'A Productive Sunday Reset Routine for a Calm Week',
      '5 Minimalist Habits That Completely Transformed My Life',
      'I Tried Living Like a Billionaire for 24 Hours',
      'Things in My Apartment That Just Make Sense',
    ],
  },
};
