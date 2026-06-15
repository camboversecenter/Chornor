
import React, { useState, useEffect } from 'react';
import { CommunityPost, PostType, ReactionType } from '../types';
import * as storage from '../services/storageService';
import { validateCommunityPost } from '../services/geminiService';
import { Send, TrendingDown, TrendingUp, Loader2, Info, ArrowDownCircle, Gem, Search, ThumbsUp, ThumbsDown, AlertTriangle, ShieldAlert, ArrowUp, User, XCircle, Filter, Edit3, MessageSquare } from 'lucide-react';

const POSTS_PER_PAGE = 5;

const CommunityHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PostType>('REDUCE_EXPENSE');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [newContent, setNewContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    // Reset when tab changes
    setPosts([]);
    setPage(1);
    setHasMore(true);
    setSelectedAuthor(null); // Reset author filter on tab change
    loadPosts(1, true);
  }, [activeTab]);

  const loadPosts = (pageNum: number, reset: boolean = false) => {
    setLoadingMore(true);
    // Simulate network delay for "Large Data" feel
    setTimeout(() => {
        const { posts: newPosts, total } = storage.getCommunityPosts(pageNum, POSTS_PER_PAGE);
        
        setPosts(prev => {
            const combined = reset ? newPosts : [...prev, ...newPosts];
            return Array.from(new Map(combined.map(p => [p._id, p])).values());
        });
        
        if ((pageNum * POSTS_PER_PAGE) >= total) {
            setHasMore(false);
        }
        
        setLoadingMore(false);
    }, 500);
  };

  const handleLoadMore = () => {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPosts(nextPage);
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    
    setIsPosting(true);
    setValidationError('');

    // 1. Validate content via AI
    const result = await validateCommunityPost(newContent, activeTab);

    if (!result.allowed) {
        setValidationError(result.reason);
        setIsPosting(false);
        return;
    }

    // 2. Save if valid
    const newPost: CommunityPost = {
        _id: Date.now().toString(),
        type: activeTab,
        content: newContent,
        author: 'Me',
        createdAt: new Date().toISOString(),
        reactions: {},
        userReaction: null
    };

    storage.addCommunityPost(newPost);
    setNewContent('');
    
    // Refresh list (prepend new post)
    setPosts(prev => [newPost, ...prev]);
    setIsPosting(false);
  };

  const handleReaction = (id: string, type: ReactionType) => {
      storage.reactToCommunityPost(id, type);
      
      // Optimistic UI Update
      setPosts(prev => prev.map(p => {
          if (p._id !== id) return p;

          const updatedReactions = { ...p.reactions };
          // Remove old reaction if exists
          if (p.userReaction) {
              updatedReactions[p.userReaction] = Math.max(0, (updatedReactions[p.userReaction] || 0) - 1);
          }

          // If clicking same type, toggle OFF
          if (p.userReaction === type) {
              return { ...p, reactions: updatedReactions, userReaction: null };
          }
          
          // Toggle ON
          updatedReactions[type] = (updatedReactions[type] || 0) + 1;
          return { ...p, reactions: updatedReactions, userReaction: type };
      }));
  };

  // Filter posts by Tab, Search Query, AND Author
  const filteredPosts = posts.filter(p => {
      const matchesTab = p.type === activeTab;
      const matchesSearch = p.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAuthor = selectedAuthor ? p.author === selectedAuthor : true;
      return matchesTab && matchesSearch && matchesAuthor;
  });

  const getPlaceholder = () => {
      if (activeTab === 'REDUCE_EXPENSE') return 'ចែករំលែកគន្លឹះកាត់បន្ថយចំណាយ (Share tips to reduce expense)...';
      if (activeTab === 'INCREASE_REVENUE') return 'ចែករំលែកឱកាសរកចំណូល (Share revenue opportunities)...';
      return 'ចែករំលែកអំពី Crypto, NFT, Web3 (Share about Digital Assets)...';
  }

  // --- Helper to Render Reaction Buttons ---
  const renderReactions = (post: CommunityPost) => {
      const isDigital = post.type === 'DIGITAL_ASSET';
      
      const Button = ({ type, icon: Icon, label, colorClass, activeColorClass }: any) => {
          const isActive = post.userReaction === type;
          const count = post.reactions?.[type] || 0;
          return (
              <button 
                onClick={() => handleReaction(post._id, type)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border hover:shadow-sm ${isActive ? activeColorClass : 'border-transparent text-gray-500 hover:bg-gray-100'}`}
              >
                  <Icon size={14} className={isActive ? 'fill-current' : ''} />
                  {count > 0 && <span>{count}</span>}
                  <span className="hidden sm:inline">{label}</span>
              </button>
          );
      };

      if (isDigital) {
          return (
              <>
                <Button type="BULLISH" icon={TrendingUp} label="Bullish" colorClass="text-gray-500" activeColorClass="bg-green-50 text-green-600 border-green-200" />
                <Button type="BEARISH" icon={TrendingDown} label="Bearish" colorClass="text-gray-500" activeColorClass="bg-red-50 text-red-600 border-red-200" />
                <Button type="SCAM" icon={ShieldAlert} label="Scam" colorClass="text-gray-500" activeColorClass="bg-purple-50 text-purple-600 border-purple-200" />
                <Button type="FAKE" icon={AlertTriangle} label="Fake" colorClass="text-gray-500" activeColorClass="bg-orange-50 text-orange-600 border-orange-200" />
              </>
          );
      }

      return (
          <>
            <Button type="LIKE" icon={ThumbsUp} label="Like" colorClass="text-gray-500" activeColorClass="bg-blue-50 text-blue-600 border-blue-200" />
            <Button type="DISLIKE" icon={ThumbsDown} label="Dislike" colorClass="text-gray-500" activeColorClass="bg-gray-100 text-gray-700 border-gray-300" />
            <Button type="FAKE" icon={AlertTriangle} label="Fake" colorClass="text-gray-500" activeColorClass="bg-orange-50 text-orange-600 border-orange-200" />
          </>
      );
  };

  const TabButton = ({ type, icon: Icon, label, color, activeColor }: any) => (
      <button 
        onClick={() => setActiveTab(type)}
        className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${
            activeTab === type 
            ? `${activeColor} shadow-sm font-bold border` 
            : 'text-gray-500 hover:bg-gray-100 font-medium'
        }`}
      >
          <div className={`p-2 rounded-lg ${activeTab === type ? 'bg-white/50' : 'bg-gray-100'}`}>
              <Icon size={18} className={activeTab === type ? color : 'text-gray-400'} />
          </div>
          <span>{label}</span>
      </button>
  );

  return (
    <div className="pb-24 md:pb-6 h-full flex flex-col">
        {/* Mobile Sticky Header */}
        <div className="lg:hidden sticky top-0 bg-gray-50 z-10 pb-4 pt-2 shadow-sm -mx-4 px-4">
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-bold text-gray-800">សហគមន៍ (Community Hub)</h2>
            </div>
            
            {/* Search Bar Mobile */}
            <div className="relative mb-3">
                <input 
                    type="text" 
                    placeholder="ស្វែងរកប្រកាស (Search)..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            </div>

            {/* Mobile Tabs */}
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 overflow-x-auto scrollbar-hide">
                <button onClick={() => setActiveTab('REDUCE_EXPENSE')} className={`flex-1 min-w-[100px] py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'REDUCE_EXPENSE' ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-200' : 'text-gray-500 hover:bg-gray-50'}`}><ArrowDownCircle size={14} /> បន្ថយចំណាយ</button>
                <button onClick={() => setActiveTab('INCREASE_REVENUE')} className={`flex-1 min-w-[100px] py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'INCREASE_REVENUE' ? 'bg-green-50 text-green-600 ring-1 ring-green-200' : 'text-gray-500 hover:bg-gray-50'}`}><ArrowUp size={14} /> បង្កើនចំណូល</button>
                <button onClick={() => setActiveTab('DIGITAL_ASSET')} className={`flex-1 min-w-[100px] py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'DIGITAL_ASSET' ? 'bg-purple-50 text-purple-600 ring-1 ring-purple-200' : 'text-gray-500 hover:bg-gray-50'}`}><Gem size={14} /> ទ្រព្យឌីជីថល</button>
            </div>
        </div>

        {/* DESKTOP LAYOUT (3 Columns) */}
        <div className="flex-1 lg:grid lg:grid-cols-12 lg:gap-8 lg:h-[calc(100vh-100px)]">
            
            {/* LEFT SIDEBAR (Navigation) */}
            <div className="hidden lg:block lg:col-span-3 space-y-6 overflow-y-auto pr-2">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3 ml-2">Topics</h3>
                    <div className="space-y-1">
                        <TabButton type="REDUCE_EXPENSE" icon={ArrowDownCircle} label="បន្ថយចំណាយ" color="text-orange-600" activeColor="bg-orange-50 text-orange-800 border-orange-200" />
                        <TabButton type="INCREASE_REVENUE" icon={ArrowUp} label="បង្កើនចំណូល" color="text-green-600" activeColor="bg-green-50 text-green-800 border-green-200" />
                        <TabButton type="DIGITAL_ASSET" icon={Gem} label="ទ្រព្យឌីជីថល" color="text-purple-600" activeColor="bg-purple-50 text-purple-800 border-purple-200" />
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white p-5 rounded-2xl shadow-md relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3 font-bold">
                            <ShieldAlert size={18} className="text-indigo-200" />
                            <h3>AI Moderator Active</h3>
                        </div>
                        <p className="text-xs text-indigo-100 leading-relaxed opacity-90">
                            រាល់ការបង្ហោះ (Post) ត្រូវបានត្រួតពិនិត្យដោយប្រព័ន្ធ AI ដើម្បីធានាថាខ្លឹមសារមានប្រយោជន៍ និងមិនមានការបោកប្រាស់។
                        </p>
                    </div>
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                </div>
            </div>

            {/* CENTER FEED */}
            <div className="lg:col-span-6 space-y-6 overflow-y-auto scrollbar-hide lg:pr-2 lg:h-full lg:pb-10">
                {/* Mobile Create Post (Shown above feed on mobile, hidden on desktop if we want strict separation, but let's keep it consistent or move it) */}
                {/* We'll keep Create Post inline for mobile, but maybe sticky right for desktop? Let's keep it inline for both for simplicity of flow, 
                    OR move creation to the right column on desktop. Let's move creation to Right Col for desktop. */}
                
                <div className="lg:hidden bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 mt-4">
                    <form onSubmit={handlePost}>
                        <textarea
                            value={newContent}
                            onChange={e => setNewContent(e.target.value)}
                            placeholder={getPlaceholder()}
                            className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-24 bg-gray-50 focus:bg-white transition-colors"
                            maxLength={600}
                        />
                        {validationError && (
                            <div className="mt-2 p-2 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 flex items-center gap-2"><Info size={14} /><span>{validationError}</span></div>
                        )}
                        <div className="flex justify-end mt-2">
                            <button type="submit" disabled={isPosting || !newContent.trim()} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition-colors shadow-sm font-medium text-sm">
                                {isPosting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} បង្ហោះ
                            </button>
                        </div>
                    </form>
                </div>

                {/* Feed Header Desktop */}
                <div className="hidden lg:flex justify-between items-end mb-2">
                    <h2 className="text-xl font-bold text-gray-800">
                        {activeTab === 'REDUCE_EXPENSE' && 'Reduce Expense Feed'}
                        {activeTab === 'INCREASE_REVENUE' && 'Increase Revenue Feed'}
                        {activeTab === 'DIGITAL_ASSET' && 'Digital Asset Feed'}
                    </h2>
                    <span className="text-xs text-gray-400">Showing recent posts</span>
                </div>

                {/* Filter Status */}
                {selectedAuthor && (
                    <div className="flex items-center justify-between text-xs bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg border border-indigo-100 animate-in fade-in">
                        <div className="flex items-center gap-2"><User size={14} /><span>Showing posts by <span className="font-bold">{selectedAuthor}</span></span></div>
                        <button onClick={() => setSelectedAuthor(null)} className="text-indigo-400 hover:text-indigo-600"><XCircle size={16} /></button>
                    </div>
                )}

                {/* Posts List */}
                <div className="space-y-4">
                    {filteredPosts.length === 0 && !loadingMore ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                            <MessageSquare size={48} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium">No posts found.</p>
                            <p className="text-xs text-gray-400 mt-1">Be the first to share something!</p>
                        </div>
                    ) : (
                        filteredPosts.map(post => (
                            <div key={post._id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md group">
                                <div className="flex justify-between items-start mb-3">
                                    <div 
                                        onClick={() => setSelectedAuthor(post.author)}
                                        className="flex items-center gap-3 cursor-pointer"
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-transform group-hover:scale-105 ${post.author === 'Me' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {post.author.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm leading-none hover:text-indigo-600 transition-colors">{post.author}</p>
                                            <p className="text-[10px] text-gray-400 mt-1">{new Date(post.createdAt).toLocaleDateString()} • {new Date(post.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                        </div>
                                    </div>
                                    {/* More menu could go here */}
                                </div>
                                <p className="text-gray-700 text-sm mb-4 leading-relaxed whitespace-pre-wrap pl-1">{post.content}</p>
                                
                                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-50">
                                    {renderReactions(post)}
                                </div>
                            </div>
                        ))
                    )}
                    
                    {/* Load More Trigger */}
                    {hasMore && !searchQuery && !selectedAuthor && (
                        <div className="flex justify-center py-6">
                            <button 
                                onClick={handleLoadMore} 
                                disabled={loadingMore}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 disabled:opacity-50 transition-all hover:shadow-md"
                            >
                                {loadingMore ? <Loader2 size={16} className="animate-spin" /> : <ArrowDownCircle size={16} />}
                                មើលបន្ថែម (Load More)
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT SIDEBAR (Widgets) */}
            <div className="hidden lg:block lg:col-span-3 space-y-6">
                
                {/* Desktop Search */}
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Search posts..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    />
                    <Search className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
                </div>

                {/* Create Post Widget */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4 text-gray-800 font-bold">
                        <Edit3 size={18} className="text-indigo-600" />
                        <h3>Create Post</h3>
                    </div>
                    <form onSubmit={handlePost}>
                        <textarea
                            value={newContent}
                            onChange={e => setNewContent(e.target.value)}
                            placeholder={getPlaceholder()}
                            className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-32 bg-gray-50 focus:bg-white transition-colors mb-2"
                            maxLength={600}
                        />
                        {validationError && (
                            <div className="mb-3 p-2 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 flex items-start gap-2">
                                <Info size={14} className="shrink-0 mt-0.5" />
                                <span>{validationError}</span>
                            </div>
                        )}
                        <button 
                            type="submit" 
                            disabled={isPosting || !newContent.trim()} 
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-gray-300 transition-all shadow-md font-bold text-sm"
                        >
                            {isPosting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} 
                            Post Now
                        </button>
                    </form>
                </div>

                {/* Trending Tags or Info could go here */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-700 text-sm mb-3">Trending Topics</h3>
                    <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium cursor-pointer hover:bg-gray-200">#Savings</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium cursor-pointer hover:bg-gray-200">#Bitcoin</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium cursor-pointer hover:bg-gray-200">#SideHustle</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium cursor-pointer hover:bg-gray-200">#Budgeting</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default CommunityHub;
