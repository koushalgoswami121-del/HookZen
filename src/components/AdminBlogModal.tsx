import React, { useState, useEffect } from 'react';
import { BlogPost, BLOG_CATEGORIES, getAllBlogPosts, saveCustomBlogPost, deleteBlogPost } from '../data/blogData';
import { Lock, Plus, Trash2, Edit3, Copy, Check, X, Sparkles, BookOpen, Code, ShieldCheck, MessageSquareText, Star, Users, Search } from 'lucide-react';
import { fetchFeedbacksFromFirestore, FeedbackRecord, fetchAllUsersFromFirestore, saveUserProfileToFirestore, CloudUserProfile } from '../lib/firebase';

interface AdminBlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostsUpdated: () => void;
}

const DEFAULT_PASSCODE = 'hookoushal23';

export const AdminBlogModal: React.FC<AdminBlogModalProps> = ({ isOpen, onClose, onPostsUpdated }) => {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcodeError, setPasscodeError] = useState(false);

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'export' | 'feedbacks' | 'users'>('create');
  const [copiedCode, setCopiedCode] = useState(false);
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [usersList, setUsersList] = useState<CloudUserProfile[]>([]);
  const [usersSearch, setUsersSearch] = useState('');
  const [dirtyUsers, setDirtyUsers] = useState<Set<string>>(new Set());

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<'hooks' | 'pacing' | 'algorithm' | 'thumbnails'>('hooks');
  const [description, setDescription] = useState('');
  const [authorName, setAuthorName] = useState('HookZen Team');
  const [authorRole, setAuthorRole] = useState('Short-Form Video Strategist');
  const [authorAvatar, setAuthorAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80');
  const [publishedAt, setPublishedAt] = useState(new Date().toISOString().split('T')[0]);
  const [readTime, setReadTime] = useState('4 min read');
  const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1200&auto=format&fit=crop&q=80');
  const [coverAlt, setCoverAlt] = useState('Viral short-form content guide cover');
  const [keywords, setKeywords] = useState('tiktok, shorts, reels, hooks, retention');
  const [content, setContent] = useState(`## Introduction\n\nWrite your article here using markdown formatting.\n\n### Key Takeaways\n* **Point 1:** High impact hook\n* **Point 2:** Fast pacing and retention loops`);

  // Check session auth state
  useEffect(() => {
    if (isOpen) {
      const authSession = sessionStorage.getItem('hookzen_admin_authed');
      if (authSession === 'true') {
        setIsAuthenticated(true);
        loadFeedbacks();
        loadUsers();
      }
      setPosts(getAllBlogPosts());
    }
  }, [isOpen]);

  const loadFeedbacks = async () => {
    const data = await fetchFeedbacksFromFirestore();
    setFeedbacks(data);
  };

  const loadUsers = async () => {
    const data = await fetchAllUsersFromFirestore();
    // sort newly updated users first
    data.sort((a, b) => (b.updatedAt ? new Date(b.updatedAt).getTime() : 0) - (a.updatedAt ? new Date(a.updatedAt).getTime() : 0));
    setUsersList(data);
  };

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === DEFAULT_PASSCODE || passcode.trim() === 'admin' || passcode.trim() === 'admin123') {
      setIsAuthenticated(true);
      sessionStorage.setItem('hookzen_admin_authed', 'true');
      setPasscodeError(false);
      loadFeedbacks();
      loadUsers();
    } else {
      setPasscodeError(true);
    }
  };

  const handleAdjustCreditsStage = (user: CloudUserProfile, change: number) => {
    if (!user.uid) return;
    const newBonus = (user.bonusCredits || 0) + change;
    setUsersList(prev => prev.map(u => u.uid === user.uid ? { ...u, bonusCredits: newBonus } : u));
    setDirtyUsers(prev => new Set(prev).add(user.uid!));
  };

  const handleSaveUser = async (user: CloudUserProfile) => {
    if (!user.uid) return;
    await saveUserProfileToFirestore(user.uid, { ...user, bonusCredits: user.bonusCredits });
    setDirtyUsers(prev => {
      const next = new Set(prev);
      next.delete(user.uid!);
      return next;
    });
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingId) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setSlug(generatedSlug);
    }
  };

  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) return;

    const catObj = BLOG_CATEGORIES.find((c) => c.id === category);

    const newPost: BlogPost = {
      id: editingId || Date.now().toString(),
      slug: slug.trim(),
      title: title.trim(),
      description: description.trim(),
      category: category,
      categoryLabel: catObj ? catObj.label : 'Viral Hooks',
      author: {
        name: authorName.trim(),
        role: authorRole.trim(),
        avatar: authorAvatar.trim(),
      },
      publishedAt: publishedAt,
      readTime: readTime.trim(),
      coverImage: coverImage.trim(),
      coverAlt: coverAlt.trim(),
      keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
      content: content,
      toc: [
        { id: 'section-1', text: '1. Introduction & Strategy' },
        { id: 'section-2', text: '2. Implementation Steps' },
      ],
    };

    saveCustomBlogPost(newPost);
    setPosts(getAllBlogPosts());
    onPostsUpdated();
    resetForm();
    setActiveTab('manage');
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingId(post.id);
    setTitle(post.title);
    setSlug(post.slug);
    setCategory(post.category);
    setDescription(post.description);
    setAuthorName(post.author.name);
    setAuthorRole(post.author.role);
    setAuthorAvatar(post.author.avatar);
    setPublishedAt(post.publishedAt);
    setReadTime(post.readTime);
    setCoverImage(post.coverImage);
    setCoverAlt(post.coverAlt);
    setKeywords(post.keywords.join(', '));
    setContent(post.content);
    setActiveTab('create');
  };

  const handleDeletePost = (id: string) => {
    if (confirm('Are you sure you want to delete this article?')) {
      deleteBlogPost(id);
      setPosts(getAllBlogPosts());
      onPostsUpdated();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setSlug('');
    setCategory('hooks');
    setDescription('');
    setAuthorName('HookZen Team');
    setAuthorRole('Short-Form Video Strategist');
    setAuthorAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80');
    setPublishedAt(new Date().toISOString().split('T')[0]);
    setReadTime('4 min read');
    setCoverImage('https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1200&auto=format&fit=crop&q=80');
    setCoverAlt('Viral short-form content guide cover');
    setKeywords('tiktok, shorts, reels, hooks, retention');
    setContent(`## Introduction\n\nWrite your article content here using markdown formatting.`);
  };

  const exportTsCode = () => {
    return `// Copy & paste this array into src/data/blogData.ts under BLOG_POSTS
export const BLOG_POSTS: BlogPost[] = ${JSON.stringify(posts, null, 2)};`;
  };

  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(exportTsCode());
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-modal-title"
    >
      <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col justify-between">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-amber-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 id="admin-modal-title" className="text-base font-extrabold text-slate-900">
                HookZen Admin Blog CMS
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Secret Publishing & Content Management Console
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all cursor-pointer"
            aria-label="Close Admin Modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* AUTHENTICATION SCREEN */}
        {!isAuthenticated ? (
          <form onSubmit={handleLogin} className="space-y-5 py-6 max-w-md mx-auto text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 border border-amber-200">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Secret Admin Access</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your admin passkey to publish, edit, or manage blog articles.
              </p>
            </div>

            <div className="space-y-2">
              <input
                type="password"
                placeholder="Enter admin passcode..."
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full px-4 py-2.5 text-xs text-center font-mono rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                autoFocus
              />
              {passcodeError && (
                <p className="text-xs font-bold text-rose-600">Incorrect passcode. Try again.</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-extrabold text-amber-400 hover:bg-slate-800 transition-all shadow-md cursor-pointer"
            >
              Unlock Admin Console
            </button>
          </form>
        ) : (
          /* UNLOCKED CMS PANEL */
          <div className="space-y-6 flex-1 overflow-y-auto pr-1">
            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <button
                onClick={() => {
                  setActiveTab('create');
                  resetForm();
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'create'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                <Plus className="h-3.5 w-3.5 text-amber-700" />
                <span>{editingId ? 'Edit Article' : 'New Article'}</span>
              </button>

              <button
                onClick={() => setActiveTab('manage')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'manage'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                <BookOpen className="h-3.5 w-3.5 text-amber-700" />
                <span>Manage Posts ({posts.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('export')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'export'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                <Code className="h-3.5 w-3.5 text-amber-700" />
                <span>Export TS Code</span>
              </button>

              <button
                onClick={() => setActiveTab('feedbacks')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'feedbacks'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                <MessageSquareText className="h-3.5 w-3.5 text-amber-700" />
                <span>User Feedbacks ({feedbacks.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'users'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                <Users className="h-3.5 w-3.5 text-amber-700" />
                <span>Manage Users ({usersList.length})</span>
              </button>
            </div>

            {/* TAB 1: CREATE / EDIT FORM */}
            {activeTab === 'create' && (
              <form onSubmit={handleSavePost} className="space-y-4 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Article Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 5 Viral Hook Templates for YouTube Shorts"
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">URL Slug *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 5-viral-hook-templates"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <option value="hooks">Viral Hooks</option>
                      <option value="pacing">Script & Pacing</option>
                      <option value="algorithm">Algorithm Hacks</option>
                      <option value="thumbnails">Thumbnails & Visuals</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Publish Date</label>
                    <input
                      type="date"
                      value={publishedAt}
                      onChange={(e) => setPublishedAt(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Read Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 4 min read"
                      value={readTime}
                      onChange={(e) => setReadTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Description / Excerpt</label>
                  <textarea
                    rows={2}
                    placeholder="Brief summary of the article for Google search snippets and blog cards..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Cover Image URL</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Keywords (comma separated)</label>
                    <input
                      type="text"
                      placeholder="tiktok, hooks, algorithm, shorts"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Article Content (Markdown Supported)</label>
                  <textarea
                    rows={8}
                    required
                    placeholder="## Heading 2&#10;Write article content here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    Reset Form
                  </button>

                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-extrabold hover:bg-amber-700 transition-all shadow-md cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>{editingId ? 'Update Article' : 'Publish Article'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: MANAGE POSTS */}
            {activeTab === 'manage' && (
              <div className="space-y-3">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all"
                  >
                    <div className="space-y-1 max-w-lg">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase">
                          {post.categoryLabel}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">/blog/{post.slug}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{post.title}</h4>
                      <p className="text-[11px] text-slate-500">{post.publishedAt} • {post.readTime}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleEditPost(post)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 hover:bg-rose-100 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB y: EXPORT TS CODE */}
            {activeTab === 'export' && (
              <div className="space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-600 font-medium">
                    Copy this code to permanently hardcode all articles into <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">src/data/blogData.ts</code>:
                  </p>

                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 text-amber-400 text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer shrink-0"
                  >
                    {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedCode ? 'Copied Code!' : 'Copy Code'}</span>
                  </button>
                </div>

                <textarea
                  readOnly
                  rows={14}
                  value={exportTsCode()}
                  className="w-full p-4 text-[11px] font-mono rounded-2xl border border-slate-200 bg-slate-900 text-slate-200 selection:bg-amber-500"
                />
              </div>
            )}

            {/* TAB: FEEDBACKS */}
            {activeTab === 'feedbacks' && (
              <div className="space-y-3">
                {feedbacks.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 border border-slate-200 rounded-2xl">
                    <MessageSquareText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-500">No feedbacks collected yet.</p>
                  </div>
                ) : (
                  feedbacks.map((fb, idx) => (
                    <div key={fb.id || idx} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm text-left">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${fb.rating >= star ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200'}`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(fb.createdAt).toLocaleDateString()} {new Date(fb.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 font-medium mb-3 whitespace-pre-wrap">
                        {fb.comment || <span className="text-slate-400 italic">No comment provided</span>}
                      </p>
                      <div className="flex flex-col gap-0.5 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                        <p><span className="font-bold">UID:</span> {fb.uid || 'N/A'}</p>
                        <p><span className="font-bold">Email:</span> {fb.email || 'N/A'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 5: MANAGE USERS */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by Email or UID..."
                    value={usersSearch}
                    onChange={(e) => setUsersSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-white text-xs text-slate-900 focus:ring-2 focus:ring-amber-200 focus:outline-none shadow-sm"
                  />
                </div>

                <div className="space-y-3">
                  {usersList.length === 0 ? (
                    <div className="text-center py-6 bg-slate-50 border border-slate-200 rounded-2xl">
                      <Users className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-500">Loading or no users found.</p>
                    </div>
                  ) : (
                    usersList
                      .filter(u =>
                        !usersSearch ||
                        u.email?.toLowerCase().includes(usersSearch.toLowerCase()) ||
                        u.uid?.toLowerCase().includes(usersSearch.toLowerCase())
                      )
                      .map((u, idx) => (
                        <div key={u.uid || idx} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm text-left flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-800">{u.email || 'No Email'}</p>
                            <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
                              <span><strong className="text-slate-600">UID:</strong> {u.uid}</span>
                              <span>|</span>
                              <span><strong className="text-slate-600">Plan:</strong> {u.planType || 'free'}</span>
                              {u.isPro && <span className="bg-amber-100 text-amber-700 font-bold px-1 rounded">PRO</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-100">
                            <div className="text-center">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Bonus Credits</p>
                              <div className="flex items-center justify-center gap-3">
                                <button
                                  onClick={() => handleAdjustCreditsStage(u, -10)}
                                  className="h-6 w-6 flex items-center justify-center rounded bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold cursor-pointer"
                                  title="Remove 10 Credits (1 Analysis)"
                                >-10</button>
                                <span className="text-sm font-black text-amber-600 w-6 text-center">{u.bonusCredits || 0}</span>
                                <button
                                  onClick={() => handleAdjustCreditsStage(u, 10)}
                                  className="h-6 w-6 flex items-center justify-center rounded bg-white hover:bg-emerald-50 border border-slate-200 text-slate-700 hover:text-emerald-700 font-bold cursor-pointer"
                                  title="Add 10 Credits (1 Analysis)"
                                >+10</button>
                              </div>
                            </div>
                            <div className="text-center pl-4 border-l border-slate-200">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Used Today</p>
                              <p className="text-xs font-black text-slate-700">{u.dailyCreditsUsed || 0}</p>
                            </div>

                            {/* NEW SAVE BUTTON */}
                            {dirtyUsers.has(u.uid!) && (
                              <button
                                onClick={() => handleSaveUser(u)}
                                className="ml-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-3 py-1.5 text-xs font-bold shadow-md cursor-pointer transition-all"
                              >
                                Save
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div >
  );
};
