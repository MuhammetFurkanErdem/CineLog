import { useParams } from "react-router";
import { Settings, Film, Tv, Star, Award, Calendar } from "lucide-react";
import {
  currentUser,
  getUserById,
  movies,
  getActivitiesByUserId,
  getMovieById,
  Badge,
} from "../utils/mockData";

export function Profile() {
  const { userId } = useParams();
  const user = userId ? getUserById(userId) : currentUser;

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Kullanıcı bulunamadı</p>
      </div>
    );
  }

  const isOwnProfile = !userId || userId === currentUser.id;
  const userActivities = getActivitiesByUserId(user.id);
  const recentMovies = userActivities
    .slice(0, 6)
    .map((activity) => getMovieById(activity.movieId))
    .filter((movie) => movie !== undefined);

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
            src={user.avatar}
            alt={user.name}
            className="w-32 h-32 rounded-full object-cover ring-4 ring-purple-500/30"
          />

          {/* User Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl text-white mb-1">{user.name}</h1>
            <p className="text-gray-400 mb-3">@{user.username}</p>
            {user.bio && <p className="text-gray-300 mb-4">{user.bio}</p>}

            {/* Stats */}
            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm">
              <div>
                <span className="text-2xl text-purple-400">
                  {user.stats.movies}
                </span>
                <span className="text-gray-400 ml-2">Film</span>
              </div>
              <div>
                <span className="text-2xl text-pink-400">
                  {user.stats.series}
                </span>
                <span className="text-gray-400 ml-2">Dizi</span>
              </div>
              <div>
                <span className="text-2xl text-blue-400">
                  {user.stats.reviews}
                </span>
                <span className="text-gray-400 ml-2">İnceleme</span>
              </div>
              <div>
                <span className="text-2xl text-green-400">
                  {user.stats.followers}
                </span>
                <span className="text-gray-400 ml-2">Takipçi</span>
              </div>
              <div>
                <span className="text-2xl text-yellow-400">
                  {user.stats.following}
                </span>
                <span className="text-gray-400 ml-2">Takip</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {isOwnProfile && (
            <button className="px-8 py-3.5 bg-slate-800/50 hover:bg-slate-700/50 text-white rounded-xl transition-all flex items-center gap-2 shadow-lg hover:scale-105">
              <Settings className="w-5 h-5" />
              Düzenle
            </button>
          )}
          {!isOwnProfile && (
            <button className="px-8 py-3.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all shadow-lg hover:shadow-purple-500/50 hover:scale-105">
              Takip Et
            </button>
          )}
        </div>
      </div>

      {/* Badges */}
      {user.badges && user.badges.length > 0 && (
        <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-purple-500/10">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl text-white">Rozetler</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {user.badges.map((badge, index) => (
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
              <span className="text-purple-400">{user.stats.movies}</span>
            </div>
            <div className="flex justify-between">
              <span>Bu Ay:</span>
              <span className="text-purple-400">
                {Math.floor(Math.random() * 20 + 10)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Bu Yıl:</span>
              <span className="text-purple-400">
                {Math.floor(Math.random() * 100 + 50)}
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
              <span className="text-pink-400">{user.stats.series}</span>
            </div>
            <div className="flex justify-between">
              <span>Devam Eden:</span>
              <span className="text-pink-400">
                {Math.floor(Math.random() * 10 + 3)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tamamlanan:</span>
              <span className="text-pink-400">
                {user.stats.series - Math.floor(Math.random() * 10 + 3)}
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
              {(Math.random() * 2 + 7).toFixed(1)}
            </div>
            <div className="text-gray-400">
              {user.stats.reviews} inceleme
            </div>
          </div>
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
                <p className="text-white text-sm mt-2 line-clamp-1">
                  {movie.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

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
              {Math.floor(Math.random() * 100 + 50)}
            </div>
            <div className="text-gray-400 text-sm">İzlenen Film</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-1">⏱️</div>
            <div className="text-2xl text-pink-400">
              {Math.floor(Math.random() * 200 + 100)}
            </div>
            <div className="text-gray-400 text-sm">Saat</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-1">🌟</div>
            <div className="text-2xl text-blue-400">
              {user.stats.reviews}
            </div>
            <div className="text-gray-400 text-sm">İnceleme</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-1">🏆</div>
            <div className="text-2xl text-green-400">
              {user.badges.length}
            </div>
            <div className="text-gray-400 text-sm">Rozet</div>
          </div>
        </div>
      </div>
    </div>
  );
}