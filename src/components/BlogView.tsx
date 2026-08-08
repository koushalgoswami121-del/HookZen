import React, { useState, useEffect } from 'react';
import { BLOG_CATEGORIES, BlogPost, getAllBlogPosts } from '../data/blogData';
import { ArrowLeft, Calendar, Clock, User, Tag, Search, Sparkles, BookOpen, Share2, Check, ChevronRight } from 'lucide-react';

interface BlogViewProps {
  onBackToApp: () => void;
  initialSlug?: string | null;
}

export const BlogView: React.FC<BlogViewProps> = ({ onBackToApp, initialSlug }) => {
  const [posts, setPosts] = useState<BlogPost[]>(() => getAllBlogPosts());
  const [selectedSlug, setSelectedSlug] = useState<string | null>(initialSlug || null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Sync state if initialSlug changes or posts update
  useEffect(() => {
    setPosts(getAllBlogPosts());
  }, []);

  useEffect(() => {
    if (initialSlug) {
      setSelectedSlug(initialSlug);
    }
  }, [initialSlug]);

  const activeArticle = posts.find((p) => p.slug === selectedSlug);

  // Update dynamic SEO metadata when viewing article
  useEffect(() => {
    if (activeArticle) {
      document.title = `${activeArticle.title} | HookZen Blog`;
      
      // Update meta description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', activeArticle.description);
      }

      // Add BlogPosting JSON-LD schema dynamically
      const scriptId = 'json-ld-blog-posting';
      let existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      script.text = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        'headline': activeArticle.title,
        'description': activeArticle.description,
        'image': activeArticle.coverImage,
        'datePublished': activeArticle.publishedAt,
        'author': {
          '@type': 'Person',
          'name': activeArticle.author.name,
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'HookZen',
          'logo': {
            '@type': 'ImageObject',
            'url': 'https://hookzen.com/favicon.svg',
          },
        },
        'mainEntityOfPage': {
          '@type': 'WebPage',
          '@id': `https://hookzen.com/blog/${activeArticle.slug}`,
        },
      });
      document.head.appendChild(script);

      return () => {
        // Reset title on unmount
        document.title = 'AI Viral Score Calculator for YouTube Shorts, TikTok & Instagram Reels';
        const jsonScript = document.getElementById(scriptId);
        if (jsonScript) jsonScript.remove();
      };
    } else {
      document.title = 'Short-Form Video Viral Growth Guides & Strategies | HookZen Blog';
    }
  }, [activeArticle]);

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fade-in py-2">
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <button
          onClick={() => {
            if (selectedSlug) {
              setSelectedSlug(null);
            } else {
              onBackToApp();
            }
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-800 border border-slate-200 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400"
          aria-label={selectedSlug ? "Back to All Articles" : "Back to Viral Score Calculator"}
        >
          <ArrowLeft className="h-4 w-4 text-slate-600" />
          <span>{selectedSlug ? 'Back to All Articles' : 'Back to Calculator'}</span>
        </button>

        {/* Breadcrumb path */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <button onClick={onBackToApp} className="hover:text-amber-700 hover:underline">
            Home
          </button>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <button onClick={() => setSelectedSlug(null)} className="hover:text-amber-700 hover:underline">
            Blog
          </button>
          {activeArticle && (
            <>
              <ChevronRight className="h-3 w-3 text-slate-400" />
              <span className="text-slate-800 font-semibold line-clamp-1 max-w-[200px]">
                {activeArticle.title}
              </span>
            </>
          )}
        </nav>
      </div>

      {/* ARTICLE DETAIL VIEW */}
      {activeArticle ? (
        <article className="space-y-8 bg-white/90 rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm backdrop-blur-xs">
          {/* Article Header */}
          <header className="space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold uppercase tracking-wide">
              <Tag className="h-3 w-3 text-amber-600" />
              <span>{activeArticle.categoryLabel}</span>
            </div>

            <h1 className="font-serif-display text-3xl sm:text-5xl font-extrabold text-slate-900 leading-tight">
              {activeArticle.title}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
              {activeArticle.description}
            </p>

            {/* Author & Meta Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-b border-slate-100 py-4">
              <div className="flex items-center gap-3">
                <img
                  src={activeArticle.author.avatar}
                  alt={activeArticle.author.name}
                  loading="lazy"
                  decoding="async"
                  className="h-10 w-10 rounded-full object-cover border border-amber-200"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">{activeArticle.author.name}</p>
                  <p className="text-[11px] text-slate-500">{activeArticle.author.role}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <time dateTime={activeArticle.publishedAt}>{activeArticle.publishedAt}</time>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>{activeArticle.readTime}</span>
                </span>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-slate-700 font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
                  title="Copy Article Link"
                  aria-label="Share article link"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5 text-slate-600" />}
                  <span>{copied ? 'Copied Link!' : 'Share'}</span>
                </button>
              </div>
            </div>
          </header>

          {/* Cover Image */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-xs max-w-4xl mx-auto">
            <img
              src={activeArticle.coverImage}
              alt={activeArticle.coverAlt}
              loading="lazy"
              decoding="async"
              className="w-full h-auto max-h-[420px] object-cover"
            />
          </div>

          {/* Table of Contents & Body */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-4xl mx-auto pt-4">
            {activeArticle.toc && activeArticle.toc.length > 0 && (
              <aside className="lg:col-span-1 space-y-3 bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 h-fit">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-amber-600" />
                  <span>Table of Contents</span>
                </h2>
                <ul className="space-y-2 text-xs font-medium text-slate-700">
                  {activeArticle.toc.map((item) => (
                    <li key={item.id}>
                      <a href={`#${item.id}`} className="hover:text-amber-700 hover:underline transition-colors block">
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </aside>
            )}

            <div className={`space-y-6 text-slate-800 leading-relaxed font-sans text-sm sm:text-base ${activeArticle.toc ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
              <div
                className="prose prose-slate max-w-none space-y-4 whitespace-pre-line font-medium"
                dangerouslySetInnerHTML={{
                  __html: activeArticle.content
                    .replace(/^## (.*$)/gim, '<h2 class="text-xl sm:text-2xl font-bold font-serif-display text-slate-900 mt-6 mb-2">$1</h2>')
                    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-slate-800 mt-4 mb-1">$1</h3>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em class="italic text-slate-700">$1</em>'),
                }}
              />

              {/* Call to action box */}
              <div className="mt-10 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-amber-500/10 p-6 border border-amber-300/60 space-y-3 text-center">
                <h3 className="font-serif-display text-lg font-bold text-slate-900">
                  Ready to test your video script and hook?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md mx-auto">
                  Run your video title, transcript, and thumbnail through HookZen's AI Viral Score Calculator to get an instant 0-100 analysis before posting.
                </p>
                <button
                  onClick={onBackToApp}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-extrabold text-white hover:bg-amber-700 shadow-md transition-all cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Analyze Your Video Now</span>
                </button>
              </div>
            </div>
          </div>
        </article>
      ) : (
        /* BLOG LISTING VIEW */
        <section className="space-y-8">
          {/* Header Banner */}
          <div className="text-center space-y-3 max-w-3xl mx-auto pt-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100/80 px-3.5 py-1 text-xs font-extrabold text-amber-900 border border-amber-200">
              <BookOpen className="h-3.5 w-3.5 text-amber-600" />
              <span>HookZen Short-Form Knowledge Base</span>
            </div>
            <h1 className="font-serif-display text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Short-Form Video Viral Growth Guides
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              Data-backed research, algorithmic breakdowns, and step-by-step hook playbooks for creators on TikTok, YouTube Shorts, and Instagram Reels.
            </p>
          </div>

          {/* Controls Bar: Search & Categories */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/80 p-4 rounded-2xl border border-slate-200/90 shadow-2xs backdrop-blur-xs">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              {BLOG_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  aria-pressed={selectedCategory === cat.id}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search articles & keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                aria-label="Search blog articles"
              />
            </div>
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <article
                  key={post.id}
                  onClick={() => setSelectedSlug(post.slug)}
                  className="group flex flex-col bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer"
                >
                  {/* Cover Image */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                    <img
                      src={post.coverImage}
                      alt={post.coverAlt}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-3 left-3 bg-slate-900/90 text-white text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-lg backdrop-blur-xs">
                      {post.categoryLabel}
                    </span>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
                    <div className="space-y-2">
                      <h2 className="font-serif-display text-xl font-bold text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-2">
                        {post.title}
                      </h2>
                      <p className="text-xs text-slate-600 font-medium line-clamp-3 leading-relaxed">
                        {post.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <div className="flex items-center gap-2">
                        <img
                          src={post.author.avatar}
                          alt={post.author.name}
                          loading="lazy"
                          className="h-5 w-5 rounded-full object-cover"
                        />
                        <span>{post.author.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{post.publishedAt}</span>
                        <span>•</span>
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="col-span-full py-12 text-center bg-white/70 rounded-2xl border border-slate-200 space-y-3">
                <p className="text-sm font-bold text-slate-700">No matching articles found</p>
                <p className="text-xs text-slate-500">Try adjusting your search query or selecting a different category.</p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  className="text-xs font-bold text-amber-700 hover:underline"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
