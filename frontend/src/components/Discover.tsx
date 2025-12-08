import { useState } from "react";
import { Link } from "react-router";
import { Search, Filter, Star, Clock, Tv } from "lucide-react";
import { movies } from "../utils/mockData";

export function Discover() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "movie" | "series" | "anime">("all");

  const filteredMovies = movies.filter((movie) => {
    const matchesSearch = movie.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType =
      filterType === "all" || movie.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-white mb-2">Keşfet</h1>
        <p className="text-gray-400">
          Film ve dizileri keşfet, puanla ve arkadaşlarınla paylaş
        </p>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Film veya dizi ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/50 border border-purple-500/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
          />
        </div>

        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterType("all")}
              className={`px-5 py-2.5 rounded-lg transition-all shadow-sm hover:scale-105 ${
                filterType === "all"
                  ? "bg-purple-500 text-white shadow-purple-500/50"
                  : "bg-slate-900/50 text-gray-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setFilterType("movie")}
              className={`px-5 py-2.5 rounded-lg transition-all shadow-sm hover:scale-105 ${
                filterType === "movie"
                  ? "bg-purple-500 text-white shadow-purple-500/50"
                  : "bg-slate-900/50 text-gray-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              Filmler
            </button>
            <button
              onClick={() => setFilterType("series")}
              className={`px-5 py-2.5 rounded-lg transition-all shadow-sm hover:scale-105 ${
                filterType === "series"
                  ? "bg-purple-500 text-white shadow-purple-500/50"
                  : "bg-slate-900/50 text-gray-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              Diziler
            </button>
            <button
              onClick={() => setFilterType("anime")}
              className={`px-5 py-2.5 rounded-lg transition-all shadow-sm hover:scale-105 ${
                filterType === "anime"
                  ? "bg-purple-500 text-white shadow-purple-500/50"
                  : "bg-slate-900/50 text-gray-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              Animeler
            </button>
          </div>
        </div>
      </div>

      {/* Movies Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredMovies.map((movie) => (
          <Link
            key={movie.id}
            to={`/movie/${movie.id}`}
            className="group"
          >
            <div className="relative overflow-hidden rounded-xl bg-slate-900/50 border border-purple-500/10 hover:border-purple-500/30 transition-all">
              {/* Poster */}
              <div className="aspect-[2/3] overflow-hidden">
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Type Badge */}
              <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                {movie.type === "series" ? (
                  <>
                    <Tv className="w-3 h-3 text-purple-400" />
                    <span className="text-xs text-purple-400">Dizi</span>
                  </>
                ) : movie.type === "anime" ? (
                  <>
                    <span className="text-xs text-pink-400">🎌 Anime</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 text-blue-400" />
                    <span className="text-xs text-blue-400">Film</span>
                  </>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="text-white mb-1 line-clamp-1 group-hover:text-purple-400 transition-colors">
                  {movie.title}
                </h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{movie.year}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-yellow-400">{movie.rating}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {movie.genre.slice(0, 2).map((genre, index) => (
                    <span
                      key={index}
                      className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredMovies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">Sonuç bulunamadı</p>
        </div>
      )}
    </div>
  );
}