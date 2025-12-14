import { Link } from "react-router";
import { Heart, MessageCircle, Star, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userResponse, statsResponse, weeklyCount, feedResponse] = await Promise.all([
          userService.getUserProfile(),
          userService.getUserStats(),
          socialService.getWeeklyMovieCount(),
          socialService.getFeed(20),
        ]);

        setCurrentUser(userResponse);
        setStats(statsResponse);
        setWeeklyMovies(weeklyCount);
        setFeed(feedResponse);
      } catch (error) {
        console.error("Veri yüklenirken hata:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="relative bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-2xl p-6 border border-purple-500/20 overflow-hidden">
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
          <h1 className="text-3xl text-white mb-2">
            Merhaba, {currentUser?.username || "Kullanıcı"}! 👋
          </h1>
          <p className="text-gray-300">
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
      <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-purple-500/10">
        <h2 className="text-xl text-white mb-4">Rozetlerim</h2>
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
        <h2 className="text-2xl text-white">Arkadaş Aktiviteleri</h2>
        {feed.length === 0 ? (
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
                    <div className="flex items-center gap-6 mt-3 text-gray-400">
                      <button className="flex items-center gap-2 hover:text-pink-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-pink-500/10">
                        <Heart className="w-5 h-5" />
                      </button>
                      <button className="flex items-center gap-2 hover:text-blue-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-500/10">
                        <MessageCircle className="w-5 h-5" />
                      </button>
                    </div>
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