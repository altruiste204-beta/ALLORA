import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Post, PostCategory, Comment } from '../../types';
import { HandHeart } from 'lucide-react';
import { 
  fetchPostsPaginated, 
  createPost, 
  togglePostReaction, 
  fetchComments, 
  createComment,
  deletePost
} from '../../firebase/services/dataService';

export const CommunityView: React.FC = () => {
  const { user, profile, memberships } = useAuth();
  const { t } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [category, setCategory] = useState<PostCategory | undefined>(undefined);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await fetchPostsPaginated(12, null, category);
      setPosts(res.items);
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore || !lastDoc) return;
    setLoadingMore(true);
    try {
      const res = await fetchPostsPaginated(12, lastDoc, category);
      setPosts(prev => [...prev, ...res.items]);
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [category]);

  const handleToggleReaction = async (postId: string, reaction: string) => {
    if (!user) return;
    try {
      await togglePostReaction(postId, user.uid, reaction);
      // Optimistic update or reload
      loadPosts();
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const handleOpenPost = async (post: Post) => {
    setSelectedPost(post);
    setLoadingComments(true);
    try {
      const data = await fetchComments(post.postId);
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPost || !newComment.trim()) return;

    try {
      await createComment({
        postId: selectedPost.postId,
        authorId: user.uid,
        authorName: profile?.displayName || user.displayName || 'Anonyme',
        authorPhotoUrl: profile?.photoUrl || user.photoURL || undefined,
        content: newComment.trim()
      }, selectedPost.authorId);
      
      setNewComment('');
      // Reload comments
      const data = await fetchComments(selectedPost.postId);
      setComments(data);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const categories: { id: PostCategory | undefined; label: string }[] = [
    { id: undefined, label: t.community.all },
    { id: 'announcement', label: t.community.announcements },
    { id: 'community', label: t.community.life },
    { id: 'testimony', label: t.community.testimonies },
    { id: 'information', label: t.community.useful },
    { id: 'opportunity', label: t.community.opportunities },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header & Categories */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#19344A] dark:text-white">{t.community.title}</h1>
          <p className="text-sm text-[#19344A]/60 dark:text-[#FAF9F6]/70">{t.community.subtitle}</p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#19344A] dark:bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-[#111315] dark:hover:bg-blue-700 transition-all cursor-pointer shadow-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>{t.community.publishBtn}</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.label}
            onClick={() => setCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              category === cat.id
                ? 'bg-[#19344A] dark:bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 text-[#19344A]/70 dark:text-[#FAF9F6]/70 hover:border-[#19344A]/30 dark:hover:border-slate-600'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Posts Feed */}
      {loading ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#19344A]/10 dark:border-[#67B7E8]/10 border-t-[#19344A] dark:border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-[#19344A]/60 dark:text-[#FAF9F6]/70">{t.community.loading}</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white dark:bg-[#19344A] rounded-3xl border border-[#E8E4D9] dark:border-[#67B7E8]/10 p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-[#FAF9F6] dark:bg-[#1D334D] rounded-full flex items-center justify-center mx-auto text-[#19344A]/20 dark:text-[#FAF9F6]/70">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-[#19344A] dark:text-white">{t.community.emptyTitle}</h3>
          <p className="text-sm text-[#19344A]/60 dark:text-[#FAF9F6]/70 max-w-xs mx-auto">{t.community.emptySubtitle}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <div 
              key={post.postId}
              className="bg-white dark:bg-[#19344A] rounded-3xl border border-[#E8E4D9] dark:border-[#67B7E8]/10 p-5 sm:p-6 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => handleOpenPost(post)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#19344A] dark:bg-#253C5A text-white flex items-center justify-center font-bold">
                    {post.authorName?.[0] || '?'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#19344A] dark:text-white">{post.authorName}</h4>
                    <p className="text-[10px] text-[#19344A]/50 dark:text-[#FAF9F6]/70">
                      {new Date(post.createdAt).toLocaleDateString()} • {post.churchName || 'Communauté ALLORA'}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-lg bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-[10px] font-bold text-[#19344A]/70 dark:text-[#FAF9F6]/70 uppercase tracking-wider">
                  {categories.find(c => c.id === post.category)?.label}
                </span>
              </div>

              <h3 className="text-lg font-bold text-[#19344A] dark:text-white mb-2 group-hover:text-[#67B7E8] transition-colors">{post.title}</h3>
              <p className="text-sm text-[#19344A]/80 dark:text-[#FAF9F6]/70 line-clamp-3 leading-relaxed mb-4">
                {post.content}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-[#E8E4D9]/40 dark:border-[#67B7E8]/10">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleReaction(post.postId, 'amen');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold ${
                      post.reactions?.['amen']?.includes(user?.uid || '')
                        ? 'bg-[#19344A] border-[#19344A] dark:bg-blue-600 dark:border-blue-600 text-white'
                        : 'bg-[#FAF9F6] dark:bg-[#1D334D] border-[#E8E4D9] dark:border-[#67B7E8]/20 text-[#19344A]/70 dark:text-[#FAF9F6]/70 hover:bg-[#E8E4D9]/40 dark:hover:bg-#253C5A'
                    }`}
                  >
                    <HandHeart className="w-3.5 h-3.5 shrink-0" />
                    <span>{post.reactions?.['amen']?.length || 0}</span>
                  </button>

                  <div className="flex items-center gap-1.5 text-[#19344A]/60 dark:text-[#FAF9F6]/70 text-xs font-bold">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <span>{post.commentCount || 0} {t.community.comments}</span>
                  </div>
                </div>

                <div className="text-[10px] font-bold text-[#67B7E8] uppercase tracking-wider group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  {t.community.viewMore}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Load More */}
      {hasMore && !loading && (
        <div className="flex justify-center pt-2 pb-6">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-6 py-2.5 bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 hover:border-[#19344A] dark:hover:border-[#67B7E8] text-[#19344A] dark:text-[#FAF9F6]/70 text-xs font-bold rounded-2xl transition-all shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {loadingMore ? (
              <span>{t.community.loadingMore}</span>
            ) : (
              <>
                <span>{t.community.loadMore}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}

      {/* Post Details Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#19344A]/40 dark:bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#19344A] rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-[#E8E4D9] dark:border-[#67B7E8]/10">
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#19344A] dark:bg-#253C5A text-white flex items-center justify-center text-lg font-bold">
                    {selectedPost.authorName?.[0] || '?'}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#19344A] dark:text-white">{selectedPost.authorName}</h4>
                    <p className="text-xs text-[#19344A]/50 dark:text-[#FAF9F6]/70">
                      {new Date(selectedPost.createdAt).toLocaleString()} • {selectedPost.churchName || 'Communauté ALLORA'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedPost(null)}
                  className="p-2 rounded-full hover:bg-[#FAF9F6] dark:hover:bg-#1D334D text-[#19344A]/40 dark:text-[#FAF9F6]/70 hover:text-[#19344A] dark:hover:text-white transition-all cursor-pointer"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <span className="inline-block px-3 py-1 rounded-full bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs font-bold text-[#19344A]/70 dark:text-[#FAF9F6]/70 uppercase tracking-wider">
                  {categories.find(c => c.id === selectedPost.category)?.label}
                </span>
                <h2 className="text-2xl font-extrabold text-[#19344A] dark:text-white leading-tight">{selectedPost.title}</h2>
                <p className="text-base text-[#19344A]/80 dark:text-[#FAF9F6]/70 leading-relaxed whitespace-pre-wrap">
                  {selectedPost.content}
                </p>
              </div>

              {/* Comments Section */}
              <div className="pt-8 border-t border-[#E8E4D9]/60 dark:border-[#67B7E8]/10">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#19344A]/60 dark:text-[#FAF9F6]/70 mb-6 flex items-center gap-2">
                  {t.community.comments} ({comments.length})
                </h3>

                <div className="space-y-6">
                  {loadingComments ? (
                    <div className="text-center py-4">
                      <div className="w-6 h-6 border-2 border-[#19344A]/10 dark:border-[#67B7E8]/20 border-t-[#19344A] dark:border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-sm text-[#19344A]/40 dark:text-[#FAF9F6]/70 text-center italic py-4">Aucun commentaire pour le moment.</p>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.commentId} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#E8E4D9] dark:bg-#253C5A flex items-center justify-center text-xs font-bold text-[#19344A] dark:text-white shrink-0">
                          {comment.authorName?.[0]}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#19344A] dark:text-[#FAF9F6]/70">{comment.authorName}</span>
                            <span className="text-[10px] text-[#19344A]/40 dark:text-[#FAF9F6]/70">{new Date(comment.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="bg-[#FAF9F6] dark:bg-[#1D334D]/50 p-3 rounded-2xl border border-[#E8E4D9]/50 dark:border-[#67B7E8]/20 text-sm text-[#19344A]/80 dark:text-[#FAF9F6]/70 leading-relaxed">
                            {comment.content}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Comment Input */}
            <div className="p-6 bg-[#FAF9F6] dark:bg-[#1D334D]/50 border-t border-[#E8E4D9]/60 dark:border-[#67B7E8]/20">
              {user ? (
                <form onSubmit={handleAddComment} className="flex gap-3">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={t.community.commentPlaceholder}
                    className="flex-1 px-4 py-3 bg-white dark:bg-[#19344A] rounded-2xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[#67B7E8]/30 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="px-6 py-3 bg-[#19344A] dark:bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-[#111315] dark:hover:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                  >
                    {t.community.sendComment}
                  </button>
                </form>
              ) : (
                <div className="text-center py-2 text-xs text-[#19344A]/60 dark:text-[#FAF9F6]/70 font-medium">
                  {t.community.loginToComment}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal 
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            loadPosts();
          }}
          memberships={memberships}
        />
      )}
    </div>
  );
};

interface CreatePostModalProps {
  onClose: () => void;
  onCreated: () => void;
  memberships: any[];
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose, onCreated, memberships }) => {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PostCategory>('community');
  const [visibility, setVisibility] = useState<'public' | 'church' | 'private'>('public');
  const [churchId, setChurchId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approvedMemberships = memberships.filter(m => m.status === 'approved');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !content.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const selectedMembership = approvedMemberships.find(m => m.churchId === churchId);
      
      await createPost({
        authorId: user.uid,
        authorName: profile?.displayName || user.displayName || 'Anonyme',
        authorPhotoUrl: profile?.photoUrl || user.photoURL || undefined,
        title: title.trim(),
        content: content.trim(),
        category,
        visibility,
        churchId: churchId || undefined,
        churchName: selectedMembership?.churchName || undefined,
        status: 'published'
      });
      onCreated();
    } catch (err: any) {
      setError(err.message || t.community.submitting);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#19344A]/40 dark:bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#19344A] rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden border border-[#E8E4D9] dark:border-[#67B7E8]/10">
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#19344A] dark:text-white">{t.community.modalTitle}</h2>
            <button 
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#FAF9F6] dark:hover:bg-#1D334D text-[#19344A]/40 dark:text-[#FAF9F6]/70 transition-all cursor-pointer"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="p-3 bg-[#FAF9F6] dark:bg-[#19344A]/20 border border-[#19344A] dark:border-[#19344A] rounded-xl text-xs text-[#19344A] dark:text-[#FAF9F6]/70">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#19344A] dark:text-[#FAF9F6]/70 uppercase tracking-wider mb-1.5 ml-1">{t.community.fieldTitle}</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.community.fieldTitlePlaceholder}
                className="w-full px-4 py-3 bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 rounded-2xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[#19344A]/10 dark:focus:ring-blue-500/20 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#19344A] dark:text-[#FAF9F6]/70 uppercase tracking-wider mb-1.5 ml-1">{t.community.fieldCategory}</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PostCategory)}
                  className="w-full px-4 py-3 bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 rounded-2xl text-sm dark:text-white focus:outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="announcement">{t.community.announcements}</option>
                  <option value="community">{t.community.life}</option>
                  <option value="testimony">{t.community.testimonies}</option>
                  <option value="information">{t.community.useful}</option>
                  <option value="opportunity">{t.community.opportunities}</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#19344A] dark:text-[#FAF9F6]/70 uppercase tracking-wider mb-1.5 ml-1">{t.community.fieldVisibility}</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className="w-full px-4 py-3 bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 rounded-2xl text-sm dark:text-white focus:outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="public">{t.community.visibilityPublic}</option>
                  <option value="church">{t.community.visibilityChurch}</option>
                  <option value="private">{t.community.visibilityPrivate}</option>
                </select>
              </div>
            </div>

            {visibility === 'church' && (
              <div>
                <label className="block text-xs font-bold text-[#19344A] dark:text-[#FAF9F6]/70 uppercase tracking-wider mb-1.5 ml-1">{t.community.fieldChurch}</label>
                <select
                  required
                  value={churchId}
                  onChange={(e) => setChurchId(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 rounded-2xl text-sm dark:text-white focus:outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">{t.community.fieldChurchPlaceholder}</option>
                  {approvedMemberships.map(m => (
                    <option key={m.churchId} value={m.churchId}>{m.churchName}</option>
                  ))}
                </select>
                {approvedMemberships.length === 0 && (
                  <p className="text-[10px] text-[#67B7E8] mt-1.5 ml-1">{t.community.noChurchWarning}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#19344A] dark:text-[#FAF9F6]/70 uppercase tracking-wider mb-1.5 ml-1">{t.community.fieldContent}</label>
              <textarea
                required
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t.community.fieldContentPlaceholder}
                className="w-full px-4 py-3 bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 rounded-2xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[#19344A]/10 dark:focus:ring-blue-500/20 transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-[#FAF9F6] dark:bg-[#1D334D] text-[#19344A] dark:text-[#FAF9F6]/70 rounded-2xl text-sm font-bold hover:bg-[#E8E4D9]/40 dark:hover:bg-#253C5A transition-all cursor-pointer"
            >
              {t.actions.cancel}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-4 bg-[#19344A] dark:bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-[#111315] dark:hover:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
            >
              {loading ? t.community.submitting : t.community.submitBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
