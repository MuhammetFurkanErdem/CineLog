import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Search, Filter, Star, Clock, Tv, Loader2 } from "lucide-react";
import { movieService } from "../../utils/api";

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  overview: string;
  vote_average: number;
}

export function Discover() {
  const [searchQuery, setSearchQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "movies" | "series" | "anime">("all");
  const [sortBy, setSortBy] = useState<"popular" | "rating_high" | "rating_low">("popular");

  // Sayfa yüklendiğinde popüler filmleri getir
  useEffect(() => {
    loadPopularMovies();
  }, []);

  const loadPopularMovies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await movieService.getPopularMovies();
      setMovies(data);
    } catch (err: any) {
      console.error("Error loading popular movies:", err);
      setError("Filmler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadPopularMovies();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await movieService.searchMovies(searchQuery);
      setMovies(data);
    } catch (err: any) {
      console.error("Error searching movies:", err);
      setError("Arama yapılamadı");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-white mb-2">Keşfet</h1>
        <p className="text-gray-400">
          Film ve dizileri keşfet, puanla ve listenize ekleyin
        </p>
      </div>

      {/* Search */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Film veya dizi ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full bg-slate-900/50 border border-purple-500/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                loadPopularMovies();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {/* Sort Dropdown */}
          <div className="relative">
            <button 
              className="px-4 py-2.5 bg-slate-800/50 text-gray-300 rounded-xl font-medium whitespace-nowrap hover:bg-slate-700/50 transition-colors flex items-center gap-2"
              onClick={() => {
                const options = ["popular", "rating_high", "rating_low"] as const;
                const currentIndex = options.indexOf(sortBy);
                const nextIndex = (currentIndex + 1) % options.length;
                setSortBy(options[nextIndex]);
              }}
            >
              <Filter className="w-4 h-4" />
              {sortBy === "popular" && "Popüler"}
              {sortBy === "rating_high" && "En Yüksek Puan"}
              {sortBy === "rating_low" && "En Düşük Puan"}
            </button>
          </div>

          {/* Category Filters */}
          <button 
            onClick={() => setActiveFilter("all")}
            className={`px-6 py-2.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
              activeFilter === "all" 
                ? "bg-purple-500 text-white" 
                : "bg-slate-800/50 text-gray-300 hover:bg-slate-700/50"
            }`}
          >
            Tümü
          </button>
          <button 
            onClick={() => setActiveFilter("movies")}
            className={`px-6 py-2.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
              activeFilter === "movies" 
                ? "bg-purple-500 text-white" 
                : "bg-slate-800/50 text-gray-300 hover:bg-slate-700/50"
            }`}
          >
            Filmler
          </button>
          <button 
            onClick={() => setActiveFilter("series")}
            className={`px-6 py-2.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
              activeFilter === "series" 
                ? "bg-purple-500 text-white" 
                : "bg-slate-800/50 text-gray-300 hover:bg-slate-700/50"
            }`}
          >
            Diziler
          </button>
          <button 
            onClick={() => setActiveFilter("anime")}
            className={`px-6 py-2.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
              activeFilter === "anime" 
                ? "bg-purple-500 text-white" 
                : "bg-slate-800/50 text-gray-300 hover:bg-slate-700/50"
            }`}
          >
            Animeler
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Movies Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {movies
            .sort((a, b) => {
              if (sortBy === "rating_high") return b.vote_average - a.vote_average;
              if (sortBy === "rating_low") return a.vote_average - b.vote_average;
              return 0; // popular (default TMDB order)
            })
            .map((movie) => (
            <Link
              key={movie.id}
              to={`/movie/${movie.id}`}
              className="group"
            >
              <div className="relative overflow-hidden rounded-xl bg-slate-900/50 border border-purple-500/10 hover:border-purple-500/30 transition-all hover:scale-105 duration-300">
                {/* Poster */}
                <div className="aspect-[2/3] overflow-hidden bg-slate-800/50">
                  {movie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <Clock className="w-12 h-12" />
                    </div>
                  )}
                </div>

                {/* Rating Badge */}
                <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs text-yellow-400 font-semibold">
                    {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
                  </span>
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="text-white mb-1 line-clamp-2 group-hover:text-purple-400 transition-colors font-medium">
                    {movie.title}
                  </h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">
                      {movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && !error && movies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">Sonuç bulunamadı</p>
        </div>
      )}
    </div>
  );
}