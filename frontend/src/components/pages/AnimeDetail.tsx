import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import {
  Star,
  Heart,
  Bookmark,
  Share2,
  Loader2,
  Trophy,
  TrendingUp,
  Book,
  Play,
  Music,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import { toggleInteraction, getItemStatus } from "../../utils/storage";

interface AnimeData {
  mal_id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  type: string;
  episodes?: number;
  status: string;
  aired: {
    from: string;
    to: string;
    string: string;
  };
  duration: string;
  rating: string;
  score: number;
  scored_by: number;
  rank: number;
  popularity: number;
  synopsis: string;
  background?: string;
  season?: string;
  year?: number;
  source: string;
  studios: Array<{ mal_id: number; name: string }>;
  genres: Array<{ mal_id: number; name: string }>;
  themes: Array<{ mal_id: number; name: string }>;
  demographics: Array<{ mal_id: number; name: string }>;
  images: {
    jpg: { image_url: string; large_image_url: string };
    webp: { image_url: string; large_image_url: string };
  };
  trailer?: {
    youtube_id: string;
    url: string;
    embed_url: string;
  };
  theme?: {
    openings: string[];
    endings: string[];
  };
}

interface Character {
  character: {
    mal_id: number;
    name: string;
    images: { jpg: { image_url: string } };
  };
  role: string;
  voice_actors: Array<{
    person: { mal_id: number; name: string; images: { jpg: { image_url: string } } };
    language: string;
  }>;
}

export function AnimeDetail() {
  const { animeId } = useParams();
  const [anime, setAnime] = useState<AnimeData | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showThemes, setShowThemes] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isWatchlist, setIsWatchlist] = useState(false);

  useEffect(() => {
    const fetchAnimeData = async () => {
      if (!animeId) return;

      setLoading(true);
      setError(null);

      try {
        // Extract numeric ID from "anime-123" format
        const numericId = animeId.replace('anime-', '');

        // Fetch anime details and characters in parallel
        const [animeResponse, charactersResponse] = await Promise.all([
          fetch(`https://api.jikan.moe/v4/anime/${numericId}/full`),
          fetch(`https://api.jikan.moe/v4/anime/${numericId}/characters`),
        ]);

        if (!animeResponse.ok) {
          throw new Error(`Jikan API error: ${animeResponse.status}`);
        }

        const animeData = await animeResponse.json();
        setAnime(animeData.data);

        if (charactersResponse.ok) {
          const charactersData = await charactersResponse.json();
          setCharacters(charactersData.data?.slice(0, 12) || []);
        }

        // Load interaction status from localStorage
        const status = getItemStatus(`anime-${numericId}`);
        setIsWatched(status.isWatched);
        setIsFavorite(status.isFavorite);
        setIsWatchlist(status.isWatchlist);
      } catch (err: any) {
        console.error("Error fetching anime:", err);
        setError("Anime bilgileri yüklenemedi");
      } finally {
        setLoading(false);
      }
    };

    fetchAnimeData();
  }, [animeId]);

  const handleShare = () => {
    if (navigator.share && anime) {
      navigator.share({
        title: anime.title,
        text: `${anime.title} anime'sini izle`,
        url: window.location.href,
      });
    }
  };

  const handleWatchedClick = () => {
    if (!anime) return;
    const posterUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || "/placeholder-movie.png";
    
    const newState = toggleInteraction(
      {
        id: `anime-${anime.mal_id}`,
        type: 'anime',
        title: anime.title,
        poster: posterUrl,
        year: anime.year,
        rating: anime.score,
      },
      'watched'
    );
    setIsWatched(newState);
  };

  const handleFavoriteClick = () => {
    if (!anime) return;
    const posterUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || "/placeholder-movie.png";
    
    const newState = toggleInteraction(
      {
        id: `anime-${anime.mal_id}`,
        type: 'anime',
        title: anime.title,
        poster: posterUrl,
        year: anime.year,
        rating: anime.score,
      },
      'favorite'
    );
    setIsFavorite(newState);
  };

  const handleWatchlistClick = () => {
    if (!anime) return;
    const posterUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || "/placeholder-movie.png";
    
    const newState = toggleInteraction(
      {
        id: `anime-${anime.mal_id}`,
        type: 'anime',
        title: anime.title,
        poster: posterUrl,
        year: anime.year,
        rating: anime.score,
      },
      'watchlist'
    );
    setIsWatchlist(newState);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        <span className="ml-2 text-gray-400">Anime yükleniyor...</span>
      </div>
    );
  }

  if (error || !anime) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">{error || "Anime bulunamadı"}</p>
        <Link
          to="/discover"
          className="mt-4 inline-block px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all"
        >
          Keşfet Sayfasına Dön
        </Link>
      </div>
    );
  }

  const posterUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || "/placeholder-movie.png";

  return (
    <div className="space-y-8 overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative">
        <div className="flex flex-col md:flex-row gap-4 sm:gap-8">
          
          {/* Poster */}
          <div className="flex-shrink-0 w-full md:w-[300px] space-y-4">
            <img
              src={posterUrl}
              alt={anime.title}
              className="w-full max-w-[250px] mx-auto md:max-w-none rounded-xl object-cover shadow-2xl"
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center">
                <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                <div className="text-xs text-gray-400">Rank</div>
                <div className="text-lg font-bold text-yellow-400">#{anime.rank}</div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-center">
                <TrendingUp className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <div className="text-xs text-gray-400">Popülerlik</div>
                <div className="text-lg font-bold text-blue-400">#{anime.popularity}</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col space-y-5">
            
            {/* Title */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-2">
                {anime.title}
              </h1>
              {anime.title_english && anime.title_english !== anime.title && (
                <h2 className="text-xl text-gray-400 mb-2">{anime.title_english}</h2>
              )}
              {anime.title_japanese && (
                <h3 className="text-lg text-gray-500">{anime.title_japanese}</h3>
              )}
              
              {/* Meta Data */}
              <div className="flex items-center gap-3 text-sm text-gray-400 flex-wrap mt-3">
                {anime.type && (
                  <>
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded">{anime.type}</span>
                    <span>•</span>
                  </>
                )}
                {anime.episodes && (
                  <>
                    <span>{anime.episodes} Episodes</span>
                    <span>•</span>
                  </>
                )}
                {anime.year && (
                  <>
                    <span>{anime.year}</span>
                    <span>•</span>
                  </>
                )}
                {anime.score && (
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-yellow-400 font-medium">
                      {anime.score.toFixed(2)}
                    </span>
                    <span className="text-gray-500">({anime.scored_by?.toLocaleString()} votes)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Info Badges */}
            <div className="flex flex-wrap gap-2">
              {anime.status && (
                <span className="text-xs px-3 py-1.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  📺 {anime.status}
                </span>
              )}
              {anime.source && (
                <span className="text-xs px-3 py-1.5 rounded-md bg-green-500/20 text-green-300 border border-green-500/30 flex items-center gap-1">
                  <Book className="w-3 h-3" />
                  {anime.source}
                </span>
              )}
              {anime.rating && (
                <span className="text-xs px-3 py-1.5 rounded-md bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  {anime.rating}
                </span>
              )}
              {anime.duration && (
                <span className="text-xs px-3 py-1.5 rounded-md bg-slate-500/20 text-slate-300 border border-slate-500/30">
                  ⏱️ {anime.duration}
                </span>
              )}
            </div>

            {/* Genres */}
            {anime.genres && anime.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {anime.genres.map((genre) => (
                  <span
                    key={genre.mal_id}
                    className="text-sm px-3 py-1 rounded-md bg-slate-800/50 text-gray-300 border border-slate-700/50"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleWatchedClick}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all shadow-md hover:shadow-lg ${
                  isWatched
                    ? "bg-green-500 text-white"
                    : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                }`}
              >
                {isWatched ? "✓ İzlendi" : "İzledim"}
              </button>

              <button
                onClick={handleFavoriteClick}
                title="Favorilere Ekle"
                className={`p-2.5 rounded-lg transition-all border ${
                  isFavorite
                    ? "bg-pink-500/20 border-pink-500/50 text-pink-400"
                    : "bg-slate-800/30 border-slate-700 text-gray-400 hover:border-pink-400/50 hover:text-pink-400"
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>

              <button
                onClick={handleWatchlistClick}
                title="İzleme Listesine Ekle"
                className={`p-2.5 rounded-lg transition-all border ${
                  isWatchlist
                    ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
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

            {/* Synopsis */}
            {anime.synopsis && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ÖZET
                </h3>
                <p className="text-base text-gray-300 leading-relaxed">
                  {anime.synopsis}
                </p>
              </div>
            )}

            {/* Background */}
            {anime.background && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ARKA PLAN
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {anime.background}
                </p>
              </div>
            )}

            {/* Studios */}
            {anime.studios && anime.studios.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Studio:</span>
                <span className="text-white font-medium">
                  {anime.studios.map(s => s.name).join(', ')}
                </span>
              </div>
            )}

            {/* Aired */}
            {anime.aired && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Yayın:</span>
                <span className="text-white font-medium">{anime.aired.string}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trailer */}
      {anime.trailer?.embed_url && (
        <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-purple-500/10">
          <h2 className="text-2xl text-white mb-4 flex items-center gap-2">
            <Play className="w-6 h-6 text-purple-400" />
            Fragman
          </h2>
          <div className="aspect-video rounded-lg overflow-hidden">
            <iframe
              src={anime.trailer.embed_url}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Characters */}
      {characters.length > 0 && (
        <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-purple-500/10">
          <h2 className="text-2xl text-white mb-4">Karakterler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {characters.map((char, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-4 bg-slate-800/40 rounded-lg p-4 border border-slate-700/50"
              >
                {/* Character */}
                <div className="flex items-center gap-3 flex-1">
                  <img
                    src={char.character.images.jpg.image_url}
                    alt={char.character.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-slate-600"
                  />
                  <div>
                    <p className="text-white font-semibold">{char.character.name}</p>
                    <p className="text-xs text-purple-400">{char.role}</p>
                  </div>
                </div>

                {/* Voice Actor */}
                {char.voice_actors && char.voice_actors.length > 0 && (
                  <div className="flex items-center gap-3 flex-1 justify-end text-right">
                    <div>
                      <p className="text-white font-semibold">{char.voice_actors[0].person.name}</p>
                      <p className="text-xs text-gray-400">{char.voice_actors[0].language}</p>
                    </div>
                    <img
                      src={char.voice_actors[0].person.images.jpg.image_url}
                      alt={char.voice_actors[0].person.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-slate-600"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Opening/Ending Themes */}
      {anime.theme && (anime.theme.openings?.length > 0 || anime.theme.endings?.length > 0) && (
        <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-purple-500/10">
          <button
            onClick={() => setShowThemes(!showThemes)}
            className="w-full flex items-center justify-between text-white hover:text-purple-400 transition-colors mb-4"
          >
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Music className="w-6 h-6 text-purple-400" />
              Açılış & Kapanış Müzikleri
            </h2>
            {showThemes ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
          </button>
          
          {showThemes && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Openings */}
              {anime.theme.openings && anime.theme.openings.length > 0 && (
                <div>
                  <h3 className="text-lg text-purple-400 mb-3">Açılış Müzikleri</h3>
                  <ul className="space-y-2">
                    {anime.theme.openings.map((opening, idx) => (
                      <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-purple-400 font-semibold">{idx + 1}.</span>
                        <span>{opening}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Endings */}
              {anime.theme.endings && anime.theme.endings.length > 0 && (
                <div>
                  <h3 className="text-lg text-blue-400 mb-3">Kapanış Müzikleri</h3>
                  <ul className="space-y-2">
                    {anime.theme.endings.map((ending, idx) => (
                      <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-blue-400 font-semibold">{idx + 1}.</span>
                        <span>{ending}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
