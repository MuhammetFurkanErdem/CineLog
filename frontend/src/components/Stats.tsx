import { TrendingUp, Calendar, Clock, Film, Tv, Star } from "lucide-react";
import { currentUser, movies } from "../utils/mockData";

export function Stats() {
  const monthlyData = [
    { month: "Oca", movies: 12, series: 3 },
    { month: "Şub", movies: 15, series: 4 },
    { month: "Mar", movies: 18, series: 5 },
    { month: "Nis", movies: 14, series: 3 },
    { month: "May", movies: 20, series: 6 },
    { month: "Haz", movies: 16, series: 4 },
    { month: "Tem", movies: 22, series: 7 },
    { month: "Ağu", movies: 19, series: 5 },
    { month: "Eyl", movies: 17, series: 4 },
    { month: "Eki", movies: 21, series: 6 },
    { month: "Kas", movies: 18, series: 5 },
    { month: "Ara", movies: 16, series: 4 },
  ];

  const totalHoursWatched = Math.floor(
    (currentUser.stats.movies * 120 + currentUser.stats.series * 45 * 10) / 60
  );

  const topGenres = [
    { name: "Bilim-Kurgu", count: 78, color: "bg-purple-500" },
    { name: "Drama", count: 65, color: "bg-pink-500" },
    { name: "Aksiyon", count: 52, color: "bg-blue-500" },
    { name: "Gerilim", count: 43, color: "bg-green-500" },
    { name: "Komedi", count: 38, color: "bg-yellow-500" },
  ];

  const maxValue = Math.max(...monthlyData.map((d) => d.movies + d.series));

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
            {currentUser.stats.movies}
          </div>
          <div className="text-gray-400">Toplam Film</div>
        </div>

        <div className="bg-gradient-to-br from-pink-900/40 to-pink-900/20 rounded-xl p-6 border border-pink-500/20">
          <Tv className="w-8 h-8 text-pink-400 mb-3" />
          <div className="text-3xl text-white mb-1">
            {currentUser.stats.series}
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
          <div className="text-3xl text-white mb-1">8.2</div>
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
        <div className="space-y-4">
          {topGenres.map((genre, index) => {
            const percentage = (genre.count / currentUser.stats.movies) * 100;

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
              {Math.floor(Math.random() * 10 + 5)}
            </div>
            <div className="text-gray-400">Film İzlendi</div>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">
              {Math.floor(Math.random() * 5 + 2)}
            </div>
            <div className="text-gray-400">Dizi İzlendi</div>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">
              {Math.floor(Math.random() * 20 + 10)}
            </div>
            <div className="text-gray-400">Saat</div>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">
              {Math.floor(Math.random() * 10 + 5)}
            </div>
            <div className="text-gray-400">İnceleme</div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-purple-500/10">
        <h2 className="text-2xl text-white mb-6">Son Başarılar</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-4 rounded-xl border border-purple-500/30 flex items-center gap-4">
            <div className="text-4xl">🎬</div>
            <div>
              <div className="text-white">Sinefil</div>
              <div className="text-gray-400 text-sm">100+ film izlendi</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-4 rounded-xl border border-blue-500/30 flex items-center gap-4">
            <div className="text-4xl">📺</div>
            <div>
              <div className="text-white">Dizi Uzmanı</div>
              <div className="text-gray-400 text-sm">50+ dizi tamamlandı</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-4 rounded-xl border border-yellow-500/30 flex items-center gap-4">
            <div className="text-4xl">✍️</div>
            <div>
              <div className="text-white">Eleştirmen</div>
              <div className="text-gray-400 text-sm">100+ inceleme yazıldı</div>
            </div>
          </div>
        </div>
      </div>

      {/* Fun Facts */}
      <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-xl p-6 border border-purple-500/20">
        <h2 className="text-2xl text-white mb-4">Eğlenceli İstatistikler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-black/20 rounded-lg p-4">
            <div className="text-purple-400 mb-2">🍿 Toplam İçerik</div>
            <div className="text-white">
              {currentUser.stats.movies + currentUser.stats.series} film ve dizi
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
