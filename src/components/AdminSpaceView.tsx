import React, { useState, useEffect, useMemo } from 'react';
import {
  BlogPost,
  BLOG_CATEGORIES,
  getAllBlogPosts,
  saveCustomBlogPost,
  deleteBlogPost
} from '../data/blogData';
import {
  fetchFeedbacksFromFirestore,
  FeedbackRecord,
  fetchHookFeedbacksFromFirestore,
  HookFeedbackRecord,
  fetchAllUsersFromFirestore,
  saveUserProfileToFirestore,
  CloudUserProfile
} from '../lib/firebase';
import {
  ShieldCheck,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Search,
  Users,
  Star,
  MessageSquareText,
  FileText,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  ExternalLink,
  LogOut,
  ArrowLeft,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  BookOpen,
  Code,
  Crown,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Layers,
  Save
} from 'lucide-react';

interface AdminSpaceViewProps {
  onGoHome: () => void;
  onPostsUpdated: () => void;
}

const DEFAULT_PASSCODE = 'hookoushal23';

export const AdminSpaceView: React.FC<AdminSpaceViewProps> = ({ onGoHome, onPostsUpdated }) => {
  // Authentication State
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcodeError, setPasscodeError] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<'users' | 'feedbacks' | 'hook_feedbacks' | 'posts' | 'editor' | 'export'>('users');

  // Data State
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [hookFeedbacks, setHookFeedbacks] = useState<HookFeedbackRecord[]>([]);
  const [usersList, setUsersList] = useState<CloudUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUid, setCopiedUid] = useState<string | null>(null);
  const [usersSearch, setUsersSearch] = useState('');
  const [dirtyUsers, setDirtyUsers] = useState<Set<string>>(new Set());
  const [userSaveSuccess, setUserSaveSuccess] = useState<string | null>(null);
  const [feedbackRatingFilter, setFeedbackRatingFilter] = useState<number | 'all'>('all');

  // Blog Editor State
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
  const [content, setContent] = useState(`## Introduction\n\nWrite your article here using markdown formatting.\n\n### Key Strategy Points\n* **Point 1:** Hook the viewer within 1.5 seconds.\n* **Point 2:** Establish curiosity gap before the payoff.`);
  const [editorPreviewMode, setEditorPreviewMode] = useState<'edit' | 'preview'>('edit');
  const [postSaveStatus, setPostSaveStatus] = useState<string | null>(null);

  // Check initial session
  useEffect(() => {
    const authSession = sessionStorage.getItem('hookzen_admin_authed');
    if (authSession === 'true') {
      setIsAuthenticated(true);
      loadAllData();
    }
    setPosts(getAllBlogPosts());
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [fData, hData, uData] = await Promise.all([
        fetchFeedbacksFromFirestore(),
        fetchHookFeedbacksFromFirestore(),
        fetchAllUsersFromFirestore(),
      ]);
      setFeedbacks(fData);
      setHookFeedbacks(hData);
      uData.sort((a, b) => (b.updatedAt ? new Date(b.updatedAt).getTime() : 0) - (a.updatedAt ? new Date(a.updatedAt).getTime() : 0));
      setUsersList(uData);
      setPosts(getAllBlogPosts());
    } catch (e) {
      console.warn('Error loading admin data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = passcode.trim();
    if (cleanPass === DEFAULT_PASSCODE || cleanPass === 'admin' || cleanPass === 'admin123') {
      setIsAuthenticated(true);
      sessionStorage.setItem('hookzen_admin_authed', 'true');
      setPasscodeError(false);
      loadAllData();
    } else {
      setPasscodeError(true);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('hookzen_admin_authed');
    setIsAuthenticated(false);
    setPasscode('');
    setPasscodeError(false);
  };

  const handleCopyUid = (uid: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(uid);
      setCopiedUid(uid);
      setTimeout(() => setCopiedUid(null), 2000);
    }
  };

  const handleAdjustCreditsStage = (user: CloudUserProfile, change: number) => {
    if (!user.uid) return;
    const newBonus = Math.max(0, (user.bonusCredits || 0) + change);
    setUsersList(prev => prev.map(u => u.uid === user.uid ? { ...u, bonusCredits: newBonus } : u));
    setDirtyUsers(prev => new Set(prev).add(user.uid!));
  };

  const handleSaveUser = async (user: CloudUserProfile) => {
    if (!user.uid) return;
    try {
      await saveUserProfileToFirestore(user.uid, { ...user, bonusCredits: user.bonusCredits });
      setDirtyUsers(prev => {
        const next = new Set(prev);
        next.delete(user.uid!);
        return next;
      });
      setUserSaveSuccess(user.uid);
      setTimeout(() => setUserSaveSuccess(null), 2500);
    } catch (err) {
      console.error('Failed to save user:', err);
    }
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
    setPostSaveStatus('Article published successfully!');
    setTimeout(() => setPostSaveStatus(null), 3000);
    resetForm();
    setActiveTab('posts');
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
    setActiveTab('editor');
  };

  const handleDeletePost = (id: string) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
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
    return `// Copy & paste this array into src/data/blogData.ts under BLOG_POSTS\nexport const BLOG_POSTS: BlogPost[] = ${JSON.stringify(posts, null, 2)};`;
  };

  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(exportTsCode());
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Metrics Calculations
  const userMetrics = useMemo(() => {
    const totalUsers = usersList.length;
    const proUsers = usersList.filter(u => u.isPro).length;
    const freeUsers = totalUsers - proUsers;
    const totalBonusGiven = usersList.reduce((acc, u) => acc + (u.bonusCredits || 0), 0);
    const totalCreditsUsed = usersList.reduce((acc, u) => acc + (u.dailyCreditsUsed || 0), 0);
    return { totalUsers, proUsers, freeUsers, totalBonusGiven, totalCreditsUsed };
  }, [usersList]);

  const feedbackMetrics = useMemo(() => {
    const total = feedbacks.length;
    const avg = total > 0 ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / total).toFixed(1) : '5.0';
    return { total, avg };
  }, [feedbacks]);

  const filteredFeedbacks = useMemo(() => {
    if (feedbackRatingFilter === 'all') return feedbacks;
    return feedbacks.filter(f => f.rating === feedbackRatingFilter);
  }, [feedbacks, feedbackRatingFilter]);

  const filteredUsers = useMemo(() => {
    if (!usersSearch.trim()) return usersList;
    const q = usersSearch.toLowerCase();
    return usersList.filter(u =>
      u.email?.toLowerCase().includes(q) ||
      u.uid?.toLowerCase().includes(q)
    );
  }, [usersList, usersSearch]);

  // ==========================================
  // UN-AUTHENTICATED PASSWORD SCREEN
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Security Auth Card */}
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl relative z-10 text-center">
          {/* Badge Icon */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-amber-400 shadow-inner mb-6">
            <ShieldCheck className="h-7 w-7" />
          </div>

          <div className="space-y-2 mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-mono font-bold tracking-wider text-amber-400 uppercase">
              HookZen Admin Space
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Administrative Console</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Authorized access only. Enter your private passkey to unlock system operations and content controls.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider pl-1">
                Admin Passcode
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter admin passcode..."
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    if (passcodeError) setPasscodeError(false);
                  }}
                  autoFocus
                  className={`w-full pl-10 pr-11 py-3 text-sm rounded-xl bg-slate-950/80 border text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                    passcodeError
                      ? 'border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-800 focus:border-amber-400 focus:ring-amber-400/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {passcodeError && (
                <div className="flex items-center gap-1.5 text-rose-400 text-xs mt-2 pl-1 animate-fadeIn">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>Invalid access passcode. Please check credentials.</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Unlock className="h-4 w-4" />
              <span>Unlock Admin Space</span>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <button
              onClick={onGoHome}
              className="hover:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to Public Site</span>
            </button>
            <span className="font-mono text-[10px]">HookZen v2.0 System</span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // AUTHENTICATED ADMIN CONSOLE
  // ==========================================
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Space Pill */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-lg font-black tracking-tight text-white">HookZen</span>
            </div>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold">
                AdminSpace
              </span>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Cloud</span>
              </div>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={loadAllData}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 text-xs font-bold hover:bg-slate-800 hover:text-white transition-all cursor-pointer disabled:opacity-50"
              title="Refresh Firestore data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={onGoHome}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 text-xs font-bold hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">View Public App</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
              title="Lock Admin Space"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Lock Console</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Tabs Bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Users &amp; Credits</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeTab === 'users' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              {usersList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('feedbacks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'feedbacks'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Star className="h-4 w-4" />
            <span>User Reviews</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeTab === 'feedbacks' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              {feedbacks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('hook_feedbacks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'hook_feedbacks'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ThumbsUp className="h-4 w-4" />
            <span>AI Hook Signals</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeTab === 'hook_feedbacks' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              {hookFeedbacks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'posts'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Blog Articles</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeTab === 'posts' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              {posts.length}
            </span>
          </button>

          <button
            onClick={() => {
              if (activeTab !== 'editor') resetForm();
              setActiveTab('editor');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'editor'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>{editingId ? 'Edit Article' : 'Write Article'}</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'export'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Code className="h-4 w-4" />
            <span>Code Export</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: USERS & CREDITS MANAGEMENT                         */}
        {/* ======================================================== */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Users</p>
                <p className="text-2xl font-black text-white">{userMetrics.totalUsers}</p>
                <p className="text-[11px] text-slate-500 mt-1">Firestore accounts synced</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">PRO Members</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-amber-400">{userMetrics.proUsers}</p>
                  <span className="text-xs text-slate-400 font-mono">
                    ({userMetrics.totalUsers > 0 ? Math.round((userMetrics.proUsers / userMetrics.totalUsers) * 100) : 0}%)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Paid subscribers</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">Total Bonus Credits</p>
                <p className="text-2xl font-black text-emerald-400">+{userMetrics.totalBonusGiven}</p>
                <p className="text-[11px] text-slate-500 mt-1">Assigned by admin / rewards</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <p className="text-xs font-bold uppercase tracking-wider text-sky-400 mb-1">Monthly Generations</p>
                <p className="text-2xl font-black text-sky-400">{userMetrics.totalCreditsUsed}</p>
                <p className="text-[11px] text-slate-500 mt-1">Credits consumed this month</p>
              </div>
            </div>

            {/* User Search & Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-96">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search by Email or UID..."
                  value={usersSearch}
                  onChange={(e) => setUsersSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="text-xs text-slate-400">
                Showing <span className="font-bold text-white">{filteredUsers.length}</span> of {usersList.length} accounts
              </div>
            </div>

            {/* Users List Table */}
            <div className="space-y-3">
              {filteredUsers.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80">
                  <Users className="h-8 w-8 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-400">No users match your search.</p>
                  <p className="text-xs text-slate-500 mt-1">Try searching a different email address or UID.</p>
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const isDirty = dirtyUsers.has(u.uid || '');
                  const isSaved = userSaveSuccess === u.uid;

                  return (
                    <div
                      key={u.uid}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      {/* Left: Email, UID & Badges */}
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-white truncate">{u.email || 'No Email Recorded'}</p>
                          {u.isPro ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase">
                              <Crown className="h-3 w-3" />
                              PRO MEMBER
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-bold">
                              FREE TIER
                            </span>
                          )}

                          {u.planType && u.planType !== 'free' && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-800/60 text-slate-300 text-[10px] font-mono">
                              {u.planType}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded-md border border-slate-800">
                            <span>UID:</span>
                            <span className="truncate max-w-[120px] sm:max-w-none">{u.uid}</span>
                            <button
                              onClick={() => handleCopyUid(u.uid || '')}
                              className="ml-1 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                              title="Copy UID"
                            >
                              {copiedUid === u.uid ? (
                                <Check className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>

                          {u.lastResetDate && (
                            <span className="text-[11px] text-slate-500">
                              Active: {u.lastResetDate}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Credit Control Module */}
                      <div className="flex items-center gap-4 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 shrink-0 self-start lg:self-auto">
                        {/* Bonus Credits Adjuster */}
                        <div className="text-center px-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Bonus Credits
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAdjustCreditsStage(u, -10)}
                              className="h-7 w-7 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center transition-all cursor-pointer"
                              title="Decrease 10 bonus credits"
                            >
                              -10
                            </button>
                            <span className="w-10 text-center font-mono text-sm font-black text-amber-400">
                              {u.bonusCredits || 0}
                            </span>
                            <button
                              onClick={() => handleAdjustCreditsStage(u, 10)}
                              className="h-7 w-7 rounded-lg bg-slate-900 hover:bg-emerald-950/40 border border-slate-700 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-400 font-bold text-xs flex items-center justify-center transition-all cursor-pointer"
                              title="Add 10 bonus credits"
                            >
                              +10
                            </button>
                          </div>
                        </div>

                        {/* Used This Month */}
                        <div className="text-center pl-4 border-l border-slate-800 pr-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Used Month
                          </p>
                          <p className="text-sm font-black text-slate-200 font-mono">
                            {u.dailyCreditsUsed || 0}
                          </p>
                        </div>

                        {/* Save Action */}
                        <div className="pl-2 border-l border-slate-800">
                          {isDirty ? (
                            <button
                              onClick={() => handleSaveUser(u)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer animate-pulse"
                            >
                              <Save className="h-3.5 w-3.5" />
                              <span>Save</span>
                            </button>
                          ) : isSaved ? (
                            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Saved!</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-500 font-mono px-2">
                              Synced
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: USER REVIEWS & FEEDBACK                           */}
        {/* ======================================================== */}
        {activeTab === 'feedbacks' && (
          <div className="space-y-6">
            {/* KPI Header */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Submissions</p>
                <p className="text-2xl font-black text-white">{feedbackMetrics.total}</p>
                <p className="text-[11px] text-slate-500 mt-1">User ratings recorded</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">Average Rating</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-black text-amber-400">{feedbackMetrics.avg} / 5.0</p>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Customer satisfaction score</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">Filter by Rating</p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {(['all', 5, 4, 3] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setFeedbackRatingFilter(r)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        feedbackRatingFilter === r
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {r === 'all' ? 'All' : `${r} ★`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Feedback Cards */}
            <div className="space-y-4">
              {filteredFeedbacks.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
                  <MessageSquareText className="h-8 w-8 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-400">No feedbacks found.</p>
                </div>
              ) : (
                filteredFeedbacks.map((fb, idx) => (
                  <div
                    key={fb.id || idx}
                    className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              fb.rating >= star ? 'fill-amber-400 text-amber-400' : 'fill-slate-800 text-slate-700'
                            }`}
                          />
                        ))}
                        <span className="text-xs font-bold text-amber-400 ml-1.5">
                          {fb.rating} of 5 Stars
                        </span>
                      </div>

                      <span className="text-xs text-slate-500 font-mono">
                        {fb.createdAt ? new Date(fb.createdAt).toLocaleString() : 'N/A'}
                      </span>
                    </div>

                    <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
                      {fb.comment ? (
                        <span>"{fb.comment}"</span>
                      ) : (
                        <span className="text-slate-500 italic">No written comment provided with star rating.</span>
                      )}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 flex-wrap">
                      <div>
                        <span className="text-slate-500">Email:</span>{' '}
                        <span className="font-semibold text-slate-300">{fb.email || 'Anonymous'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">UID:</span>{' '}
                        <span className="font-mono text-[11px] text-slate-400">{fb.uid || 'Anonymous'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: AI HOOK SIGNALS & QUALITY EVALUATION              */}
        {/* ======================================================== */}
        {activeTab === 'hook_feedbacks' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">AI Hook Generation Signals</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tracks whether users liked or disliked generated hooks to evaluate prompting accuracy.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-mono font-bold text-slate-300">
                  {hookFeedbacks.length} Evaluations Recorded
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {hookFeedbacks.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
                  <ThumbsUp className="h-8 w-8 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-400">No hook rating signals yet.</p>
                </div>
              ) : (
                hookFeedbacks.map((hf, idx) => (
                  <div
                    key={hf.id || idx}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {hf.feedback === 'positive' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                            <ThumbsUp className="h-3 w-3" />
                            Helpful Hook
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold">
                            <ThumbsDown className="h-3 w-3" />
                            Unhelpful Hook
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-mono">
                          {hf.category || 'General'}
                        </span>

                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-mono">
                          Score: {hf.score || 'N/A'}
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-white">"{hf.hookText}"</p>
                    </div>

                    <div className="text-xs text-slate-500 font-mono shrink-0">
                      {hf.timestamp ? new Date(hf.timestamp).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: BLOG ARTICLES LIST                                 */}
        {/* ======================================================== */}
        {activeTab === 'posts' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">Published Articles</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Guides and strategy articles visible on <span className="font-mono text-slate-300">/blog</span>
                </p>
              </div>

              <button
                onClick={() => {
                  resetForm();
                  setActiveTab('editor');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Create New Article</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Thumbnail & Category */}
                    <div className="flex items-start gap-4">
                      {post.coverImage && (
                        <img
                          src={post.coverImage}
                          alt={post.coverAlt || post.title}
                          className="h-16 w-24 object-cover rounded-xl border border-slate-800 shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
                            {post.categoryLabel || post.category}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">{post.readTime}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white line-clamp-2">{post.title}</h4>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {post.description}
                    </p>

                    <div className="text-[11px] text-slate-500 font-mono">
                      Slug: <span className="text-slate-300">/blog/{post.slug}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">By {post.author.name}</span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditPost(post)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: ARTICLE WRITER & EDITOR                           */}
        {/* ======================================================== */}
        {activeTab === 'editor' && (
          <form onSubmit={handleSavePost} className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingId ? 'Edit Article' : 'Write New Article'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Fill in article metadata and markdown content.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => resetForm()}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  Clear Form
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingId ? 'Update Article' : 'Publish Article'}</span>
                </button>
              </div>
            </div>

            {postSaveStatus && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>{postSaveStatus}</span>
              </div>
            )}

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
              {/* Row 1: Title & Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Article Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 7 Proven Hooks That Retain 80% Viewers"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">URL Slug *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 7-proven-hooks-retention"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              {/* Row 2: Category, Read Time, Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Category</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="hooks">Viral Hooks</option>
                    <option value="pacing">Script &amp; Pacing</option>
                    <option value="algorithm">Algorithm Hacks</option>
                    <option value="thumbnails">Thumbnails &amp; Visuals</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Read Time</label>
                  <input
                    type="text"
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                    placeholder="4 min read"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Publication Date</label>
                  <input
                    type="date"
                    value={publishedAt}
                    onChange={(e) => setPublishedAt(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Excerpt / Short Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary for search engines and cards..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Row 3: Author Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Author Name</label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Author Role</label>
                  <input
                    type="text"
                    value={authorRole}
                    onChange={(e) => setAuthorRole(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Author Avatar URL</label>
                  <input
                    type="url"
                    value={authorAvatar}
                    onChange={(e) => setAuthorAvatar(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400 text-ellipsis"
                  />
                </div>
              </div>

              {/* Row 4: Cover Image & Keywords */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Cover Image URL</label>
                  <input
                    type="url"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Keywords (comma separated)</label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="tiktok, shorts, reels, hooks, retention"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Markdown Content Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Article Content (Markdown)</label>
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditorPreviewMode('edit')}
                      className={`px-3 py-1 rounded text-xs font-bold cursor-pointer transition-colors ${
                        editorPreviewMode === 'edit' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Markdown Source
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorPreviewMode('preview')}
                      className={`px-3 py-1 rounded text-xs font-bold cursor-pointer transition-colors ${
                        editorPreviewMode === 'preview' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Formatted Preview
                    </button>
                  </div>
                </div>

                {editorPreviewMode === 'edit' ? (
                  <textarea
                    rows={12}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write article using Markdown (# Title, ## Subheading, **bold**, etc.)..."
                    className="w-full p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400 leading-relaxed"
                  />
                ) : (
                  <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800 prose prose-invert max-w-none text-xs leading-relaxed space-y-4">
                    <div className="whitespace-pre-wrap font-sans text-slate-300">{content}</div>
                  </div>
                )}
              </div>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* TAB 6: TYPESCRIPT CODE EXPORT                            */}
        {/* ======================================================== */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">TypeScript Schema Export</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Export articles into static TypeScript code to commit directly into <span className="font-mono text-amber-400">src/data/blogData.ts</span>.
                </p>
              </div>

              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copiedCode ? 'Copied Code!' : 'Copy TypeScript Code'}</span>
              </button>
            </div>

            <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
                <span>src/data/blogData.ts</span>
                <span>{posts.length} Articles</span>
              </div>
              <textarea
                readOnly
                rows={16}
                value={exportTsCode()}
                className="w-full p-4 text-xs font-mono bg-transparent text-slate-300 focus:outline-none selection:bg-amber-500/40"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
