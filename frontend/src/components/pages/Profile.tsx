import { useParams, useNavigate, Link } from "react-router";
import { Settings, Film, Tv, Star, Award, Calendar, LogOut, X, ChevronLeft, ChevronRight, UserPlus, UserMinus, Users, Loader2 } from "lucide-react";
import { useProfile } from "../../hooks/useProfile";
import { useAuth } from "../../hooks/useAuth";
import { useState, useEffect } from "react";
import { getActivitiesByUserId, getMovieById, Badge, User } from "../../utils/mockData";
import { toggleInteraction } from "../../utils/storage";

export function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 18; // 3 satır x 6 sütun

  // All logic is handled by useProfile hook
  const {
    profileUser,
    isOwnProfile,
    isFriend,
    isFollowing,
    friendshipLoading,
    handleFollow,
    handleUnfollow,
    visibility,
    stats,
    activeTab,
    setActiveTab,
    watchedItems,
    favoriteItems,
    watchlistItems,
    reviewItems,
    calculatedBadges,
    refreshLibrary,
  } = useProfile({ userId });

  // activeTab değişince page'i sıfırla
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Handle edit profile
  const handleEdit = () => {
    navigate('/profile/edit');
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Handle removing item from library
  const handleRemoveItem = (item: any, action: 'watched' | 'favorite' | 'watchlist') => {
    toggleInteraction({
      id: item.id,
      type: item.type,
      title: item.title,
      poster: item.poster,
      year: item.year,
      rating: item.rating,
    }, action);
    // Refresh library data
    refreshLibrary();
  };

  // If user not found
  if (!profileUser) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Kullanıcı bulunamadı</p>
      </div>
    );
  }

  // Get recent activities for display
  const userActivities = getActivitiesByUserId(String(profileUser.id));
  const recentMovies = userActivities
    .slice(0, 6)
    .map((activity) => getMovieById(activity.movieId))
    .filter((movie) => movie !== undefined);

  // Helper functions for badge styling
  const getBadgeStyle = (rarity: Badge["rarity"]) => {
    switch (rarity) {
      case "legendary":
        return "bg-gradient-to-br from-yellow-500/30 to-amber-600/30 border-yellow-500/50 shadow-yellow-500/20 shadow-lg";
      case "rare":
        return "bg-gradient-to-br from-purple-500/25 to-pink-500/25 border-purple-400/40 shadow-purple-500/15 shadow-md";
      case "common":
        return "bg-gradient-to-br from-slate-600/25 to-slate-700/25 border-slate-500/40 shadow-slate-500/10 shadow-sm";
    }
  };

  const getBadgeTextColor = (rarity: Badge["rarity"]) => {
    switch (rarity) {
      case "legendary":
        return "text-yellow-300";
      case "rare":
        return "text-purple-200";
      case "common":
        return "text-slate-300";
    }
  };

  // Calculate current items based on active tab
  const allItems =
    activeTab === "watched" ? watchedItems :
    activeTab === "favorites" ? favoriteItems :
    activeTab === "watchlist" ? watchlistItems :
    activeTab === "reviews" ? reviewItems :
    [];

  // Pagination
  const totalPages = Math.ceil(allItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = allItems.slice(startIndex, startIndex + itemsPerPage);

  // Calculate favorite genres from favorite items
  const favoriteGenres = (() => {
    if (favoriteItems.length === 0) return [];
    
    const genreCounts: Record<string, number> = {};
    const mockGenres = ['Drama', 'Aksiyon', 'Bilim-Kurgu', 'Komedi', 'Gerilim'];
    
    // Count genres from favorite items (using mock data for now)
    for (let i = 0; i < favoriteItems.length; i++) {
      const randomGenre = mockGenres[Math.floor(Math.random() * mockGenres.length)];
      genreCounts[randomGenre] = (genreCounts[randomGenre] || 0) + 1;
    }

    // Sort by count and get top 5
    return Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([genre]) => genre);
  })();

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-2xl p-6 border border-purple-500/20">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <img
            src={profileUser.avatar || "/default-avatar.png"}
            alt={profileUser.name}
            className="w-32 h-32 rounded-full object-cover ring-4 ring-purple-500/30"
          />

          {/* User Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl text-white mb-1">{profileUser.name}</h1>
            <p className="text-gray-400 mb-3">@{profileUser.username}</p>
            {(profileUser as User).bio && <p className="text-gray-300 mb-4">{(profileUser as User).bio}</p>}

            {/* Stats */}
            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm">
              <div>
                <span className="text-2xl text-purple-400">{stats.totalMovies}</span>
                <span className="text-gray-400 ml-2">Film</span>
              </div>
              <div>
                <span className="text-2xl text-pink-400">{stats.totalSeries}</span>
                <span className="text-gray-400 ml-2">Dizi</span>
              </div>
              <div>
                <span className="text-2xl text-blue-400">{stats.totalAnimes}</span>
                <span className="text-gray-400 ml-2">Anime</span>
              </div>
              <div>
                <span className="text-2xl text-green-400">{stats.totalFavorites}</span>
                <span className="text-gray-400 ml-2">Favori</span>
              </div>
              <div>
                <span className="text-2xl text-yellow-400">{stats.totalReviews}</span>
                <span className="text-gray-400 ml-2">İnceleme</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {isOwnProfile && (
            <div className="flex gap-3">
              <button 
                onClick={handleEdit}
                className="px-6 py-3 bg-slate-800/50 hover:bg-slate-700/50 text-white rounded-xl transition-all flex items-center gap-2 shadow-lg hover:scale-105"
              >
                <Settings className="w-5 h-5" />
                Düzenle
              </button>
              <button 
                onClick={handleLogout}
                className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl transition-all flex items-center gap-2 border border-red-500/30"
              >
                <LogOut className="w-5 h-5" />
                Çıkış Yap
              </button>
            </div>
          )}
          {!isOwnProfile && (
            <div className="flex flex-col gap-2">
              {isFriend && (
                <span className="px-4 py-1.5 bg-green-500/20 text-green-300 text-sm rounded-lg border border-green-500/30 flex items-center gap-2 justify-center">
                  <Users className="w-4 h-4" />
                  Arkadaş
                </span>
              )}
              {isFollowing ? (
                <button 
                  onClick={handleUnfollow}
                  disabled={friendshipLoading}
                  className="px-8 py-3.5 bg-slate-700 hover:bg-red-500/20 hover:text-red-300 text-white rounded-xl transition-all shadow-lg hover:scale-105 flex items-center gap-2 disabled:opacity-50"
                >
                  {friendshipLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <UserMinus className="w-5 h-5" />
                      Takipten Çık
                    </>
                  )}
                </button>
              ) : (
                <button 
                  onClick={handleFollow}
                  disabled={friendshipLoading}
                  className="px-8 py-3.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all shadow-lg hover:shadow-purple-500/50 hover:scale-105 flex items-center gap-2 disabled:opacity-50"
                >
                  {friendshipLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Takip Et
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Badges - Dynamic based on user stats */}
      {calculatedBadges && calculatedBadges.length > 0 && (
        <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-purple-500/10">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl text-white">Rozetler</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {calculatedBadges.map((badge, index: number) => (
              <div
                key={index}
                className={`p-4 rounded-xl border text-center transition-transform hover:scale-105 ${getBadgeStyle(
                  badge.rarity
                )}`}
              >
                <div className="text-3xl mb-2">{badge.name.split(" ")[0]}</div>
                <div className={`text-sm ${getBadgeTextColor(badge.rarity)}`}>
                  {badge.name.split(" ").slice(1).join(" ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-purple-500/10">
          <div className="flex items-center gap-3 mb-3">
            <Film className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl text-white">Film İstatistikleri</h3>
          </div>
          <div className="space-y-2 text-gray-300">
            <div className="flex justify-between">
              <span>Toplam Film:</span>
              <span className="text-purple-400">{stats.totalMovies}</span>
            </div>
            <div className="flex justify-between">
              <span>İzlenen:</span>
              <span className="text-purple-400">{watchedItems.filter(i => i.type === "movie").length}</span>
            </div>
            <div className="flex justify-between">
              <span>Favori:</span>
              <span className="text-purple-400">{favoriteItems.filter(i => i.type === "movie").length}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-purple-500/10">
          <div className="flex items-center gap-3 mb-3">
            <Tv className="w-6 h-6 text-pink-400" />
            <h3 className="text-xl text-white">Dizi İstatistikleri</h3>
          </div>
          <div className="space-y-2 text-gray-300">
            <div className="flex justify-between">
              <span>Toplam Dizi:</span>
              <span className="text-pink-400">{stats.totalSeries}</span>
            </div>
            <div className="flex justify-between">
              <span>İzlenen:</span>
              <span className="text-pink-400">{watchedItems.filter(i => i.type === "series").length}</span>
            </div>
            <div className="flex justify-between">
              <span>Favori:</span>
              <span className="text-pink-400">{favoriteItems.filter(i => i.type === "series").length}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-purple-500/10">
          <div className="flex items-center gap-3 mb-3">
            <Star className="w-6 h-6 text-yellow-400" />
            <h3 className="text-xl text-white">İncelemeler</h3>
          </div>
          <div className="text-center">
            <div className="text-5xl text-yellow-400 mb-2">{stats.totalReviews}</div>
            <div className="text-gray-400">Toplam İnceleme</div>
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="bg-slate-900/50 backdrop-blur rounded-2xl border border-purple-500/10 overflow-hidden">
        {/* Tab Headers */}
        <div className="border-b border-slate-800/50 px-6 pt-6">
          <div className="flex gap-2 flex-wrap">
            {visibility.canSeeWatched && (
              <button
                onClick={() => setActiveTab("watched")}
                className={`px-6 py-3 rounded-t-xl transition-all ${
                  activeTab === "watched"
                    ? "bg-purple-500/20 text-purple-300 border-b-2 border-purple-500"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                İzlenenler ({watchedItems.length})
              </button>
            )}
            {visibility.canSeeFavorites && (
              <button
                onClick={() => setActiveTab("favorites")}
                className={`px-6 py-3 rounded-t-xl transition-all ${
                  activeTab === "favorites"
                    ? "bg-purple-500/20 text-purple-300 border-b-2 border-purple-500"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                Favoriler ({favoriteItems.length})
              </button>
            )}
            {visibility.canSeeWatchlist && (
              <button
                onClick={() => setActiveTab("watchlist")}
                className={`px-6 py-3 rounded-t-xl transition-all ${
                  activeTab === "watchlist"
                    ? "bg-purple-500/20 text-purple-300 border-b-2 border-purple-500"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                İzlenecekler ({watchlistItems.length})
              </button>
            )}
            {visibility.canSeeReviews && (
              <button
                onClick={() => setActiveTab("reviews")}
                className={`px-6 py-3 rounded-t-xl transition-all ${
                  activeTab === "reviews"
                    ? "bg-purple-500/20 text-purple-300 border-b-2 border-purple-500"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                İncelemeler ({reviewItems.length})
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {currentItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Bu bölümde henüz içerik yok</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {currentItems.map((item) => {
                // ID'den type ve gerçek ID'yi çıkar (örn: "movie-123" -> type: movie, id: 123)
                const [type, ...idParts] = item.id.split('-');
                const detailId = idParts.join('-');
                const detailPath = 
                  type === 'movie' ? `/movie/${detailId}` :
                  type === 'series' ? `/series/${detailId}` :
                  type === 'anime' ? `/anime/${detailId}` :
                  '#';

                return (
                  <div key={item.id} className="group relative">
                    <Link to={detailPath}>
                      <img
                        src={item.poster || "/default-poster.jpg"}
                        alt={item.title}
                        className="w-full aspect-[2/3] object-cover rounded-lg group-hover:ring-2 group-hover:ring-purple-500/50 transition-all cursor-pointer"
                      />
                    </Link>
                    {isOwnProfile && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveItem(item, activeTab === 'favorites' ? 'favorite' : activeTab as 'watched' | 'favorite' | 'watchlist');
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="Kaldır"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <Link to={detailPath}>
                      <p className="text-white text-sm mt-2 line-clamp-1 hover:text-purple-400 transition-colors cursor-pointer">
                        {item.title}
                      </p>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-purple-500/10">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-slate-800/50 border border-slate-700 text-gray-400 hover:text-white hover:border-purple-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Sadece ilk 2, son 2 ve current page civarını göster
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-[40px] h-10 rounded-lg font-medium transition-all ${
                          currentPage === page
                            ? "bg-purple-500 text-white"
                            : "bg-slate-800/50 border border-slate-700 text-gray-400 hover:text-white hover:border-purple-500/50"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return <span key={page} className="text-gray-500">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-slate-800/50 border border-slate-700 text-gray-400 hover:text-white hover:border-purple-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      {recentMovies.length > 0 && (
        <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-purple-500/10">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl text-white">Son İzlenenler</h2>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {recentMovies.map((movie) => (
              <div key={movie.id} className="group cursor-pointer">
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-full aspect-[2/3] object-cover rounded-lg group-hover:ring-2 group-hover:ring-purple-500/50 transition-all"
                />
                <p className="text-white text-sm mt-2 line-clamp-1">{movie.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Favorite Genres */}
      <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-purple-500/10">
        <h2 className="text-2xl text-white mb-4">Favori Türler</h2>
        {favoriteGenres.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {favoriteGenres.map((genre, index) => (
              <div
                key={index}
                className="bg-purple-500/20 text-purple-300 px-4 py-2 rounded-lg border border-purple-500/30"
              >
                {genre}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">Favorilere öğe ekleyerek favori türlerinizi görün</p>
        )}
      </div>

      {/* Year in Review */}
      <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-2xl p-6 border border-purple-500/20">
        <h2 className="text-2xl text-white mb-4">2025 Özeti</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl mb-1">🎬</div>
            <div className="text-2xl text-purple-400">{watchedItems.length}</div>
            <div className="text-gray-400 text-sm">İzlenen</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-1">⭐</div>
            <div className="text-2xl text-pink-400">{favoriteItems.length}</div>
            <div className="text-gray-400 text-sm">Favori</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-1">🌟</div>
            <div className="text-2xl text-blue-400">{stats.totalReviews}</div>
            <div className="text-gray-400 text-sm">İnceleme</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-1">🏆</div>
            <div className="text-2xl text-green-400">{(profileUser as User).badges?.length || 0}</div>
            <div className="text-gray-400 text-sm">Rozet</div>
          </div>
        </div>
      </div>
    </div>
  );
}

