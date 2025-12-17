import { useState, useEffect, useMemo } from "react";
import { TrendingUp, Calendar, Clock, Film, Tv, Star } from "lucide-react";
import { getUserLibrary, LibraryItem } from "../../utils/storage";

export function Stats() {
  const [refreshKey, setRefreshKey] = useState(0);

  // localStorage'dan library'yi al
  const library = useMemo<LibraryItem[]>(() => {
    return getUserLibrary();
  }, [refreshKey]);

  // localStorage değişikliklerini dinle
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // İstatistikleri hesapla
  const stats = useMemo(() => {
    const watchedItems = library.filter((item) => item.watched);
    const totalMovies = watchedItems.filter((item) => item.type === "movie").length;
    const totalSeries = watchedItems.filter((item) => item.type === "series").length;
    const totalAnimes = watchedItems.filter((item) => item.type === "anime").length;
    
    // Ortalama rating hesapla
    const ratedItems = library.filter(item => item.rating);
    const avgRating = ratedItems.length > 0 
      ? ratedItems.reduce((sum, item) => sum + (item.rating || 0), 0) / ratedItems.length 
      : 0;

    // Toplam saat (ortalama film 2 saat, dizi bölümü 45 dk, anime 24 dk)
    const movieHours = totalMovies * 2;
    const seriesHours = totalSeries * 0.75;
    const animeHours = totalAnimes * 0.4;
    const totalHours = Math.round(movieHours + seriesHours + animeHours);

    return {
      total_movies: totalMovies,
      total_series: totalSeries,
      total_anime: totalAnimes,
      total_watch_hours: totalHours,
      average_rating: avgRating,
      total_favorites: library.filter((item) => item.favorite).length,
      total_watchlist: library.filter((item) => item.watchlist).length,
    };
  }, [library]);

  // Dinamik rozetler hesapla
  const calculatedBadges = useMemo(() => {
    const badges: { name: string; rarity: "legendary" | "rare" | "common" }[] = [];
    const totalWatched = stats.total_movies + stats.total_series + stats.total_anime;

    if (stats.total_movies >= 100) badges.push({ name: "🎬 Film Ustası", rarity: "legendary" });
    else if (stats.total_movies >= 50) badges.push({ name: "🎬 Sinefil", rarity: "rare" });
    else if (stats.total_movies >= 10) badges.push({ name: "🎬 Film Sever", rarity: "common" });

    if (stats.total_series >= 50) badges.push({ name: "📺 Dizi Kralı", rarity: "legendary" });
    else if (stats.total_series >= 20) badges.push({ name: "📺 Dizi Bağımlısı", rarity: "rare" });
    else if (stats.total_series >= 5) badges.push({ name: "📺 Dizi Takipçisi", rarity: "common" });

    if (stats.total_anime >= 50) badges.push({ name: "🎌 Otaku", rarity: "legendary" });
    else if (stats.total_anime >= 20) badges.push({ name: "🎌 Anime Tutkunu", rarity: "rare" });
    else if (stats.total_anime >= 5) badges.push({ name: "🎌 Anime Sever", rarity: "common" });

    if (totalWatched >= 200) badges.push({ name: "🏆 Efsane İzleyici", rarity: "legendary" });
    else if (totalWatched >= 100) badges.push({ name: "🏆 Uzman İzleyici", rarity: "rare" });
    else if (totalWatched >= 25) badges.push({ name: "🏆 Aktif İzleyici", rarity: "common" });

    if (totalWatched === 0) badges.push({ name: "🌟 Yeni Üye", rarity: "common" });

    return badges;
  }, [stats]);

  // Aylık verileri hesapla
  const calculateMonthlyData = () => {
    const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
    const currentYear = new Date().getFullYear();
    
    const monthlyData = months.map((month, index) => {
      const itemsInMonth = library.filter(item => {
        const date = new Date(item.timestamp);
        return date.getFullYear() === currentYear && date.getMonth() === index && item.watched;
      });
      const moviesInMonth = itemsInMonth.filter(i => i.type === 'movie').length;
      const seriesInMonth = itemsInMonth.filter(i => i.type === 'series' || i.type === 'anime').length;
      
      return { month, movies: moviesInMonth, series: seriesInMonth };
    });
    
    return monthlyData;
  };

  // Bu hafta verileri
  const getThisWeekStats = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const itemsThisWeek = library.filter(item => {
      const date = new Date(item.timestamp);
      return date >= oneWeekAgo && item.watched;
    });
    
    const moviesThisWeek = itemsThisWeek.filter(i => i.type === 'movie').length;
    const seriesThisWeek = itemsThisWeek.filter(i => i.type === 'series' || i.type === 'anime').length;
    const hoursThisWeek = Math.round(moviesThisWeek * 2 + seriesThisWeek * 0.5);
    
    return {
      movies: moviesThisWeek,
      series: seriesThisWeek,
      hours: hoursThisWeek,
      reviews: 0
    };
  };

  const monthlyData = calculateMonthlyData();
  const thisWeek = getThisWeekStats();
  const maxValue = Math.max(...monthlyData.map((d) => d.movies + d.series), 1);

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
            {stats.total_movies}
          </div>
          <div className="text-gray-400">Toplam Film</div>
        </div>

        <div className="bg-gradient-to-br from-pink-900/40 to-pink-900/20 rounded-xl p-6 border border-pink-500/20">
          <Tv className="w-8 h-8 text-pink-400 mb-3" />
          <div className="text-3xl text-white mb-1">
            {stats.total_series + stats.total_anime}
          </div>
          <div className="text-gray-400">Toplam Dizi/Anime</div>
        </div>

        <div className="bg-gradient-to-br from-blue-900/40 to-blue-900/20 rounded-xl p-6 border border-blue-500/20">
          <Clock className="w-8 h-8 text-blue-400 mb-3" />
          <div className="text-3xl text-white mb-1">
            {stats.total_watch_hours.toLocaleString()}
          </div>
          <div className="text-gray-400">Saat İzlendi</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-900/20 rounded-xl p-6 border border-yellow-500/20">
          <Star className="w-8 h-8 text-yellow-400 mb-3" />
          <div className="text-3xl text-white mb-1">{stats.average_rating.toFixed(1)}</div>
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
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🎭</div>
          <p className="text-gray-400">Tür istatistikleri yakında eklenecek</p>
        </div>
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
        {calculatedBadges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {calculatedBadges.map((badge, index) => {
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
              {stats.total_movies + stats.total_series + stats.total_anime} film, dizi ve anime
              izledin
            </div>
          </div>
          <div className="bg-black/20 rounded-lg p-4">
            <div className="text-pink-400 mb-2">⏰ Zaman</div>
            <div className="text-white">
              {Math.floor(stats.total_watch_hours / 24)} gün sinemada geçirdin
            </div>
          </div>
          <div className="bg-black/20 rounded-lg p-4">
            <div className="text-blue-400 mb-2">❤️ Favoriler</div>
            <div className="text-white">
              {stats.total_favorites} içerik favorilerine eklendi
            </div>
          </div>
          <div className="bg-black/20 rounded-lg p-4">
            <div className="text-green-400 mb-2">📋 İzleme Listesi</div>
            <div className="text-white">
              {stats.total_watchlist} içerik izlemeyi bekliyor
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
