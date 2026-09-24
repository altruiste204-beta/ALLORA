import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Post, PostCategory, Comment } from '../../types';
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
    { id: undefined, label: 'Tout' },
    { id: 'announcement', label: 'Annonces' },
    { id: 'community', label: 'Communauté' },
    { id: 'testimony', label: 'Témoignages' },
    { id: 'information', label: 'Infos utiles' },
    { id: 'opportunity', label: 'Opportunités' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header & Categories */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#19344A]">Communauté</h1>
          <p className="text-sm text-[#19344A]/60">Échangez et partagez avec la communauté ALLORA.</p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#19344A] text-white rounded-xl text-sm font-bold hover:bg-[#111315] transition-all cursor-pointer shadow-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Publier</span>
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
                ? 'bg-[#19344A] text-white shadow-sm'
                : 'bg-white border border-[#E8E4D9] text-[#19344A]/70 hover:border-[#19344A]/30'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Posts Feed */}
      {loading ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#19344A]/10 border-t-[#19344A] rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-[#19344A]/60">Chargement du fil d'actualité...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E8E4D9] p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-[#FAF9F6] rounded-full flex items-center justify-center mx-auto text-[#19344A]/20">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-[#19344A]">Aucune publication</h3>
          <p className="text-sm text-[#19344A]/60 max-w-xs mx-auto">Soyez le premier à partager une information ou un témoignage avec la communauté.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <div 
              key={post.postId}
              className="bg-white rounded-3xl border border-[#E8E4D9] p-5 sm:p-6 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => handleOpenPost(post)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#19344A] text-white flex items-center justify-center font-bold">
                    {post.authorName?.[0] || '?'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#19344A]">{post.authorName}</h4>
                    <p className="text-[10px] text-[#19344A]/50">
                      {new Date(post.createdAt).toLocaleDateString()} • {post.churchName || 'Communauté ALLORA'}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-lg bg-[#FAF9F6] border border-[#E8E4D9] text-[10px] font-bold text-[#19344A]/70 uppercase tracking-wider">
                  {categories.find(c => c.id === post.category)?.label}
                </span>
              </div>

              <h3 className="text-lg font-bold text-[#19344A] mb-2 group-hover:text-[#67B7E8] transition-colors">{post.title}</h3>
              <p className="text-sm text-[#19344A]/80 line-clamp-3 leading-relaxed mb-4">
                {post.content}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-[#E8E4D9]/40">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleReaction(post.postId, '🙏');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold ${
                      post.reactions?.['🙏']?.includes(user?.uid || '')
                        ? 'bg-[#19344A] border-[#19344A] text-white'
                        : 'bg-[#FAF9F6] border-[#E8E4D9] text-[#19344A]/70 hover:bg-[#E8E4D9]/40'
                    }`}
                  >
                    <span>🙏</span>
                    <span>{post.reactions?.['🙏']?.length || 0}</span>
                  </button>

                  <div className="flex items-center gap-1.5 text-[#19344A]/60 text-xs font-bold">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <span>{post.commentCount || 0} commentaires</span>
                  </div>
                </div>

                <div className="text-[10px] font-bold text-[#67B7E8] uppercase tracking-wider group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Voir plus
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
            className="px-6 py-2.5 bg-[#FAF9F6] border border-[#E8E4D9] hover:border-[#19344A] text-[#19344A] text-xs font-bold rounded-2xl transition-all shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {loadingMore ? (
              <span>Chargement...</span>
            ) : (
              <>
                <span>Afficher plus de publications</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#19344A]/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#19344A] text-white flex items-center justify-center text-lg font-bold">
                    {selectedPost.authorName?.[0] || '?'}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#19344A]">{selectedPost.authorName}</h4>
                    <p className="text-xs text-[#19344A]/50">
                      {new Date(selectedPost.createdAt).toLocaleString()} • {selectedPost.churchName || 'Communauté ALLORA'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedPost(null)}
                  className="p-2 rounded-full hover:bg-[#FAF9F6] text-[#19344A]/40 hover:text-[#19344A] transition-all cursor-pointer"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <span className="inline-block px-3 py-1 rounded-full bg-[#FAF9F6] border border-[#E8E4D9] text-xs font-bold text-[#19344A]/70 uppercase tracking-wider">
                  {categories.find(c => c.id === selectedPost.category)?.label}
                </span>
                <h2 className="text-2xl font-extrabold text-[#19344A] leading-tight">{selectedPost.title}</h2>
                <p className="text-base text-[#19344A]/80 leading-relaxed whitespace-pre-wrap">
                  {selectedPost.content}
                </p>
              </div>

              {/* Comments Section */}
              <div className="pt-8 border-t border-[#E8E4D9]/60">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#19344A]/60 mb-6 flex items-center gap-2">
                  Commentaires ({comments.length})
                </h3>

                <div className="space-y-6">
                  {loadingComments ? (
                    <div className="text-center py-4">
                      <div className="w-6 h-6 border-2 border-[#19344A]/10 border-t-[#19344A] rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-sm text-[#19344A]/40 text-center italic py-4">Aucun commentaire pour le moment.</p>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.commentId} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#E8E4D9] flex items-center justify-center text-xs font-bold text-[#19344A] shrink-0">
                          {comment.authorName?.[0]}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#19344A]">{comment.authorName}</span>
                            <span className="text-[10px] text-[#19344A]/40">{new Date(comment.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="bg-[#FAF9F6] p-3 rounded-2xl border border-[#E8E4D9]/50 text-sm text-[#19344A]/80 leading-relaxed">
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
            <div className="p-6 bg-[#FAF9F6] border-t border-[#E8E4D9]/60">
              {user ? (
                <form onSubmit={handleAddComment} className="flex gap-3">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Ajouter un commentaire..."
                    className="flex-1 px-4 py-3 bg-white rounded-2xl border border-[#E8E4D9] text-sm focus:outline-none focus:ring-2 focus:ring-[#67B7E8]/30 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="px-6 py-3 bg-[#19344A] text-white rounded-2xl text-sm font-bold hover:bg-[#111315] disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                  >
                    Envoyer
                  </button>
                </form>
              ) : (
                <div className="text-center py-2 text-xs text-[#19344A]/60 font-medium">
                  Connectez-vous pour commenter cette publication.
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
      setError(err.message || 'Erreur lors de la création de la publication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#19344A]/40 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#19344A]">Publier un message</h2>
            <button 
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#FAF9F6] text-[#19344A]/40 transition-all cursor-pointer"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#19344A] uppercase tracking-wider mb-1.5 ml-1">Titre de la publication</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Donnez un titre clair..."
                className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E8E4D9] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#19344A]/10 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#19344A] uppercase tracking-wider mb-1.5 ml-1">Catégorie</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PostCategory)}
                  className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E8E4D9] rounded-2xl text-sm focus:outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="announcement">Annonce</option>
                  <option value="community">Vie de l'église</option>
                  <option value="testimony">Témoignage</option>
                  <option value="information">Information</option>
                  <option value="opportunity">Opportunité</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#19344A] uppercase tracking-wider mb-1.5 ml-1">Visibilité</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E8E4D9] rounded-2xl text-sm focus:outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="public">Public</option>
                  <option value="church">Membres église</option>
                  <option value="private">Privé (Moi seul)</option>
                </select>
              </div>
            </div>

            {visibility === 'church' && (
              <div>
                <label className="block text-xs font-bold text-[#19344A] uppercase tracking-wider mb-1.5 ml-1">Églises concernées</label>
                <select
                  required
                  value={churchId}
                  onChange={(e) => setChurchId(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E8E4D9] rounded-2xl text-sm focus:outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Sélectionner une église...</option>
                  {approvedMemberships.map(m => (
                    <option key={m.churchId} value={m.churchId}>{m.churchName}</option>
                  ))}
                </select>
                {approvedMemberships.length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1.5 ml-1">Vous n'êtes membre d'aucune église pour publier dans cette visibilité.</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#19344A] uppercase tracking-wider mb-1.5 ml-1">Contenu</label>
              <textarea
                required
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Racontez ou partagez quelque chose..."
                className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E8E4D9] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#19344A]/10 transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-[#FAF9F6] text-[#19344A] rounded-2xl text-sm font-bold hover:bg-[#E8E4D9]/40 transition-all cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-4 bg-[#19344A] text-white rounded-2xl text-sm font-bold hover:bg-[#111315] disabled:opacity-50 transition-all cursor-pointer shadow-sm"
            >
              {loading ? 'Publication en cours...' : 'Publier maintenant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
