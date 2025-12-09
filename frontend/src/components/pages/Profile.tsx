import { useParams } from "react-router";
import { Settings, Film, Tv, Star, Award, Calendar, LogOut, Heart, Bookmark, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { authService, userService, movieService, socialService } from "../../utils/api";
import { Badge } from "../../utils/mockData";
import { Link } from "react-router";

interface UserProfile {
  id: number;
  username: string;
  email: string;
  picture?: string;
  bio?: string;
  created_at: string;
}

interface UserStats {
  total_movies: number;
  total_series: number;
  average_rating: number;
  total_watch_time: number;
  total_reviews?: number;
  total_followers?: number;
  total_following?: number;
  movies_this_month?: number;
  movies_this_year?: number;
  series_watching?: number;
  series_completed?: number;
  total_watch_hours?: number;
  badges: Badge[];
}

interface UserMovie {
  id: number;
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  kisisel_puan: number | null;
  kisisel_yorum: string | null;
  izlendi: boolean;
  is_favorite: boolean;
  is_watchlist: boolean;
  izlenme_tarihi: string;
}

export function Profile() {
  const { userId } = useParams();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'watched' | 'favorites' | 'watchlist'>('watched');
  const [movies, setMovies] = useState<UserMovie[]>([]);
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Kullanıcı bilgilerini getir
        let userData;
        if (userId) {
          userData = await userService.getUserProfile(userId);
        } else {
          userData = await authService.getCurrentUser();
        }
        setUser(userData);

        // İstatistikleri getir - backend'den gerçek veri
        const statsData = await userService.getUserStats(userId || undefined);
        setStats(statsData);
        
        // Başkasının profiliyse takip durumunu kontrol et
        if (userId) {
          const friendsList = await socialService.getFriends();
          const isFollowingUser = friendsList.some((friend: any) => friend.id === parseInt(userId));
          setIsFollowing(isFollowingUser);
        } else {
          // Kullanıcının kendi profiliyse film listesini yükle
          loadUserMovies();
        }
      } catch (err: any) {
        console.error("Error fetching user data:", err);
        
        // Error mesajını string'e çevir
        let errorMessage = "Kullanıcı bilgileri yüklenemedi";
        
        if (err.response?.data?.detail) {
          if (typeof err.response.data.detail === 'string') {
            errorMessage = err.response.data.detail;
          } else if (Array.isArray(err.response.data.detail)) {
            // ValidationError array'i ise ilk hatayı al
            errorMessage = err.response.data.detail[0]?.msg || errorMessage;
          }
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  // Film listesini activeTab değiştiğinde yeniden yükle
  useEffect(() => {
    if (!userId && user) {
      loadUserMovies();
    }
  }, [activeTab, userId, user]);

  const loadUserMovies = async () => {
    try {
      setMoviesLoading(true);
      const moviesData = await movieService.getUserMovies();
      setMovies(moviesData);
    } catch (err: any) {
      console.error("Error loading movies:", err);
    } finally {
      setMoviesLoading(false);
    }
  };

  const handleEditProfile = () => {
    setNewUsername(user?.username || "");
    setEditError(null);
    setShowEditModal(true);
  };

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      setEditError("Kullanıcı adı boş olamaz");
      return;
    }

    if (newUsername.length < 3 || newUsername.length > 20) {
      setEditError("Kullanıcı adı 3-20 karakter arası olmalıdır");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      setEditError("Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir");
      return;
    }

    try {
      setEditLoading(true);
      setEditError(null);
      const updatedUser = await userService.updateProfile({ username: newUsername.toLowerCase() });
      setUser(updatedUser);
      setShowEditModal(false);
    } catch (err: any) {
      console.error("Update error:", err);
      setEditError(err.response?.data?.detail || "Güncelleme başarısız");
    } finally {
      setEditLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!userId || !user) return;
    
    try {
      setFollowLoading(true);
      
      if (isFollowing) {
        // Takipten çık
        await socialService.removeFriend(parseInt(userId));
        setIsFollowing(false);
        alert("Takipten çıktınız");
      } else {
        // Takip et
        await socialService.sendFriendRequest(parseInt(userId));
        setIsFollowing(true);
        alert("Takip isteği gönderildi!");
      }
      
      // Stats'ı güncelle
      const updatedStats = await userService.getUserStats(userId);
      setStats(updatedStats);
    } catch (err: any) {
      console.error("Follow/unfollow error:", err);
      alert(err.response?.data?.detail || "Bir hata oluştu");
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">{error || "Kullanıcı bulunamadı"}</p>
      </div>
    );
  }

  const isOwnProfile = !userId;

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

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-2xl p-6 border border-purple-500/20">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <img
            src={user.picture || '/default-avatar.png'}
            alt={user.username}
            className="w-32 h-32 rounded-full object-cover ring-4 ring-purple-500/30"
          />

          {/* User Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl text-white mb-1">{user.username}</h1>
            <p className="text-gray-400 mb-3">{user.email}</p>
            {user.bio && <p className="text-gray-300 mb-4">{user.bio}</p>}

            {/* Stats */}
            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm">
              <div>
                <span className="text-2xl text-purple-400">
                  {stats?.total_movies || 0}
                </span>
                <span className="text-gray-400 ml-2">Film</span>
              </div>
              <div>
                <span className="text-2xl text-pink-400">
                  {stats?.total_series || 0}
                </span>
                <span className="text-gray-400 ml-2">Dizi</span>
              </div>
              <div>
                <span className="text-2xl text-blue-400">
                  {stats?.total_reviews || 0}
                </span>
                <span className="text-gray-400 ml-2">İnceleme</span>
              </div>
              <div>
                <span className="text-2xl text-green-400">
                  {stats?.total_followers || 0}
                </span>
                <span className="text-gray-400 ml-2">Takipçi</span>
              </div>
              <div>
                <span className="text-2xl text-yellow-400">
                  {stats?.total_following || 0}
                </span>
                <span className="text-gray-400 ml-2">Takip</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {isOwnProfile && (
            <div className="flex flex-col gap-2">
              <button 
                onClick={handleEditProfile}
                className="px-8 py-3.5 bg-slate-800/50 hover:bg-slate-700/50 text-white rounded-xl transition-all flex items-center gap-2 shadow-lg hover:scale-105"
              >
                <Settings className="w-5 h-5" />
                Düzenle
              </button>
              <button 
                onClick={() => authService.logout()}
                className="px-8 py-3.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-xl transition-all flex items-center gap-2 shadow-lg hover:scale-105"
              >
                <LogOut className="w-5 h-5" />
                Çıkış Yap
              </button>
            </div>
          )}
          {!isOwnProfile && (
            <button 
              onClick={handleFollowToggle}
              disabled={followLoading}
              className={`px-8 py-3.5 text-white rounded-xl transition-all shadow-lg hover:scale-105 ${
                isFollowing 
                  ? "bg-slate-700 hover:bg-slate-600" 
                  : "bg-purple-500 hover:bg-purple-600 hover:shadow-purple-500/50"
              } ${followLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {followLoading ? "Yükleniyor..." : isFollowing ? "Takip Ediliyor" : "Takip Et"}
            </button>
          )}
        </div>
      </div>

      {/* Badges */}
      {stats?.badges && stats.badges.length > 0 && (
        <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-purple-500/10">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl text-white">Rozetler</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.badges.map((badge, index) => (
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
              <span className="text-purple-400">{stats?.total_movies || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Bu Ay:</span>
              <span className="text-purple-400">
                {stats?.movies_this_month || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Bu Yıl:</span>
              <span className="text-purple-400">
                {stats?.movies_this_year || 0}
              </span>
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
              <span className="text-pink-400">{stats?.total_series || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Devam Eden:</span>
              <span className="text-pink-400">
                {stats?.series_watching || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tamamlanan:</span>
              <span className="text-pink-400">
                {stats?.series_completed || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-purple-500/10">
          <div className="flex items-center gap-3 mb-3">
            <Star className="w-6 h-6 text-yellow-400" />
            <h3 className="text-xl text-white">Ortalama Puan</h3>
          </div>
          <div className="text-center">
            <div className="text-5xl text-yellow-400 mb-2">
              {stats?.average_rating ? stats.average_rating.toFixed(1) : '0.0'}
            </div>
            <div className="text-gray-400">
              {stats?.total_reviews || 0} inceleme
            </div>
          </div>
        </div>
      </div>

      {/* Favorite Genres */}
      <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-purple-500/10">
        <h2 className="text-2xl text-white mb-4">Favori Türler</h2>
        <div className="flex flex-wrap gap-3">
          {["Bilim-Kurgu", "Drama", "Aksiyon", "Gerilim", "Komedi"].map(
            (genre, index) => (
              <div
                key={index}
                className="bg-purple-500/20 text-purple-300 px-4 py-2 rounded-lg border border-purple-500/30"
              >
                {genre}
              </div>
            )
          )}
        </div>
      </div>

      {/* Year in Review */}
      <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-2xl p-6 border border-purple-500/20">
        <h2 className="text-2xl text-white mb-4">2025 Özeti</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl mb-1">🎬</div>
            <div className="text-2xl text-purple-400">
              {stats?.movies_this_year || 0}
            </div>
            <div className="text-gray-400 text-sm">İzlenen Film</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-1">⏱️</div>
            <div className="text-2xl text-pink-400">
              {stats?.total_watch_hours || 0}
            </div>
            <div className="text-gray-400 text-sm">Saat</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-1">🌟</div>
            <div className="text-2xl text-blue-400">
              {stats?.total_reviews || 0}
            </div>
            <div className="text-gray-400 text-sm">İnceleme</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-1">🏆</div>
            <div className="text-2xl text-green-400">
              {stats?.badges?.length || 0}
            </div>
            <div className="text-gray-400 text-sm">Rozet</div>
          </div>
        </div>
      </div>

      {/* Film Listeleri - Sadece kendi profilinde görünür */}
      {isOwnProfile && (
        <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-purple-500/10">
          <h2 className="text-2xl text-white mb-4">Filmlerim</h2>
          
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('watched')}
              className={`px-6 py-3 rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'watched'
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/50'
                  : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50'
              }`}
            >
              <Clock className="w-5 h-5" />
              İzlediklerim ({movies.filter(m => m.izlendi).length})
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-6 py-3 rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'favorites'
                  ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/50'
                  : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50'
              }`}
            >
              <Heart className="w-5 h-5" />
              Favorilerim ({movies.filter(m => m.is_favorite).length})
            </button>
            <button
              onClick={() => setActiveTab('watchlist')}
              className={`px-6 py-3 rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'watchlist'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50'
              }`}
            >
              <Bookmark className="w-5 h-5" />
              İzleme Listem ({movies.filter(m => m.is_watchlist).length})
            </button>
          </div>

          {/* Movies Grid */}
          {moviesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          ) : activeTab === 'watched' && movies.filter(m => m.izlendi).length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {movies.filter(m => m.izlendi).map((movie) => (
                <Link
                  key={movie.id}
                  to={`/movie/${movie.tmdb_id}`}
                  className="group relative rounded-xl overflow-hidden transition-transform hover:scale-105"
                >
                  {movie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title}
                      className="w-full h-auto object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-slate-800 flex items-center justify-center">
                      <Film className="w-12 h-12 text-gray-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-white text-sm font-medium mb-1 line-clamp-2">
                        {movie.title}
                      </h3>
                      {movie.kisisel_puan && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-yellow-400 text-sm">
                            {movie.kisisel_puan}/10
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : activeTab === 'favorites' && movies.filter(m => m.is_favorite).length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {movies.filter(m => m.is_favorite).map((movie) => (
                <Link
                  key={movie.id}
                  to={`/movie/${movie.tmdb_id}`}
                  className="group relative rounded-xl overflow-hidden transition-transform hover:scale-105"
                >
                  {movie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title}
                      className="w-full h-auto object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-slate-800 flex items-center justify-center">
                      <Film className="w-12 h-12 text-gray-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-white text-sm font-medium mb-1 line-clamp-2">
                        {movie.title}
                      </h3>
                      {movie.kisisel_puan && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-yellow-400 text-sm">
                            {movie.kisisel_puan}/10
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : activeTab === 'watchlist' && movies.filter(m => m.is_watchlist).length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {movies.filter(m => m.is_watchlist).map((movie) => (
                <Link
                  key={movie.id}
                  to={`/movie/${movie.tmdb_id}`}
                  className="group relative rounded-xl overflow-hidden transition-transform hover:scale-105"
                >
                  {movie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title}
                      className="w-full h-auto object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-slate-800 flex items-center justify-center">
                      <Film className="w-12 h-12 text-gray-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-white text-sm font-medium mb-1 line-clamp-2">
                        {movie.title}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : activeTab === 'favorites' ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Henüz favorilere film eklemediniz</p>
            </div>
          ) : activeTab === 'watchlist' ? (
            <div className="text-center py-12">
              <Bookmark className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Henüz izleme listeniz boş</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Henüz film eklemediniz</p>
            </div>
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-purple-500/20 p-6 max-w-md w-full">
            <h2 className="text-2xl text-white mb-4">Profili Düzenle</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm mb-2 block">
                  Kullanıcı Adı (@username)
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="kullaniciadi"
                  className="w-full bg-slate-800 border border-purple-500/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                  maxLength={20}
                />
                <p className="text-gray-500 text-xs mt-1">
                  3-20 karakter, sadece harf, rakam ve alt çizgi
                </p>
              </div>

              {editError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{editError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all"
                  disabled={editLoading}
                >
                  İptal
                </button>
                <button
                  onClick={handleUpdateUsername}
                  className="flex-1 px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={editLoading}
                >
                  {editLoading ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}