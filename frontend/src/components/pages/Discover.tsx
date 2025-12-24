import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Search, Filter, Star, Clock, Tv, Film, Loader2 } from "lucide-react";
import { unifiedSearchAPI, UnifiedMedia } from "../../utils/api";

type TabType = "movie" | "series" | "anime";

export function Discover() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("movie");
  const [results, setResults] = useState<UnifiedMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"popular" | "rating_high" | "rating_low">("popular");

  // Fetch data based on activeTab and searchQuery
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let data: UnifiedMedia[] = [];

        switch (activeTab) {
          case "movie":
            data = await unifiedSearchAPI.searchMovies(searchQuery);
            break;
          case "series":
            data = await unifiedSearchAPI.searchSeries(searchQuery);
            break;
          case "anime":
            data = await unifiedSearchAPI.searchAnime(searchQuery);
            break;
        }

        setResults(data);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError("İçerik yüklenemedi. Lütfen tekrar deneyin.");
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search
    const timer = setTimeout(() => {
      fetchData();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab]);

  // Sort results based on sortBy state
  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === "rating_high") return b.rating - a.rating;
    if (sortBy === "rating_low") return a.rating - b.rating;
    return 0; // Popular (default API order)
  });

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setResults([]); // Clear results when switching tabs
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const getTabConfig = (tab: TabType) => {
    const configs = {
      movie: { label: "Filmler", icon: Film },
      series: { label: "Diziler", icon: Tv },
      anime: { label: "Animeler", icon: Star },
    };
    return configs[tab];
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl text-white mb-1 sm:mb-2">Keşfet</h1>
        <p className="text-gray-400 text-sm sm:text-base">
          Film, dizi ve anime keşfet, puanla ve listenize ekleyin
        </p>
      </div>

      {/* Search */}
      <div className="space-y-3 sm:space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={`${getTabConfig(activeTab).label} ara...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/50 border border-purple-500/20 rounded-xl pl-10 sm:pl-12 pr-4 py-2 sm:py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
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

          {/* Category Tabs */}
          {(["movie", "series", "anime"] as TabType[]).map((tab) => {
            const config = getTabConfig(tab);
            const Icon = config.icon;
            return (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium whitespace-nowrap transition-all flex items-center gap-1.5 sm:gap-2 ${
                  activeTab === tab
                    ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                    : "bg-slate-800/50 text-gray-300 hover:bg-slate-700/50"
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          <span className="ml-3 text-gray-400">Yükleniyor...</span>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="text-center py-12">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Results Grid - Unified Design for All Types */}
      {!isLoading && !error && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {sortedResults.map((item) => (
            <Link
              key={item.id}
              to={
                item.type === "movie"
                  ? `/movie/${item.id}`
                  : item.type === "series"
                  ? `/series/${item.id}`
                  : `/anime/${item.id}`
              }
              className="group"
            >
              <div className="relative overflow-hidden rounded-xl bg-slate-900/50 border border-purple-500/10 hover:border-purple-500/30 transition-all hover:scale-105 duration-300">
                {/* Poster */}
                <div className="aspect-[2/3] overflow-hidden bg-slate-800/50">
                  {item.posterUrl && item.posterUrl !== "/placeholder-movie.png" ? (
                    <img
                      src={item.posterUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      {item.type === "movie" && <Film className="w-12 h-12" />}
                      {item.type === "series" && <Tv className="w-12 h-12" />}
                      {item.type === "anime" && <Star className="w-12 h-12" />}
                    </div>
                  )}
                </div>

                {/* Rating Badge */}
                {item.rating > 0 && (
                  <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-yellow-400 font-semibold">
                      {item.rating.toFixed(1)}
                    </span>
                  </div>
                )}

                {/* Type Badge */}
                <div className="absolute top-2 left-2 bg-purple-500/90 backdrop-blur-sm px-2 py-1 rounded-lg">
                  <span className="text-xs text-white font-semibold uppercase">
                    {item.type === "movie" && "Film"}
                    {item.type === "series" && "Dizi"}
                    {item.type === "anime" && "Anime"}
                  </span>
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="text-white mb-1 line-clamp-2 group-hover:text-purple-400 transition-colors font-medium leading-tight">
                    {item.title}
                  </h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{item.year}</span>
                    {item.episodes && item.episodes > 0 && (
                      <span className="text-gray-500 text-xs">
                        {item.episodes} ep
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && sortedResults.length === 0 && (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">Sonuç bulunamadı</p>
          <p className="text-gray-500 text-sm">
            {searchQuery 
              ? "Farklı anahtar kelimeler deneyin" 
              : `${getTabConfig(activeTab).label} aramak için yukarıdaki arama kutusunu kullanın`}
          </p>
        </div>
      )}
    </div>
  );
}