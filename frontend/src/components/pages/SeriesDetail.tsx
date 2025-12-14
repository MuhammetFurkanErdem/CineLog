import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import {
  Star,
  Heart,
  Bookmark,
  Share2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Calendar,
  Tv,
  Clock,
  Check,
} from "lucide-react";
import { toggleInteraction, getItemStatus } from "../../utils/storage";

interface TVShowData {
  id: number;
  name: string;
  status: string;
  premiered?: string;
  ended?: string;
  network?: { name: string; country?: { name: string } };
  rating?: { average: number };
  genres: string[];
  summary: string;
  language?: string;
  runtime?: number;
  image?: { medium: string; original: string };
  _embedded?: {
    cast: Array<{
      person: { id: number; name: string; image?: { medium: string } };
      character: { id: number; name: string; image?: { medium: string } };
    }>;
    episodes: Array<{
      id: number;
      name: string;
      season: number;
      number: number;
      airdate?: string;
      runtime?: number;
      summary?: string;
      image?: { medium: string };
    }>;
  };
}

export function SeriesDetail() {
  const { seriesId } = useParams();
  const [series, setSeries] = useState<TVShowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);

  // Interactive button states
  const [isWatched, setIsWatched] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isWatchlist, setIsWatchlist] = useState(false);

  useEffect(() => {
    const fetchSeriesData = async () => {
      if (!seriesId) return;

      setLoading(true);
      setError(null);

      try {
        // Extract numeric ID from "tv-123" format
        const numericId = seriesId.replace('tv-', '');
        
        const response = await fetch(
          `https://api.tvmaze.com/shows/${numericId}?embed[]=cast&embed[]=episodes`
        );

        if (!response.ok) {
          throw new Error(`TVMaze API error: ${response.status}`);
        }

        const data = await response.json();
        setSeries(data);

        // Load interaction status from localStorage
        const status = getItemStatus(`tv-${numericId}`);
        setIsWatched(status.isWatched);
        setIsFavorite(status.isFavorite);
        setIsWatchlist(status.isWatchlist);
      } catch (err: any) {
        console.error("Error fetching series:", err);
        setError("Dizi bilgileri yüklenemedi");
      } finally {
        setLoading(false);
      }
    };

    fetchSeriesData();
  }, [seriesId]);

  const handleShare = () => {
    if (navigator.share && series) {
      navigator.share({
        title: series.name,
        text: `${series.name} dizisini izle`,
        url: window.location.href,
      });
    }
  };

  const handleWatchedClick = () => {
    if (!series) return;
    const posterUrl = series.image?.original || series.image?.medium || "/placeholder-movie.png";
    const premiereYear = series.premiered ? new Date(series.premiered).getFullYear() : undefined;
    
    const newState = toggleInteraction(
      {
        id: `tv-${series.id}`,
        type: 'series',
        title: series.name,
        poster: posterUrl,
        year: premiereYear,
        rating: series.rating?.average,
      },
      'watched'
    );
    setIsWatched(newState);
  };

  const handleFavoriteClick = () => {
    if (!series) return;
    const posterUrl = series.image?.original || series.image?.medium || "/placeholder-movie.png";
    const premiereYear = series.premiered ? new Date(series.premiered).getFullYear() : undefined;
    
    const newState = toggleInteraction(
      {
        id: `tv-${series.id}`,
        type: 'series',
        title: series.name,
        poster: posterUrl,
        year: premiereYear,
        rating: series.rating?.average,
      },
      'favorite'
    );
    setIsFavorite(newState);
  };

  const handleWatchlistClick = () => {
    if (!series) return;
    const posterUrl = series.image?.original || series.image?.medium || "/placeholder-movie.png";
    const premiereYear = series.premiered ? new Date(series.premiered).getFullYear() : undefined;
    
    const newState = toggleInteraction(
      {
        id: `tv-${series.id}`,
        type: 'series',
        title: series.name,
        poster: posterUrl,
        year: premiereYear,
        rating: series.rating?.average,
      },
      'watchlist'
    );
    setIsWatchlist(newState);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        <span className="ml-2 text-gray-400">Dizi yükleniyor...</span>
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">{error || "Dizi bulunamadı"}</p>
        <Link
          to="/discover"
          className="mt-4 inline-block px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all"
        >
          Keşfet Sayfasına Dön
        </Link>
      </div>
    );
  }

  const posterUrl = series.image?.original || series.image?.medium || "/placeholder-movie.png";
  const premiereYear = series.premiered ? new Date(series.premiered).getFullYear() : null;

  // Group episodes by season
  const episodesBySeason = series._embedded?.episodes.reduce((acc, episode) => {
    if (!acc[episode.season]) {
      acc[episode.season] = [];
    }
    acc[episode.season].push(episode);
    return acc;
  }, {} as Record<number, typeof series._embedded.episodes>) || {};

  const seasons = Object.keys(episodesBySeason).map(Number).sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Poster */}
          <div className="flex-shrink-0 w-full md:w-[300px] space-y-4">
            <img
              src={posterUrl}
              alt={series.name}
              className="w-full rounded-xl object-cover shadow-2xl"
            />

            {/* Status Badge */}
            <div className="w-full">
              <div className={`px-4 py-3 rounded-lg text-center font-semibold ${
                series.status === "Running" 
                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                  : "bg-gray-500/20 text-gray-300 border border-gray-500/30"
              }`}>
                {series.status === "Running" ? "🔴 Devam Ediyor" : "✓ Tamamlandı"}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col space-y-5">
            
            {/* Title */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-2">
                {series.name}
              </h1>
              
              {/* Meta Data */}
              <div className="flex items-center gap-3 text-sm text-gray-400 flex-wrap">
                {premiereYear && (
                  <>
                    <span>{premiereYear}</span>
                    <span>•</span>
                  </>
                )}
                {series.network?.name && (
                  <>
                    <span>{series.network.name}</span>
                    <span>•</span>
                  </>
                )}
                {series.runtime && (
                  <>
                    <span>{series.runtime} dk</span>
                    <span>•</span>
                  </>
                )}
                {series.rating?.average && (
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-yellow-400 font-medium">
                      {series.rating.average.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Genres */}
            {series.genres && series.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {series.genres.map((genre, idx) => (
                  <span
                    key={idx}
                    className="text-sm px-3 py-1 rounded-md bg-slate-800/50 text-gray-300 border border-slate-700/50"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleWatchedClick}
                title={isWatched ? "İzlendi" : "İzlendi Olarak İşaretle"}
                className={`p-2.5 rounded-lg transition-all border ${
                  isWatched
                    ? "bg-green-500/20 border-green-400/50 text-green-300"
                    : "bg-slate-800/30 border-slate-700 text-gray-400 hover:border-green-400/50 hover:text-green-400"
                }`}
              >
                {isWatched ? <Check className="w-5 h-5" /> : <Star className="w-5 h-5" />}
              </button>

              <button
                onClick={handleFavoriteClick}
                title={isFavorite ? "Favorilerde" : "Favorilere Ekle"}
                className={`p-2.5 rounded-lg transition-all border ${
                  isFavorite
                    ? "bg-pink-500/20 border-pink-400/50 text-pink-300"
                    : "bg-slate-800/30 border-slate-700 text-gray-400 hover:border-pink-400/50 hover:text-pink-400"
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>

              <button
                onClick={handleWatchlistClick}
                title={isWatchlist ? "Listede" : "İzleme Listesine Ekle"}
                className={`p-2.5 rounded-lg transition-all border ${
                  isWatchlist
                    ? "bg-blue-500/20 border-blue-400/50 text-blue-300"
                    : "bg-slate-800/30 border-slate-700 text-gray-400 hover:border-blue-400/50 hover:text-blue-400"
                }`}
              >
                <Bookmark className={`w-5 h-5 ${isWatchlist ? 'fill-current' : ''}`} />
              </button>

              <button
                onClick={handleShare}
                title="Paylaş"
                className="p-2.5 rounded-lg bg-slate-800/30 border border-slate-700 text-gray-400 hover:border-slate-600 hover:text-white transition-all"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Summary */}
            {series.summary && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ÖZET
                </h3>
                <p 
                  className="text-base text-gray-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: series.summary }}
                />
              </div>
            )}

            {/* Network Info */}
            {series.network && (
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Kanal:</span>
                  <span className="ml-2 text-white font-medium">{series.network.name}</span>
                </div>
                {series.network.country && (
                  <div>
                    <span className="text-gray-500">Ülke:</span>
                    <span className="ml-2 text-white font-medium">{series.network.country.name}</span>
                  </div>
                )}
              </div>
            )}

            {/* Cast */}
            {series._embedded?.cast && series._embedded.cast.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  OYUNCULAR
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                  {series._embedded.cast.slice(0, 12).map((castMember, idx) => (
                    <div key={idx} className="flex-shrink-0 text-center" style={{ width: '80px' }}>
                      {castMember.person?.image?.medium ? (
                        <img
                          src={castMember.person.image.medium}
                          alt={castMember.person.name}
                          className="w-14 h-14 rounded-full object-cover mx-auto mb-2 border-2 border-slate-700"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-2 border-2 border-slate-700">
                          <span className="text-gray-500 text-lg font-bold">
                            {castMember.person?.name?.charAt(0) || '?'}
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-white font-semibold leading-tight truncate" title={castMember.person?.name}>
                        {castMember.person?.name?.split(' ').slice(0, 2).join(' ')}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5" title={castMember.character?.name}>
                        {castMember.character?.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Episodes Section */}
      {seasons.length > 0 && (
        <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-purple-500/10">
          <button
            onClick={() => setShowEpisodes(!showEpisodes)}
            className="w-full flex items-center justify-between text-white hover:text-purple-400 transition-colors mb-4"
          >
            <h2 className="text-2xl font-semibold">
              Bölümler ({series._embedded?.episodes.length || 0})
            </h2>
            {showEpisodes ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
          </button>
          
          {showEpisodes && (
            <div className="space-y-4">
              {/* Season Selector */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {seasons.map((season) => (
                  <button
                    key={season}
                    onClick={() => setSelectedSeason(season)}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                      selectedSeason === season
                        ? "bg-purple-500 text-white"
                        : "bg-slate-800/50 text-gray-300 hover:bg-slate-700/50"
                    }`}
                  >
                    Sezon {season}
                  </button>
                ))}
              </div>

              {/* Episodes List */}
              <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {episodesBySeason[selectedSeason]?.map((episode) => (
                  <div 
                    key={episode.id} 
                    className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50 hover:border-purple-500/30 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {/* Episode Image */}
                      {episode.image?.medium && (
                        <img
                          src={episode.image.medium}
                          alt={episode.name}
                          className="w-24 h-16 rounded object-cover flex-shrink-0"
                        />
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-purple-400">
                            S{episode.season}E{episode.number}
                          </span>
                          <span className="text-white font-medium">{episode.name}</span>
                        </div>
                        {episode.summary && (
                          <p 
                            className="text-sm text-gray-400 line-clamp-2"
                            dangerouslySetInnerHTML={{ __html: episode.summary }}
                          />
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end text-xs text-gray-500 gap-1">
                        {episode.airdate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(episode.airdate).toLocaleDateString('tr-TR')}</span>
                          </div>
                        )}
                        {episode.runtime && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{episode.runtime} dk</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
