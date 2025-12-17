import { useState, useEffect } from "react";
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
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  getReviewsByMovieId,
  getUserById,
} from "../../utils/mockData";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { movieService, externalService, jikanService } from "../../utils/api";
import { toggleInteraction, getItemStatus } from "../../utils/storage";

interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  overview: string | null;
  vote_average: number | null;
  runtime?: number;
  genres?: { id: number; name: string }[];
  cast?: { id: number; name: string; character: string; profile_path: string | null }[];
  director?: { id: number; name: string; profile_path: string | null };
  watch_providers?: {
    flatrate: { logo_path: string; provider_name: string }[];
    buy: { logo_path: string; provider_name: string }[];
    rent: { logo_path: string; provider_name: string }[];
  };
}

interface UserFilm {
  id: number;
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  kisisel_puan: number | null;
  kisisel_yorum: string | null;
  izlendi: boolean;
  is_favorite: boolean;
  is_watchlist: boolean;
}

// External API data types
interface TVShowData {
  id?: number;
  name?: string;
  status?: string;
  premiered?: string;
  ended?: string;
  network?: { name: string };
  rating?: { average: number };
  genres?: string[];
  summary?: string;
  image?: { medium: string; original: string };
  _embedded?: {
    cast?: Array<{
      person: { id: number; name: string; image?: { medium: string } };
      character: { id: number; name: string; image?: { medium: string } };
    }>;
    episodes?: Array<{
      id: number;
      name: string;
      season: number;
      number: number;
      airdate?: string;
      runtime?: number;
      summary?: string;
    }>;
  };
}

interface AnimeData {
  mal_id?: number;
  title?: string;
  title_english?: string;
  status?: string;
  aired?: { from: string; to: string };
  episodes?: number;
  duration?: string;
  rating?: string;
  score?: number;
  studios?: Array<{ name: string }>;
  genres?: Array<{ name: string }>;
  synopsis?: string;
  images?: { jpg: { image_url: string; large_image_url: string } };
  characters?: Array<{
    character: { 
      mal_id: number; 
      name: string; 
      images?: { jpg: { image_url: string } } 
    };
    role: string;
    voice_actors?: Array<{ 
      person: { 
        mal_id?: number;
        name: string;
        images?: { jpg: { image_url: string } };
      };
      language: string;
    }>;
  }>;
  staff?: Array<{
    person: {
      mal_id?: number;
      name: string;
      images?: { jpg: { image_url: string } };
    };
    positions?: string[];
  }>;
}

export function MovieDetail() {
  const { movieId } = useParams();
  const movieReviews = getReviewsByMovieId(movieId || "");

  const [movie, setMovie] = useState<TMDBMovie | null>(null);
  const [userFilm, setUserFilm] = useState<UserFilm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // External API data
  const [externalData, setExternalData] = useState<TVShowData | AnimeData | null>(null);
  const [externalLoading, setExternalLoading] = useState(false);
  const [showEpisodes, setShowEpisodes] = useState(false);

  const [userRating, setUserRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isWatched, setIsWatched] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  // TMDB'den film detaylarını ve kullanıcının film listesini yükle
  useEffect(() => {
    const fetchMovieData = async () => {
      if (!movieId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // TMDB'den film detaylarını al
        const tmdbMovie = await movieService.getMovieDetails(parseInt(movieId));
        setMovie(tmdbMovie);
        
        // localStorage'dan durum kontrolü
        const localStatus = getItemStatus(`movie-${movieId}`);
        setIsWatched(localStatus.isWatched);
        setIsFavorite(localStatus.isFavorite);
        setIsInWatchlist(localStatus.isWatchlist);
        
        // Kullanıcının film listesini kontrol et (backend)
        try {
          const userMovies = await movieService.getUserMovies();
          const existingFilm = userMovies.find(
            (f: UserFilm) => f.tmdb_id === parseInt(movieId)
          );
          
          if (existingFilm) {
            setUserFilm(existingFilm);
            setUserRating(existingFilm.kisisel_puan || 0);
            setReviewText(existingFilm.kisisel_yorum || "");
          }
        } catch {
          // Kullanıcı giriş yapmamış olabilir, hata verme
          console.log("Kullanıcı film listesi alınamadı");
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || "Film yüklenirken hata oluştu");
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
  }, [movieId]);

  // Fetch external data (TVMaze for TV shows, Jikan for anime)
  useEffect(() => {
    const fetchExternalData = async () => {
      if (!movie || !movie.title) return;

      setExternalLoading(true);
      
      try {
        // Determine if this is a TV show or anime based on genres
        const genreNames = movie.genres?.map(g => g.name.toLowerCase()) || [];
        const isAnime = genreNames.includes('animation') && 
                       (movie.title.toLowerCase().includes('anime') || 
                        genreNames.includes('anime'));
        const isTVShow = genreNames.includes('tv') || 
                        movie.title.toLowerCase().includes('series') ||
                        movie.title.toLowerCase().includes('season');

        if (isAnime) {
          // Fetch anime data from Jikan/MyAnimeList
          const animeData = await jikanService.getEnrichedAnimeData(movie.title);
          if (animeData) {
            setExternalData(animeData);
          }
        } else if (isTVShow) {
          // Fetch TV show data from TVMaze
          const tvData = await externalService.getEnrichedTVData(movie.title);
          if (tvData) {
            setExternalData(tvData);
          }
        }
      } catch (err) {
        console.error("Error fetching external data:", err);
        // Don't show error to user, external data is optional
      } finally {
        setExternalLoading(false);
      }
    };

    fetchExternalData();
  }, [movie]);

  // İzledim butonuna tıklandığında
  const handleWatchedClick = async () => {
    if (!movie || actionLoading) return;
    
    // localStorage'a kaydet (profil için)
    const posterUrl = movie.poster_path 
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
      : "/placeholder-movie.png";
    const releaseYear = movie.release_date 
      ? new Date(movie.release_date).getFullYear() 
      : undefined;
    
    const newState = toggleInteraction(
      {
        id: `movie-${movie.id}`,
        type: 'movie',
        title: movie.title,
        poster: posterUrl,
        year: releaseYear,
        rating: movie.vote_average || undefined,
      },
      'watched'
    );
    setIsWatched(newState);
    
    // Backend'e de kaydet (opsiyonel)
    setActionLoading(true);
    try {
      if (userFilm) {
        const updated = await movieService.updateMovie(userFilm.id, {
          izlendi: newState,
        });
        setUserFilm(updated);
      } else if (newState) {
        const newFilm = await movieService.addMovie({
          tmdb_id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          release_date: movie.release_date,
          overview: movie.overview,
          izlendi: true,
        });
        setUserFilm(newFilm);
      }
    } catch (err: any) {
      console.error("Backend güncelleme hatası:", err);
      // localStorage zaten güncellendi, backend hatası görmezden gel
    } finally {
      setActionLoading(false);
    }
  };

  // Puan verildiğinde
  const handleRatingClick = async (rating: number) => {
    if (!movie || actionLoading) return;
    
    setUserRating(rating);
    setActionLoading(true);
    
    try {
      if (userFilm) {
        // Film zaten listede, puanı güncelle
        const updated = await movieService.updateMovie(userFilm.id, {
          kisisel_puan: rating,
        });
        setUserFilm(updated);
      } else {
        // Film listede yok, izlendi olarak ekle ve puan ver
        const newFilm = await movieService.addMovie({
          tmdb_id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          release_date: movie.release_date,
          overview: movie.overview,
          izlendi: true,
          kisisel_puan: rating,
        });
        setUserFilm(newFilm);
        setIsWatched(true);
      }
    } catch (err: any) {
      console.error("Puan güncellenirken hata:", err);
      setUserRating(userFilm?.kisisel_puan || 0);
      alert(err.response?.data?.detail || "Puan verilemedi");
    } finally {
      setActionLoading(false);
    }
  };

  // İnceleme paylaşıldığında
  const handleReviewSubmit = async () => {
    if (!movie || actionLoading || !reviewText.trim()) return;
    
    setActionLoading(true);
    
    try {
      if (userFilm) {
        // Film zaten listede, yorumu güncelle
        const updated = await movieService.updateMovie(userFilm.id, {
          kisisel_yorum: reviewText,
        });
        setUserFilm(updated);
      } else {
        // Film listede yok, izlendi olarak ekle ve yorum yaz
        const newFilm = await movieService.addMovie({
          tmdb_id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          release_date: movie.release_date,
          overview: movie.overview,
          izlendi: true,
          kisisel_yorum: reviewText,
        });
        setUserFilm(newFilm);
        setIsWatched(true);
      }
      setShowReviewForm(false);
    } catch (err: any) {
      console.error("İnceleme paylaşılırken hata:", err);
      alert(err.response?.data?.detail || "İnceleme paylaşılamadı");
    } finally {
      setActionLoading(false);
    }
  };

  // Paylaş butonu
  const handleShare = () => {
    if (navigator.share && movie) {
      navigator.share({
        title: movie.title,
        text: `${movie.title} filmini CineLog'da keşfet!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      // Fallback: URL'i kopyala
      navigator.clipboard.writeText(window.location.href);
      alert("Link panoya kopyalandı!");
    }
  };

  // Favori butonuna tıklandığında
  const handleFavoriteClick = async () => {
    if (!movie || actionLoading) return;
    
    // localStorage'a kaydet (profil için)
    const posterUrl = movie.poster_path 
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
      : "/placeholder-movie.png";
    const releaseYear = movie.release_date 
      ? new Date(movie.release_date).getFullYear() 
      : undefined;
    
    const newState = toggleInteraction(
      {
        id: `movie-${movie.id}`,
        type: 'movie',
        title: movie.title,
        poster: posterUrl,
        year: releaseYear,
        rating: movie.vote_average || undefined,
      },
      'favorite'
    );
    setIsFavorite(newState);
    
    // Backend'e de kaydet (opsiyonel)
    setActionLoading(true);
    try {
      if (userFilm) {
        const updated = await movieService.updateMovie(userFilm.id, {
          is_favorite: newState,
        });
        setUserFilm(updated);
      } else if (newState) {
        const newFilm = await movieService.addMovie({
          tmdb_id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          release_date: movie.release_date,
          overview: movie.overview,
          is_favorite: true,
        });
        setUserFilm(newFilm);
      }
    } catch (err: any) {
      console.error("Backend güncelleme hatası:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // İzleme listesi butonuna tıklandığında
  const handleWatchlistClick = async () => {
    if (!movie || actionLoading) return;
    
    // localStorage'a kaydet (profil için)
    const posterUrl = movie.poster_path 
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
      : "/placeholder-movie.png";
    const releaseYear = movie.release_date 
      ? new Date(movie.release_date).getFullYear() 
      : undefined;
    
    const newState = toggleInteraction(
      {
        id: `movie-${movie.id}`,
        type: 'movie',
        title: movie.title,
        poster: posterUrl,
        year: releaseYear,
        rating: movie.vote_average || undefined,
      },
      'watchlist'
    );
    setIsInWatchlist(newState);
    
    // Backend'e de kaydet (opsiyonel)
    setActionLoading(true);
    try {
      if (userFilm) {
        const updated = await movieService.updateMovie(userFilm.id, {
          is_watchlist: newState,
        });
        setUserFilm(updated);
      } else if (newState) {
        const newFilm = await movieService.addMovie({
          tmdb_id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          release_date: movie.release_date,
          overview: movie.overview,
          is_watchlist: true,
        });
        setUserFilm(newFilm);
      }
    } catch (err: any) {
      console.error("Backend güncelleme hatası:", err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        <span className="ml-2 text-gray-400">Film yükleniyor...</span>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">{error || "Film bulunamadı"}</p>
      </div>
    );
  }

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "/placeholder-movie.png";

  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : null;

  return (
    <div className="space-y-8">
      {/* Hero Section - Kompakt İki Sütun Layout */}
      <div className="relative">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* ========== SOL SÜTUN: Poster & Platform ========== */}
          <div className="flex-shrink-0 w-full md:w-[300px] space-y-4">
            {/* Poster */}
            <img
              src={posterUrl}
              alt={movie.title}
              className="w-full rounded-xl object-cover shadow-2xl"
            />
            
            {/* Platform Butonu - Poster ile Aynı Genişlikte */}
            {movie.watch_providers && movie.watch_providers.flatrate && movie.watch_providers.flatrate.length > 0 && (
              <div className="w-full">
                {movie.watch_providers.flatrate.slice(0, 1).map((provider, index) => {
                  // Platform renklerine göre stil belirleme
                  const getProviderStyle = (name: string) => {
                    if (name.toLowerCase().includes('netflix')) {
                      return 'bg-[#E50914] hover:bg-[#c40812]';
                    } else if (name.toLowerCase().includes('disney')) {
                      return 'bg-[#113ccf] hover:bg-[#0d2f9f]';
                    } else if (name.toLowerCase().includes('prime')) {
                      return 'bg-[#00A8E1] hover:bg-[#0095c9]';
                    } else if (name.toLowerCase().includes('apple')) {
                      return 'bg-black hover:bg-gray-900';
                    }
                    return 'bg-slate-700 hover:bg-slate-600';
                  };

                  return (
                    <button
                      key={index}
                      className={`w-full h-12 rounded-lg font-medium text-white shadow-lg transition-all hover:shadow-xl flex items-center justify-center gap-2 ${getProviderStyle(provider.provider_name)}`}
                    >
                      <img
                        src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                        alt={provider.provider_name}
                        className="w-6 h-6 rounded"
                      />
                      <span>{provider.provider_name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ========== SAĞ SÜTUN: İçerik ========== */}
          <div className="flex-1 flex flex-col space-y-5">
            
            {/* 1. Başlık - Kompakt */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-2">
                {movie.title}
              </h1>
              
              {/* 2. Meta Veriler */}
              <div className="flex items-center gap-3 text-sm text-gray-400">
                {releaseYear && <span>{releaseYear}</span>}
                {releaseYear && movie.runtime && <span>•</span>}
                {movie.runtime && <span>{movie.runtime} dk</span>}
                {movie.runtime && movie.vote_average && <span>•</span>}
                {movie.vote_average && (
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-yellow-400 font-medium">
                      {movie.vote_average.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Tür Etiketleri - İnce ve Minimal */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {movie.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="text-sm px-3 py-1 rounded-md bg-slate-800/50 text-gray-300 border border-slate-700/50"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {/* 4. Aksiyon Butonları - Standart Boyut */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleWatchedClick}
                disabled={actionLoading}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  isWatched
                    ? "bg-green-500 text-white"
                    : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                }`}
              >
                {actionLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isWatched ? (
                  "✓ İzlendi"
                ) : (
                  "İzledim"
                )}
              </button>

              <button
                onClick={handleFavoriteClick}
                disabled={actionLoading}
                title="Favorilere Ekle"
                className={`p-2.5 rounded-lg transition-all border disabled:opacity-50 disabled:cursor-not-allowed ${
                  isFavorite
                    ? "bg-pink-500/20 border-pink-500/50 text-pink-400"
                    : "bg-slate-800/30 border-slate-700 text-gray-400 hover:border-pink-400/50 hover:text-pink-400"
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
              </button>

              <button
                onClick={handleWatchlistClick}
                disabled={actionLoading}
                title="İzleme Listesine Ekle"
                className={`p-2.5 rounded-lg transition-all border disabled:opacity-50 disabled:cursor-not-allowed ${
                  isInWatchlist
                    ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                    : "bg-slate-800/30 border-slate-700 text-gray-400 hover:border-blue-400/50 hover:text-blue-400"
                }`}
              >
                <Bookmark className={`w-5 h-5 ${isInWatchlist ? "fill-current" : ""}`} />
              </button>

              <button
                onClick={handleShare}
                title="Paylaş"
                className="p-2.5 rounded-lg bg-slate-800/30 border border-slate-700 text-gray-400 hover:border-slate-600 hover:text-white transition-all"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* 5. Özet */}
            {movie.overview && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ÖZET
                </h3>
                <p className="text-base text-gray-300 leading-relaxed">
                  {movie.overview}
                </p>
              </div>
            )}

            {/* 6. Yönetmen */}
            {movie.director && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Yönetmen:</span>
                <span className="text-white font-medium">{movie.director.name}</span>
              </div>
            )}

            {/* 7. Oyuncular - Medium Boyut */}
            {movie.cast && movie.cast.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  BAŞROL OYUNCULARI
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                  {movie.cast.slice(0, 8).map((actor) => (
                    <div key={actor.id} className="flex-shrink-0 text-center" style={{ width: '80px' }}>
                      {actor.profile_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                          alt={actor.name}
                          className="w-14 h-14 rounded-full object-cover mx-auto mb-2 border-2 border-slate-700"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-2 border-2 border-slate-700">
                          <span className="text-gray-500 text-lg font-bold">
                            {actor.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-white font-semibold leading-tight truncate" title={actor.name}>
                        {actor.name.split(' ').slice(0, 2).join(' ')}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5" title={actor.character}>
                        {actor.character}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 8. External Data - TV Show Cast */}
            {externalData && '_embedded' in externalData && externalData._embedded?.cast && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  OYUNCULAR (TVMaze)
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                  {externalData._embedded.cast.slice(0, 10).map((castMember, idx) => (
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

            {/* 9. External Data - Anime Characters (Enhanced with Voice Actors) */}
            {externalData && 'characters' in externalData && externalData.characters && externalData.characters.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  KARAKTERLER & SESLENDİRME
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                  {externalData.characters.slice(0, 12).map((char, idx) => (
                    <div key={idx} className="flex-shrink-0 bg-slate-800/30 rounded-lg p-3 border border-slate-700/50" style={{ width: '180px' }}>
                      <div className="flex items-start gap-3">
                        {/* Character Image */}
                        <div className="flex-shrink-0">
                          {char.character?.images?.jpg?.image_url ? (
                            <img
                              src={char.character.images.jpg.image_url}
                              alt={char.character.name}
                              className="w-16 h-16 rounded-full object-cover border-2 border-slate-600"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600">
                              <span className="text-gray-400 text-lg font-bold">
                                {char.character?.name?.charAt(0) || '?'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Character Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white font-semibold leading-tight truncate mb-1" title={char.character?.name}>
                            {char.character?.name}
                          </p>
                          <p className="text-[10px] text-purple-400 truncate mb-2" title={char.role}>
                            {char.role}
                          </p>
                          
                          {/* Voice Actor */}
                          {char.voice_actors && char.voice_actors.length > 0 && char.voice_actors[0]?.person && (
                            <div className="pt-2 border-t border-slate-600/50">
                              <p className="text-[9px] text-gray-500 uppercase mb-0.5">CV</p>
                              <p className="text-[10px] text-gray-300 truncate font-medium" title={char.voice_actors[0].person.name}>
                                {char.voice_actors[0].person.name}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 10. External Data - Anime Staff */}
            {externalData && 'staff' in externalData && externalData.staff && externalData.staff.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  YAPIM EKİBİ
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {externalData.staff
                    .filter((member: any) => {
                      // Show key positions only
                      const positions = member.positions?.join(', ').toLowerCase() || '';
                      return positions.includes('director') || 
                             positions.includes('producer') || 
                             positions.includes('composition') ||
                             positions.includes('character design') ||
                             positions.includes('music');
                    })
                    .slice(0, 6)
                    .map((member: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                      {/* Staff Image */}
                      {member.person?.images?.jpg?.image_url ? (
                        <img
                          src={member.person.images.jpg.image_url}
                          alt={member.person.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-slate-600"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600">
                          <span className="text-gray-400 text-sm font-bold">
                            {member.person?.name?.charAt(0) || '?'}
                          </span>
                        </div>
                      )}
                      
                      {/* Staff Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white font-semibold leading-tight truncate" title={member.person?.name}>
                          {member.person?.name}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate mt-0.5" title={member.positions?.join(', ')}>
                          {member.positions?.slice(0, 2).join(', ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 11. External Data - Info Badges */}
            {externalData && (
              <div className="flex flex-wrap gap-2">
                {/* TV Show Info */}
                {'status' in externalData && externalData.status && (
                  <span className="text-xs px-3 py-1.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    📺 {externalData.status}
                  </span>
                )}
                {'network' in externalData && externalData.network?.name && (
                  <span className="text-xs px-3 py-1.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    🎬 {externalData.network.name}
                  </span>
                )}
                {'rating' in externalData && typeof externalData.rating === 'object' && externalData.rating?.average && (
                  <span className="text-xs px-3 py-1.5 rounded-md bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                    ⭐ {externalData.rating.average}/10
                  </span>
                )}

                {/* Anime Info */}
                {'episodes' in externalData && externalData.episodes && (
                  <span className="text-xs px-3 py-1.5 rounded-md bg-green-500/20 text-green-300 border border-green-500/30">
                    📺 {externalData.episodes} Episodes
                  </span>
                )}
                {'studios' in externalData && externalData.studios && externalData.studios.length > 0 && (
                  <span className="text-xs px-3 py-1.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    🎬 {externalData.studios[0].name}
                  </span>
                )}
                {'score' in externalData && externalData.score && (
                  <span className="text-xs px-3 py-1.5 rounded-md bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                    ⭐ {externalData.score}/10 (MAL)
                  </span>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* External Data - Episodes Section */}
      {externalData && '_embedded' in externalData && externalData._embedded?.episodes && externalData._embedded.episodes.length > 0 && (
        <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-purple-500/10">
          <button
            onClick={() => setShowEpisodes(!showEpisodes)}
            className="w-full flex items-center justify-between text-white hover:text-purple-400 transition-colors"
          >
            <h2 className="text-2xl font-semibold">
              Bölümler ({externalData._embedded.episodes.length})
            </h2>
            {showEpisodes ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
          </button>
          
          {showEpisodes && (
            <div className="mt-4 space-y-2 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {externalData._embedded.episodes.map((episode) => (
                <div 
                  key={episode.id} 
                  className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50 hover:border-purple-500/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-purple-400">
                          S{episode.season}E{episode.number}
                        </span>
                        <span className="text-white font-medium">{episode.name}</span>
                      </div>
                      {episode.summary && (
                        <p className="text-sm text-gray-400 line-clamp-2"
                           dangerouslySetInnerHTML={{ __html: episode.summary }}
                        />
                      )}
                    </div>
                    <div className="flex flex-col items-end text-xs text-gray-500 gap-1">
                      {episode.airdate && (
                        <span>{new Date(episode.airdate).toLocaleDateString('tr-TR')}</span>
                      )}
                      {episode.runtime && (
                        <span>{episode.runtime} dk</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rating Section */}
      <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-purple-500/10">
        <h2 className="text-2xl text-white mb-4">Puanını Ver</h2>
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
            <button
              key={rating}
              onMouseEnter={() => setHoveredRating(rating)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => handleRatingClick(rating)}
              disabled={actionLoading}
              className="group relative disabled:opacity-50 disabled:cursor-not-allowed"
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
              <button
                onClick={handleReviewSubmit}
                disabled={actionLoading || !reviewText.trim()}
                className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
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