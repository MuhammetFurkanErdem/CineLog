import { useState } from "react";
import { useParams, Link } from "react-router";
import {
  Star,
  Heart,
  Bookmark,
  Clock,
  Calendar,
  Tv,
  Share2,
  ThumbsUp,
} from "lucide-react";
import {
  getMovieById,
  getReviewsByMovieId,
  getUserById,
} from "../utils/mockData";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

export function MovieDetail() {
  const { movieId } = useParams();
  const movie = getMovieById(movieId || "");
  const movieReviews = getReviewsByMovieId(movieId || "");

  const [userRating, setUserRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isWatched, setIsWatched] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  if (!movie) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Film bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900/50 border border-purple-500/10">
        <div className="md:flex gap-6 p-6">
          {/* Poster */}
          <div className="flex-shrink-0 mb-4 md:mb-0">
            <img
              src={movie.poster}
              alt={movie.title}
              className="w-full md:w-64 rounded-xl object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-4xl text-white mb-2">{movie.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-gray-400">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{movie.year}</span>
                </div>
                {movie.runtime && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{movie.runtime} dk</span>
                  </div>
                )}
                {movie.seasons && (
                  <div className="flex items-center gap-1">
                    <Tv className="w-4 h-4" />
                    <span>{movie.seasons} Sezon</span>
                  </div>
                )}
                {movie.episodes && (
                  <div className="flex items-center gap-1">
                    <Tv className="w-4 h-4" />
                    <span>{movie.episodes} Bölüm</span>
                  </div>
                )}
                {movie.type === "anime" && (
                  <div className="flex items-center gap-1">
                    <span className="text-pink-400">🎌 Anime</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-yellow-400 text-lg">
                    {movie.rating}
                  </span>
                </div>
              </div>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2">
              {movie.genre.map((genre, index) => (
                <span
                  key={index}
                  className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-lg border border-purple-500/30"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Description */}
            <p className="text-gray-300 leading-relaxed">{movie.description}</p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setIsWatched(!isWatched)}
                className={`px-7 py-3.5 rounded-xl transition-all shadow-md hover:scale-105 ${
                  isWatched
                    ? "bg-green-500 text-white shadow-green-500/50"
                    : "bg-slate-800/50 text-gray-300 hover:bg-slate-700/50"
                }`}
              >
                {isWatched ? "✓ İzlendi" : "İzledim"}
              </button>
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`px-7 py-3.5 rounded-xl transition-all flex items-center gap-2 shadow-md hover:scale-105 ${
                  isFavorite
                    ? "bg-pink-500 text-white shadow-pink-500/50"
                    : "bg-slate-800/50 text-gray-300 hover:bg-slate-700/50"
                }`}
              >
                <Heart
                  className={`w-5 h-5 ${isFavorite ? "fill-white" : ""}`}
                />
                Favorilerim
              </button>
              <button
                onClick={() => setIsInWatchlist(!isInWatchlist)}
                className={`px-7 py-3.5 rounded-xl transition-all flex items-center gap-2 shadow-md hover:scale-105 ${
                  isInWatchlist
                    ? "bg-blue-500 text-white shadow-blue-500/50"
                    : "bg-slate-800/50 text-gray-300 hover:bg-slate-700/50"
                }`}
              >
                <Bookmark
                  className={`w-5 h-5 ${isInWatchlist ? "fill-white" : ""}`}
                />
                İzleme Listesi
              </button>
              <button className="px-7 py-3.5 rounded-xl bg-slate-800/50 text-gray-300 hover:bg-slate-700/50 transition-all flex items-center gap-2 shadow-md hover:scale-105">
                <Share2 className="w-5 h-5" />
                Paylaş
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Section */}
      <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-purple-500/10">
        <h2 className="text-2xl text-white mb-4">Puanını Ver</h2>
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
            <button
              key={rating}
              onMouseEnter={() => setHoveredRating(rating)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setUserRating(rating)}
              className="group relative"
            >
              <Star
                className={`w-8 h-8 transition-all ${
                  rating <= (hoveredRating || userRating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-600"
                }`}
              />
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-sm text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                {rating}
              </span>
            </button>
          ))}
        </div>
        {userRating > 0 && (
          <div className="mt-8">
            <p className="text-purple-400">
              Puanın: <span className="text-2xl">{userRating}/10</span>
            </p>
          </div>
        )}
      </div>

      {/* Review Section */}
      <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-purple-500/10">
        <h2 className="text-2xl text-white mb-4">
          İnceleme Yaz
        </h2>
        {!showReviewForm ? (
          <button
            onClick={() => setShowReviewForm(true)}
            className="w-full py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-xl transition-all border border-purple-500/30"
          >
            + İnceleme Ekle
          </button>
        ) : (
          <div className="space-y-4">
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Düşüncelerini paylaş..."
              className="w-full h-32 bg-slate-800/50 border border-purple-500/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
            />
            <div className="flex gap-3">
              <button className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all">
                Paylaş
              </button>
              <button
                onClick={() => setShowReviewForm(false)}
                className="px-6 py-3 bg-slate-800/50 hover:bg-slate-700/50 text-gray-300 rounded-xl transition-all"
              >
                İptal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        <h2 className="text-2xl text-white">
          İncelemeler ({movieReviews.length})
        </h2>
        {movieReviews.map((review) => {
          const user = getUserById(review.userId);
          if (!user) return null;

          return (
            <div
              key={review.id}
              className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-purple-500/10"
            >
              <div className="flex items-start gap-4">
                <Link to={`/profile/${user.id}`}>
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-500/30"
                  />
                </Link>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Link
                      to={`/profile/${user.id}`}
                      className="text-white hover:text-purple-400 transition-colors"
                    >
                      {user.name}
                    </Link>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-yellow-400">{review.rating}/10</span>
                    </div>
                    <span className="text-gray-600 text-sm ml-auto">
                      {formatDistanceToNow(new Date(review.createdAt), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </span>
                  </div>
                  <p className="text-gray-300 mb-3">{review.comment}</p>
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1 text-gray-400 hover:text-pink-400 transition-colors">
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-sm">{review.likes}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}