export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: 'hooks' | 'pacing' | 'algorithm' | 'thumbnails';
  categoryLabel: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  publishedAt: string;
  readTime: string;
  coverImage: string;
  coverAlt: string;
  keywords: string[];
  content: string; // Markdown or HTML content
  toc?: { id: string; text: string }[];
}

export const BLOG_CATEGORIES = [
  { id: 'all', label: 'All Guides' },
  { id: 'hooks', label: 'Viral Hooks' },
  { id: 'pacing', label: 'Script & Pacing' },
  { id: 'algorithm', label: 'Algorithm Hacks' },
  { id: 'thumbnails', label: 'Thumbnails & Visuals' },
];

export function getAllBlogPosts(): BlogPost[] {
  try {
    const custom = localStorage.getItem('hookzen_custom_blogs');
    if (custom) {
      const parsed: BlogPost[] = JSON.parse(custom);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const customIds = new Set(parsed.map((p) => p.id));
        const defaultFiltered = BLOG_POSTS.filter((p) => !customIds.has(p.id));
        return [...parsed, ...defaultFiltered];
      }
    }
  } catch (err) {
    console.error('Error loading custom blogs from localStorage:', err);
  }
  return BLOG_POSTS;
}

export function saveCustomBlogPost(post: BlogPost): BlogPost[] {
  const current = getAllBlogPosts();
  const existingIndex = current.findIndex((p) => p.id === post.id || p.slug === post.slug);
  let updated: BlogPost[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = post;
  } else {
    updated = [post, ...current];
  }
  localStorage.setItem('hookzen_custom_blogs', JSON.stringify(updated));
  return updated;
}

export function deleteBlogPost(postId: string): BlogPost[] {
  const current = getAllBlogPosts();
  const updated = current.filter((p) => p.id !== postId);
  localStorage.setItem('hookzen_custom_blogs', JSON.stringify(updated));
  return updated;
}
export const BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    slug: 'how-to-write-viral-hooks-for-tiktok-shorts',
    title: 'How to Write Viral Hooks for TikTok, Shorts & Reels (2026 Strategy Guide)',
    description: 'Learn the exact psychological triggers behind 3-second short-form video hooks that capture viewer attention and boost watch time completion rates.',
    category: 'hooks',
    categoryLabel: 'Viral Hooks',
    author: {
      name: 'HookZen Growth Team',
      role: 'Short-Form Video Strategists',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    },
    publishedAt: '2026-08-01',
    readTime: '4 min read',
    coverImage: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1200&auto=format&fit=crop&q=80',
    coverAlt: 'Short-form video viral hooks creation guide background',
    keywords: ['tiktok hooks', 'shorts viral title', 'reels retention', '3 second hook'],
    toc: [
      { id: 'importance-of-hooks', text: '1. Why the First 3 Seconds Decide Everything' },
      { id: 'hook-frameworks', text: '2. The 3 High-Performing Hook Frameworks' },
      { id: 'testing-with-ai', text: '3. Testing Hook Variations with HookZen AI' },
    ],
    content: `
## Why the First 3 Seconds Decide Everything

Short-form algorithms (TikTok FYP, YouTube Shorts feed, Instagram Reels algorithm) prioritize **completion rate** and **initial scroll-stop rate**. If 80% of viewers swipe away within the first 2 seconds, the algorithm immediately stops pushing your video.

### Key Psychological Triggers:
* **Pattern Interrupt:** Say or show something unexpected.
* **Curiosity Gap:** Open a question that can only be answered by staying until the end.
* **Direct Value Proposition:** Tell the viewer exactly what mistake they'll avoid.

---

## The 3 High-Performing Hook Frameworks

1. **The "Wish I Knew Earlier" Hook:**  
   *"If you are still doing [X] in 2026, stop immediately..."*

2. **The "Counter-Intuitive Truth" Hook:**  
   *"Everyone tells you to do [X], but here is why that is actually ruining your reach..."*

3. **The "Instant Proof" Visual Hook:**  
   Show the dramatic end result in frame 1 before flashing the step-by-step process.

---

## Testing Hook Variations with HookZen AI

Before spending hours editing, run your hook variations through HookZen's Viral Score Calculator to evaluate keyword alignment, emotional intensity, and pacing scores out of 100.
`,
  },
  {
    id: '2',
    slug: 'ideal-short-form-video-length-and-pacing',
    title: 'Optimal Video Length & Pacing for YouTube Shorts vs TikTok',
    description: 'Data-backed analysis on ideal video lengths, spoken word pacing (WPM), and visual scene transitions for maximum retention.',
    category: 'pacing',
    categoryLabel: 'Script & Pacing',
    author: {
      name: 'Alex Rivera',
      role: 'Content Algorithm Researcher',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    },
    publishedAt: '2026-07-28',
    readTime: '5 min read',
    coverImage: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1200&auto=format&fit=crop&q=80',
    coverAlt: 'Video pacing timeline and editing waveform',
    keywords: ['video pacing', 'shorts length', 'tiktok words per minute', 'retention curve'],
    toc: [
      { id: 'optimal-length', text: '1. Optimal Length per Platform' },
      { id: 'words-per-minute', text: '2. Spoken Words Per Minute (WPM) Benchmarks' },
      { id: 'visual-pacing', text: '3. Visual Transition Rhythm' },
    ],
    content: `
## Optimal Length per Platform

* **YouTube Shorts:** 30–45 seconds yields the highest subscriber conversion and loop rate.
* **TikTok:** 15–25 seconds for viral memes/trends; 45–60 seconds for high-RPM educational content.
* **Instagram Reels:** 11–18 seconds for maximum repeat play loops.

---

## Spoken Words Per Minute (WPM) Benchmarks

Top performing short-form videos average **160 to 190 words per minute**. Pauses longer than 1.2 seconds correlate directly with a 22% drop in retention graph curves.
`,
  },
];
