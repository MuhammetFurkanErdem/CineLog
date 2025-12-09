import { useState, useEffect } from "react";
import { TrendingUp, Calendar, Clock, Film, Tv, Star, Loader2 } from "lucide-react";
import { userService, movieService } from "../../utils/api";

interface UserStats {
  total_movies: number;
  total_series: number;
  average_rating: number | null;
  total_watch_time: number;
  total_reviews: number;
  total_followers: number;
  total_following: number;
  movies_this_month: number;
  movies_this_year: number;
  series_watching: number;
  series_completed: number;
  total_watch_hours: number;
  badges: { name: string; rarity: string }[];
}

interface UserMovie {
  id: number;
  tmdb_id: number;
  title: string;
  izlenme_tarihi: string;
  kisisel_puan: number | null;
}

interface GenreStats {
  genres: { name: string; count: number }[];
  total: number;
}

const GENRE_COLORS = [
  "bg-purple-500",
  "bg-pink-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-red-500",
  "bg-indigo-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-teal-500",
];

export function Stats() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [movies, setMovies] = useState<UserMovie[]>([]);
  const [genreStats, setGenreStats] = useState<GenreStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [statsData, moviesData, genresData] = await Promise.all([
          userService.getUserStats(),
          movieService.getUserMovies(),
          movieService.getGenreStats()
        ]);
        setStats(statsData);
        setMovies(moviesData);
        setGenreStats(genresData);
      } catch (err: any) {
        console.error("Stats yüklenirken hata:", err);
        setError(err.response?.data?.detail || "İstatistikler yüklenemedi");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Aylık verileri hesapla
  const calculateMonthlyData = () => {
    const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
    const currentYear = new Date().getFullYear();
    
    const monthlyData = months.map((month, index) => {
      const moviesInMonth = movies.filter(movie => {
        const date = new Date(movie.izlenme_tarihi);
        return date.getFullYear() === currentYear && date.getMonth() === index;
      }).length;
      
      return { month, movies: moviesInMonth, series: 0 };
    });
    
    return monthlyData;
  };

  // Tür dağılımını hesapla
  const getTopGenres = () => {
    if (!genreStats || genreStats.genres.length === 0) {
      return [];
    }
    
    // İlk 5 türü al
    return genreStats.genres.slice(0, 5).map((genre, index) => ({
      name: genre.name,
      count: genre.count,
      color: GENRE_COLORS[index % GENRE_COLORS.length]
    }));
  };

  // Bu hafta verileri
  const getThisWeekStats = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const moviesThisWeek = movies.filter(movie => {
      const date = new Date(movie.izlenme_tarihi);
      return date >= oneWeekAgo;
    });
    
    const reviewsThisWeek = moviesThisWeek.filter(m => m.kisisel_puan).length;
    const hoursThisWeek = moviesThisWeek.length * 2; // Ortalama 2 saat
    
    return {
      movies: moviesThisWeek.length,
      series: 0,
      hours: hoursThisWeek,
      reviews: reviewsThisWeek
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        <span className="ml-2 text-gray-400">İstatistikler yükleniyor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">{error}</p>
      </div>
    );
  }

  const monthlyData = calculateMonthlyData();
  const topGenres = getTopGenres();
  const thisWeek = getThisWeekStats();
  const maxValue = Math.max(...monthlyData.map((d) => d.movies + d.series), 1);
  const totalHoursWatched = stats?.total_watch_hours || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-white mb-2">İstatistiklerim</h1>
        <p className="text-gray-400">İzleme alışkanlıklarını keşfet</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-900/40 to-purple-900/20 rounded-xl p-6 border border-purple-500/20">
          <Film className="w-8 h-8 text-purple-400 mb-3" />
          <div className="text-3xl text-white mb-1">
            {stats?.total_movies || 0}
          </div>
          <div className="text-gray-400">Toplam Film</div>
        </div>

        <div className="bg-gradient-to-br from-pink-900/40 to-pink-900/20 rounded-xl p-6 border border-pink-500/20">
          <Tv className="w-8 h-8 text-pink-400 mb-3" />
          <div className="text-3xl text-white mb-1">
            {stats?.total_series || 0}
          </div>
          <div className="text-gray-400">Toplam Dizi</div>
        </div>

        <div className="bg-gradient-to-br from-blue-900/40 to-blue-900/20 rounded-xl p-6 border border-blue-500/20">
          <Clock className="w-8 h-8 text-blue-400 mb-3" />
          <div className="text-3xl text-white mb-1">
            {totalHoursWatched.toLocaleString()}
          </div>
          <div className="text-gray-400">Saat İzlendi</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-900/20 rounded-xl p-6 border border-yellow-500/20">
          <Star className="w-8 h-8 text-yellow-400 mb-3" />
          <div className="text-3xl text-white mb-1">{stats?.average_rating?.toFixed(1) || '0.0'}</div>
          <div className="text-gray-400">Ortalama Puan</div>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-purple-500/10">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl text-white">Aylık İzleme Trendi</h2>
        </div>

        {/* Legend */}
        <div className="flex gap-6 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <span className="text-gray-300">Filmler</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-pink-500 rounded"></div>
            <span className="text-gray-300">Diziler</span>
          </div>
        </div>

        {/* Chart */}
        <div className="flex items-end justify-between gap-2 h-64">
          {monthlyData.map((data, index) => {
            const movieHeight = (data.movies / maxValue) * 100;
            const seriesHeight = (data.series / maxValue) * 100;

            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                {/* Bars */}
                <div className="w-full flex items-end justify-center gap-1 flex-1 mb-2">
                  <div
                    className="bg-purple-500 rounded-t hover:bg-purple-400 transition-all cursor-pointer w-1/2"
                    style={{ height: `${movieHeight}%` }}
                    title={`${data.movies} film`}
                  ></div>
                  <div
                    className="bg-pink-500 rounded-t hover:bg-pink-400 transition-all cursor-pointer w-1/2"
                    style={{ height: `${seriesHeight}%` }}
                    title={`${data.series} dizi`}
                  ></div>
                </div>
                {/* Label */}
                <div className="text-gray-400 text-sm">{data.month}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Genres */}
      <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-purple-500/10">
        <h2 className="text-2xl text-white mb-6">En Çok İzlenen Türler</h2>
        {topGenres.length > 0 ? (
          <div className="space-y-4">
            {topGenres.map((genre, index) => {
              const totalMovies = stats?.total_movies || 1;
              const percentage = (genre.count / totalMovies) * 100;

              return (
                <div key={index}>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">{genre.name}</span>
                    <span className="text-gray-400">
                      {genre.count} film ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${genre.color} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🎬</div>
            <p className="text-gray-400">Henüz izlenen film yok</p>
          </div>
        )}
      </div>

      {/* This Week Stats */}
      <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-xl p-6 border border-purple-500/20">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl text-white">Bu Hafta</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-4xl mb-2">
              {thisWeek.movies}
            </div>
            <div className="text-gray-400">Film İzlendi</div>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">
              {thisWeek.series}
            </div>
            <div className="text-gray-400">Dizi İzlendi</div>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">
              {thisWeek.hours}
            </div>
            <div className="text-gray-400">Saat</div>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">
              {thisWeek.reviews}
            </div>
            <div className="text-gray-400">İnceleme</div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-purple-500/10">
        <h2 className="text-2xl text-white mb-6">Rozetler</h2>
        {stats?.badges && stats.badges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.badges.map((badge, index) => {
              const getBadgeStyle = () => {
                switch (badge.rarity) {
                  case "legendary":
                    return "bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30";
                  case "rare":
                    return "bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30";
                  default:
                    return "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30";
                }
              };
              
              return (
                <div key={index} className={`p-4 rounded-xl border flex items-center gap-4 ${getBadgeStyle()}`}>
                  <div className="text-4xl">{badge.name.split(" ")[0]}</div>
                  <div>
                    <div className="text-white">{badge.name.split(" ").slice(1).join(" ")}</div>
                    <div className="text-gray-400 text-sm capitalize">{badge.rarity}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🏆</div>
            <p className="text-gray-400">Henüz rozet kazanmadınız. Film izlemeye devam edin!</p>
          </div>
        )}
      </div>

      {/* Fun Facts */}
      <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-xl p-6 border border-purple-500/20">
        <h2 className="text-2xl text-white mb-4">Eğlenceli İstatistikler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-black/20 rounded-lg p-4">
            <div className="text-purple-400 mb-2">🍿 Toplam İçerik</div>
            <div className="text-white">
              {(stats?.total_movies || 0) + (stats?.total_series || 0)} film ve dizi
              izledin
            </div>
          </div>
          <div className="bg-black/20 rounded-lg p-4">
            <div className="text-pink-400 mb-2">⏰ Zaman</div>
            <div className="text-white">
              {Math.floor(totalHoursWatched / 24)} gün sinemada geçirdin
            </div>
          </div>
          <div className="bg-black/20 rounded-lg p-4">
            <div className="text-blue-400 mb-2">🌟 Ortalama</div>
            <div className="text-white">
              Günde ortalama 2.3 saat izliyorsun
            </div>
          </div>
          <div className="bg-black/20 rounded-lg p-4">
            <div className="text-green-400 mb-2">🏆 Sıralama</div>
            <div className="text-white">
              Kullanıcıların en aktif %5'indesin!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
