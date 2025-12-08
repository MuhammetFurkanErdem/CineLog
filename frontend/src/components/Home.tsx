import { Link } from "react-router";
import { Heart, MessageCircle, Star, Clock } from "lucide-react";
import {
  currentUser,
  activities,
  getUserById,
  getMovieById,
  Badge,
} from "../utils/mockData";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

export function Home() {
  const getBadgeStyle = (rarity: Badge["rarity"]) => {
    switch (rarity) {
      case "legendary":
        return "bg-gradient-to-br from-yellow-500/30 to-amber-600/30 border-yellow-500/50 text-yellow-300 shadow-yellow-500/20 shadow-lg";
      case "rare":
        return "bg-gradient-to-br from-purple-500/25 to-pink-500/25 border-purple-400/40 text-purple-200 shadow-purple-500/15 shadow-md";
      case "common":
        return "bg-gradient-to-br from-slate-600/25 to-slate-700/25 border-slate-500/40 text-slate-300 shadow-slate-500/10 shadow-sm";
    }
  };

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
            Merhaba, {currentUser.name.split(" ")[0]}! 👋
          </h1>
          <p className="text-gray-300">
            Bu hafta {Math.floor(Math.random() * 8 + 3)} film izledin. Harika
            gidiyorsun!
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 backdrop-blur rounded-xl p-4 border border-purple-500/10">
          <div className="text-3xl mb-2 text-purple-400">
            {currentUser.stats.movies}
          </div>
          <div className="text-gray-400 text-sm">Film</div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur rounded-xl p-4 border border-purple-500/10">
          <div className="text-3xl mb-2 text-pink-400">
            {currentUser.stats.series}
          </div>
          <div className="text-gray-400 text-sm">Dizi</div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur rounded-xl p-4 border border-purple-500/10">
          <div className="text-3xl mb-2 text-blue-400">
            {currentUser.stats.reviews}
          </div>
          <div className="text-gray-400 text-sm">İnceleme</div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur rounded-xl p-4 border border-purple-500/10">
          <div className="text-3xl mb-2 text-green-400">
            {currentUser.stats.followers}
          </div>
          <div className="text-gray-400 text-sm">Takipçi</div>
        </div>
      </div>

      {/* Badges */}
      <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-purple-500/10">
        <h2 className="text-xl text-white mb-4">Rozetlerim</h2>
        <div className="flex flex-wrap gap-3">
          {currentUser.badges.map((badge, index) => (
            <div
              key={index}
              className={`px-4 py-2.5 rounded-lg border transition-transform hover:scale-105 ${getBadgeStyle(
                badge.rarity
              )}`}
            >
              {badge.name}
            </div>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="space-y-4">
        <h2 className="text-2xl text-white">Arkadaş Aktiviteleri</h2>
        {activities.map((activity) => {
          const user = getUserById(activity.userId);
          const movie = getMovieById(activity.movieId);

          if (!user || !movie) return null;

          return (
            <div
              key={activity.id}
              className="bg-slate-900/50 backdrop-blur rounded-xl p-4 border border-purple-500/10 hover:border-purple-500/30 transition-all"
            >
              <div className="flex gap-4">
                {/* User Avatar */}
                <Link to={`/profile/${user.id}`}>
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-500/30"
                  />
                </Link>

                <div className="flex-1">
                  {/* Activity Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <Link
                      to={`/profile/${user.id}`}
                      className="text-white hover:text-purple-400 transition-colors"
                    >
                      {user.name}
                    </Link>
                    <span className="text-gray-500">
                      {activity.type === "watched" && "izledi"}
                      {activity.type === "review" && "inceleme yazdı"}
                      {activity.type === "rating" && "puanladı"}
                    </span>
                    <span className="text-gray-600 text-sm ml-auto">
                      {formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </span>
                  </div>

                  {/* Movie Info */}
                  <div className="flex gap-3">
                    <Link to={`/movie/${movie.id}`}>
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        className="w-16 h-24 object-cover rounded-lg"
                      />
                    </Link>
                    <div className="flex-1">
                      <Link
                        to={`/movie/${movie.id}`}
                        className="text-white hover:text-purple-400 transition-colors"
                      >
                        {movie.title}
                      </Link>
                      <div className="text-gray-400 text-sm">
                        {movie.year} • {movie.genre.join(", ")}
                      </div>
                      {activity.rating && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-yellow-400">
                            {activity.rating}/10
                          </span>
                        </div>
                      )}
                      {activity.comment && (
                        <p className="text-gray-300 mt-2 text-sm">
                          "{activity.comment}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-6 mt-3 text-gray-400">
                    <button className="flex items-center gap-2 hover:text-pink-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-pink-500/10">
                      <Heart className="w-5 h-5" />
                      <span className="text-sm">
                        {Math.floor(Math.random() * 20 + 5)}
                      </span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-blue-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-500/10">
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm">
                        {Math.floor(Math.random() * 10)}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
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