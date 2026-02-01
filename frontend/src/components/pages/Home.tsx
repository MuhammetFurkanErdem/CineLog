import { Link } from "react-router";
import { Heart, MessageCircle, Star, Users, User as UserIcon, Globe, Send, X, Pencil, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { useEffect, useState, useCallback } from "react";
import { userService, socialService } from "../../utils/api";

interface User {
  id: number;
  username: string;
  email: string;
  bio?: string;
  picture?: string;
}

interface Film {
  id: number;
  tmdb_id: number;
  title: string;
  poster_path?: string;
  release_date?: string;
  kisisel_puan?: number;
  kisisel_yorum?: string;
  izlenme_tarihi: string;
  is_favorite: boolean;
  is_watchlist: boolean;
}

interface FeedItem {
  user: User;
  film: Film;
}

interface UserStats {
  total_movies: number;
  total_series: number;
  total_reviews: number;
  total_followers: number;
  badges?: Array<{
    name: string;
    rarity: "legendary" | "rare" | "common";
  }>;
}

interface ActivityInteraction {
  like_count: number;
  comment_count: number;
  is_liked_by_me: boolean;
  comments: Array<{
    id: number;
    user_id: number;
    film_id: number;
    content: string;
    created_at: string;
    user: User;
  }>;
}

export function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats>({
    total_movies: 0,
    total_series: 0,
    total_reviews: 0,
    total_followers: 0,
    badges: [],
  });
  const [weeklyMovies, setWeeklyMovies] = useState(0);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedSource, setFeedSource] = useState<"all" | "friends" | "me">("all");
  const [feedLoading, setFeedLoading] = useState(false);
  
  // Activity interactions state
  const [interactions, setInteractions] = useState<Record<number, ActivityInteraction>>({});
  const [likeLoading, setLikeLoading] = useState<number | null>(null);
  const [commentInput, setCommentInput] = useState<Record<number, string>>({});
  const [showComments, setShowComments] = useState<number | null>(null);
  const [commentLoading, setCommentLoading] = useState<number | null>(null);
  
  // Edit comment state
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState<string>("");

  const getBadgeStyle = (rarity: "legendary" | "rare" | "common") => {
    switch (rarity) {
      case "legendary":
        return "bg-gradient-to-br from-yellow-500/30 to-amber-600/30 border-yellow-500/50 text-yellow-300 shadow-yellow-500/20 shadow-lg";
      case "rare":
        return "bg-gradient-to-br from-purple-500/25 to-pink-500/25 border-purple-400/40 text-purple-200 shadow-purple-500/15 shadow-md";
      case "common":
        return "bg-gradient-to-br from-slate-600/25 to-slate-700/25 border-slate-500/40 text-slate-300 shadow-slate-500/10 shadow-sm";
    }
  };

  // Fetch feed based on source
  const fetchFeed = useCallback(async (source: "all" | "friends" | "me") => {
    console.log('📡 Fetching feed with source:', source);
    try {
      setFeedLoading(true);
      const feedResponse = await socialService.getFeed(20, source);
      console.log('📦 Feed response:', { source, itemCount: feedResponse.length });
      setFeed(feedResponse);
      
      // Fetch interactions for each feed item
      const interactionsMap: Record<number, ActivityInteraction> = {};
      for (const item of feedResponse) {
        try {
          const interaction = await socialService.getActivityInteractions(item.film.id);
          interactionsMap[item.film.id] = interaction;
        } catch (err) {
          // Ignore errors for individual interactions
        }
      }
      setInteractions(interactionsMap);
    } catch (error) {
      console.error("Feed yüklenirken hata:", error);
    } finally {
      setFeedLoading(false);
    }
  }, []);

  // Handle like/unlike
  const handleLike = async (filmId: number) => {
    try {
      setLikeLoading(filmId);
      const currentInteraction = interactions[filmId];
      
      if (currentInteraction?.is_liked_by_me) {
        await socialService.unlikeActivity(filmId);
        setInteractions(prev => ({
          ...prev,
          [filmId]: {
            ...prev[filmId],
            like_count: prev[filmId].like_count - 1,
            is_liked_by_me: false
          }
        }));
      } else {
        await socialService.likeActivity(filmId);
        setInteractions(prev => ({
          ...prev,
          [filmId]: {
            ...prev[filmId] || { like_count: 0, comment_count: 0, is_liked_by_me: false, comments: [] },
            like_count: (prev[filmId]?.like_count || 0) + 1,
            is_liked_by_me: true
          }
        }));
      }
    } catch (error) {
      console.error("Beğeni işlemi başarısız:", error);
    } finally {
      setLikeLoading(null);
    }
  };

  // Handle add comment
  const handleAddComment = async (filmId: number) => {
    const content = commentInput[filmId]?.trim();
    if (!content) return;
    
    try {
      setCommentLoading(filmId);
      const newComment = await socialService.addComment(filmId, content);
      
      setInteractions(prev => ({
        ...prev,
        [filmId]: {
          ...prev[filmId] || { like_count: 0, comment_count: 0, is_liked_by_me: false, comments: [] },
          comment_count: (prev[filmId]?.comment_count || 0) + 1,
          comments: [newComment, ...(prev[filmId]?.comments || [])]
        }
      }));
      
      setCommentInput(prev => ({ ...prev, [filmId]: "" }));
    } catch (error) {
      console.error("Yorum eklenemedi:", error);
    } finally {
      setCommentLoading(null);
    }
  };

  // Handle delete comment
  const handleDeleteComment = async (filmId: number, commentId: number) => {
    console.log('🗑️ Deleting comment:', { filmId, commentId });
    try {
      const result = await socialService.deleteComment(commentId);
      console.log('✅ Delete comment result:', result);
      
      setInteractions(prev => ({
        ...prev,
        [filmId]: {
          ...prev[filmId],
          comment_count: prev[filmId].comment_count - 1,
          comments: prev[filmId].comments.filter(c => c.id !== commentId)
        }
      }));
    } catch (error) {
      console.error("Yorum silinemedi:", error);
    }
  };

  // Handle start editing comment
  const handleStartEditComment = (commentId: number, currentContent: string) => {
    setEditingComment(commentId);
    setEditCommentText(currentContent);
  };

  // Handle cancel editing
  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditCommentText("");
  };

  // Handle update comment
  const handleUpdateComment = async (filmId: number, commentId: number) => {
    const content = editCommentText.trim();
    if (!content) return;
    
    try {
      setCommentLoading(commentId);
      const updatedComment = await socialService.updateComment(commentId, content);
      
      setInteractions(prev => ({
        ...prev,
        [filmId]: {
          ...prev[filmId],
          comments: prev[filmId].comments.map(c => 
            c.id === commentId ? { ...c, content: updatedComment.content } : c
          )
        }
      }));
      
      setEditingComment(null);
      setEditCommentText("");
    } catch (error) {
      console.error("Yorum güncellenemedi:", error);
    } finally {
      setCommentLoading(null);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userResponse, statsResponse, weeklyCount, feedResponse] = await Promise.all([
          userService.getUserProfile(),
          userService.getUserStats(),
          socialService.getWeeklyMovieCount(),
          socialService.getFeed(20, feedSource),
        ]);

        setCurrentUser(userResponse);
        setStats(statsResponse);
        setWeeklyMovies(weeklyCount);
        setFeed(feedResponse);
        
        // Fetch interactions for each feed item
        const interactionsMap: Record<number, ActivityInteraction> = {};
        for (const item of feedResponse) {
          try {
            const interaction = await socialService.getActivityInteractions(item.film.id);
            interactionsMap[item.film.id] = interaction;
          } catch (err) {
            // Ignore errors for individual interactions
          }
        }
        setInteractions(interactionsMap);
      } catch (error) {
        console.error("Veri yüklenirken hata:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Refetch feed when source changes
  useEffect(() => {
    if (!loading) {
      fetchFeed(feedSource);
    }
  }, [feedSource, fetchFeed, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Welcome Section */}
      <div className="relative bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-2xl p-4 sm:p-6 border border-purple-500/20 overflow-hidden">
        {/* Film Poster Collage Background */}
        <div className="absolute inset-0 opacity-10 blur-sm">
          <div className="absolute inset-0 grid grid-cols-3 gap-2 p-2">
            <img
              src="https://images.unsplash.com/photo-1753944847480-92f369a5f00e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaW5lbWElMjBtb3ZpZSUyMHBvc3RlcnN8ZW58MXx8fHwxNzY1MTk2Mjc2fDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt=""
              className="w-full h-full object-cover rounded"
            />
            <img
              src="https://images.unsplash.com/photo-1764689668473-b834a1a575e7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaWxtJTIwcmVlbHMlMjB2aW50YWdlfGVufDF8fHx8MTc2NTE5NjI3Nnww&ixlib=rb-4.1.0&q=80&w=1080"
              alt=""
              className="w-full h-full object-cover rounded"
            />
            <img
              src="https://images.unsplash.com/photo-1620146095812-813e2de733b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3ZpZSUyMHRoZWF0ZXIlMjBzZWF0c3xlbnwxfHx8fDE3NjUxMjM1MDZ8MA&ixlib=rb-4.1.0&q=80&w=1080"
              alt=""
              className="w-full h-full object-cover rounded"
            />
          </div>
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl text-white mb-2">
            Merhaba, {currentUser?.username || "Kullanıcı"}! 👋
          </h1>
          <p className="text-gray-300 text-sm sm:text-base">
            Bu hafta {weeklyMovies} film izledin. {weeklyMovies > 0 ? "Harika gidiyorsun!" : "Haydi film izlemeye başla!"}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 backdrop-blur rounded-xl p-4 border border-purple-500/10">
          <div className="text-3xl mb-2 text-purple-400">
            {stats.total_movies}
          </div>
          <div className="text-gray-400 text-sm">Film</div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur rounded-xl p-4 border border-purple-500/10">
          <div className="text-3xl mb-2 text-pink-400">
            {stats.total_series}
          </div>
          <div className="text-gray-400 text-sm">Dizi</div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur rounded-xl p-4 border border-purple-500/10">
          <div className="text-3xl mb-2 text-blue-400">
            {stats.total_reviews}
          </div>
          <div className="text-gray-400 text-sm">Yorumlarım</div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur rounded-xl p-4 border border-purple-500/10">
          <div className="text-3xl mb-2 text-green-400">
            {stats.total_followers}
          </div>
          <div className="text-gray-400 text-sm">Takipçi</div>
        </div>
      </div>

      {/* Badges */}
      <div className="bg-slate-900/50 backdrop-blur rounded-xl p-4 sm:p-6 border border-purple-500/10">
        <h2 className="text-lg sm:text-xl text-white mb-4">Rozetlerim</h2>
        {stats.badges && stats.badges.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {stats.badges.map((badge, index) => (
              <div
                key={index}
                className={`px-4 py-2.5 rounded-lg border transition-transform hover:scale-105 ${getBadgeStyle(badge.rarity)}`}
              >
                {badge.name}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">
            Henüz rozet kazanmadın. Film izleyerek ve yorum yazarak rozet kazanabilirsin!
          </p>
        )}
      </div>

      {/* Activity Feed */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl sm:text-2xl text-white">Aktiviteler</h2>
          {/* Filter Tabs */}
          <div className="flex bg-slate-900/70 rounded-lg p-1 gap-0.5 sm:gap-1">
            <button
              onClick={() => setFeedSource("all")}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-2 ${
                feedSource === "all"
                  ? "bg-purple-500/30 text-purple-300 border border-purple-500/30"
                  : "text-gray-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Hepsi</span>
            </button>
            <button
              onClick={() => setFeedSource("friends")}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-2 ${
                feedSource === "friends"
                  ? "bg-purple-500/30 text-purple-300 border border-purple-500/30"
                  : "text-gray-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Arkadaşlar</span>
            </button>
            <button
              onClick={() => setFeedSource("me")}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-2 ${
                feedSource === "me"
                  ? "bg-purple-500/30 text-purple-300 border border-purple-500/30"
                  : "text-gray-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Ben</span>
            </button>
          </div>
        </div>
        
        {feedLoading ? (
          <div className="bg-slate-900/50 backdrop-blur rounded-xl p-8 border border-purple-500/10 text-center">
            <p className="text-gray-400">Yükleniyor...</p>
          </div>
        ) : feed.length === 0 ? (
          <div className="bg-slate-900/50 backdrop-blur rounded-xl p-8 border border-purple-500/10 text-center">
            <p className="text-gray-400">
              Henüz arkadaş aktivitesi yok. Arkadaş ekleyerek başla!
            </p>
          </div>
        ) : (
          feed.map((item) => {
            const movieDate = new Date(item.film.izlenme_tarihi);
            const posterUrl = item.film.poster_path
              ? `https://image.tmdb.org/t/p/w500${item.film.poster_path}`
              : "https://via.placeholder.com/500x750?text=No+Image";

            return (
              <div
                key={`${item.user.id}-${item.film.id}`}
                className="bg-slate-900/50 backdrop-blur rounded-xl p-4 border border-purple-500/10 hover:border-purple-500/30 transition-all"
              >
                <div className="flex gap-4">
                  {/* User Avatar */}
                  <Link to={`/profile/${item.user.id}`}>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold ring-2 ring-purple-500/30">
                      {item.user.username.charAt(0).toUpperCase()}
                    </div>
                  </Link>

                  <div className="flex-1">
                    {/* Activity Header */}
                    <div className="flex items-center gap-2 mb-2">
                      <Link
                        to={`/profile/${item.user.id}`}
                        className="text-white hover:text-purple-400 transition-colors"
                      >
                        {item.user.username}
                      </Link>
                      <span className="text-gray-500">izledi</span>
                      <span className="text-gray-600 text-sm ml-auto">
                        {formatDistanceToNow(movieDate, {
                          addSuffix: true,
                          locale: tr,
                        })}
                      </span>
                    </div>

                    {/* Movie Info */}
                    <div className="flex gap-3">
                      <Link to={`/movie/${item.film.tmdb_id}`}>
                        <img
                          src={posterUrl}
                          alt={item.film.title}
                          className="w-16 h-24 object-cover rounded-lg"
                        />
                      </Link>
                      <div className="flex-1">
                        <Link
                          to={`/movie/${item.film.tmdb_id}`}
                          className="text-white hover:text-purple-400 transition-colors"
                        >
                          {item.film.title}
                        </Link>
                        {item.film.release_date && (
                          <div className="text-gray-400 text-sm">
                            {new Date(item.film.release_date).getFullYear()}
                          </div>
                        )}
                        {item.film.kisisel_puan && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-yellow-400">
                              {item.film.kisisel_puan}/10
                            </span>
                          </div>
                        )}
                        {item.film.kisisel_yorum && (
                          <p className="text-gray-300 mt-2 text-sm line-clamp-2">
                            "{item.film.kisisel_yorum}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-3 text-gray-400">
                      <button 
                        onClick={() => handleLike(item.film.id)}
                        disabled={likeLoading === item.film.id}
                        className={`flex items-center gap-2 transition-colors px-3 py-1.5 rounded-lg ${
                          interactions[item.film.id]?.is_liked_by_me 
                            ? "text-pink-400 bg-pink-500/10" 
                            : "hover:text-pink-400 hover:bg-pink-500/10"
                        } disabled:opacity-50`}
                      >
                        <Heart className={`w-5 h-5 ${interactions[item.film.id]?.is_liked_by_me ? "fill-pink-400" : ""}`} />
                        <span className="text-sm">{interactions[item.film.id]?.like_count || 0}</span>
                      </button>
                      <button 
                        onClick={() => setShowComments(showComments === item.film.id ? null : item.film.id)}
                        className={`flex items-center gap-2 transition-colors px-3 py-1.5 rounded-lg ${
                          showComments === item.film.id 
                            ? "text-blue-400 bg-blue-500/10" 
                            : "hover:text-blue-400 hover:bg-blue-500/10"
                        }`}
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm">{interactions[item.film.id]?.comment_count || 0}</span>
                      </button>
                    </div>

                    {/* Comments Section */}
                    {showComments === item.film.id && (
                      <div className="mt-4 space-y-3 border-t border-slate-700/50 pt-4">
                        {/* Comment Input */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={commentInput[item.film.id] || ""}
                            onChange={(e) => setCommentInput(prev => ({ ...prev, [item.film.id]: e.target.value }))}
                            placeholder="Yorum yaz..."
                            className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleAddComment(item.film.id);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleAddComment(item.film.id)}
                            disabled={commentLoading === item.film.id || !commentInput[item.film.id]?.trim()}
                            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Send className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Comments List */}
                        {interactions[item.film.id]?.comments?.map((comment) => (
                          <div key={comment.id} className="flex gap-3 p-3 bg-slate-800/30 rounded-lg">
                            <Link to={`/profile/${comment.user.id}`}>
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                                {comment.user.username.charAt(0).toUpperCase()}
                              </div>
                            </Link>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Link to={`/profile/${comment.user.id}`} className="text-white text-sm font-medium hover:text-purple-400">
                                  {comment.user.username}
                                </Link>
                                <span className="text-gray-500 text-xs">
                                  {formatDistanceToNow(new Date(comment.created_at + 'Z'), { addSuffix: true, locale: tr })}
                                </span>
                                {(currentUser?.id === comment.user_id || String(currentUser?.id) === String(comment.user_id)) && (
                                  <div className="ml-auto flex items-center gap-1">
                                    {editingComment === comment.id ? (
                                      <>
                                        <button
                                          onClick={() => handleUpdateComment(item.film.id, comment.id)}
                                          disabled={commentLoading === comment.id || !editCommentText.trim()}
                                          className="text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
                                        >
                                          <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={handleCancelEdit}
                                          className="text-gray-500 hover:text-gray-300 transition-colors"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => handleStartEditComment(comment.id, comment.content)}
                                          className="text-gray-500 hover:text-blue-400 transition-colors"
                                        >
                                          <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteComment(item.film.id, comment.id)}
                                          className="text-gray-500 hover:text-red-400 transition-colors"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                              {editingComment === comment.id ? (
                                <input
                                  type="text"
                                  value={editCommentText}
                                  onChange={(e) => setEditCommentText(e.target.value)}
                                  className="w-full mt-1 bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-gray-300 text-sm focus:outline-none focus:border-purple-500"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleUpdateComment(item.film.id, comment.id);
                                    } else if (e.key === "Escape") {
                                      handleCancelEdit();
                                    }
                                  }}
                                  autoFocus
                                />
                              ) : (
                                <p className="text-gray-300 text-sm mt-1">{comment.content}</p>
                              )}
                            </div>
                          </div>
                        ))}

                        {interactions[item.film.id]?.comments?.length === 0 && (
                          <p className="text-gray-500 text-sm text-center py-2">Henüz yorum yok</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Add Button */}
      <Link
        to="/discover"
        className="fixed bottom-20 md:bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-purple-500/50 transition-all hover:scale-110"
      >
        <span className="text-2xl">+</span>
      </Link>
    </div>
  );
}