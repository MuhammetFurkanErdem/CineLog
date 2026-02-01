import axios from "axios";
import { config } from "../config";

// Use environment-based API URL
const API_BASE_URL = config.apiBaseUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Her istekte token'ı header'a ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 hatası gelirse login'e yönlendir
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// UNIFIED MEDIA INTERFACE - Standardized Data Model for All Content Types
// ============================================================================
export interface UnifiedMedia {
  id: number | string;
  title: string;
  posterUrl: string; // Full valid image URL
  year: string;
  rating: number; // Normalized to 0-10 scale
  type: "movie" | "series" | "anime";
  // Optional enrichment fields
  overview?: string;
  genres?: string[];
  status?: string;
  episodes?: number;
}

export const authService = {
  // Mevcut kullanıcı bilgilerini getir
  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  // Çıkış yap
  logout: () => {
    localStorage.removeItem("access_token");
    window.location.href = "/login";
  },
};

export const userService = {
  // Kullanıcı profilini getir
  getUserProfile: async (userId?: string) => {
    const url = userId ? `/users/${userId}` : "/users/me";
    const response = await api.get(url);
    return response.data;
  },

  // Kullanıcı profilini güncelle
  updateProfile: async (userData: { username?: string }) => {
    const response = await api.put("/users/me", userData);
    return response.data;
  },

  // Kullanıcı istatistiklerini getir
  getUserStats: async (userId?: string) => {
    const url = userId ? `/users/${userId}/stats` : "/users/me/stats";
    const response = await api.get(url);
    return response.data;
  },

  // Kullanıcının incelemeli filmlerini getir
  getUserReviews: async (userId: string) => {
    const response = await api.get(`/users/${userId}/reviews`);
    return response.data;
  },
};

export const movieService = {
  // Film ara (TMDB)
  searchMovies: async (query: string, page: number = 1) => {
    const response = await api.get("/movies/search", { params: { query, page } });
    return response.data;
  },

  // Popüler filmleri getir (TMDB)
  getPopularMovies: async (page: number = 1) => {
    const response = await api.get("/movies/popular", { params: { page } });
    return response.data;
  },

  // Trending filmleri getir (TMDB)
  getTrendingMovies: async () => {
    const response = await api.get("/movies/trending");
    return response.data;
  },

  // Film detaylarını getir (TMDB)
  getMovieDetails: async (tmdbId: number) => {
    const response = await api.get(`/movies/tmdb/${tmdbId}`);
    return response.data;
  },

  // Kullanıcının film listesi
  getUserMovies: async () => {
    const response = await api.get("/movies/my-list");
    return response.data;
  },

  // Film ekle/güncelle
  addMovie: async (movieData: any) => {
    const response = await api.post("/movies/add", movieData);
    return response.data;
  },

  // Film güncelle
  updateMovie: async (filmId: number, updateData: any) => {
    const response = await api.put(`/movies/${filmId}`, updateData);
    return response.data;
  },

  // Film sil
  deleteMovie: async (filmId: number) => {
    const response = await api.delete(`/movies/${filmId}`);
    return response.data;
  },

  // Film incelemelerini getir (belirli bir TMDB ID için tüm kullanıcıların incelemeleri)
  getMovieReviews: async (tmdbId: number) => {
    const response = await api.get(`/movies/tmdb/${tmdbId}/reviews`);
    return response.data;
  },

  // Kullanıcının tür istatistikleri
  getGenreStats: async () => {
    const response = await api.get("/movies/my-genres");
    return response.data;
  },
};

export const socialService = {
  // Arkadaş aktivitelerini getir (sosyal akış)
  getFeed: async (limit: number = 20, source: "all" | "friends" | "me" = "all") => {
    const response = await api.get("/social/feed", { params: { limit, source } });
    return response.data;
  },

  // Arkadaş listesini getir
  getFriends: async () => {
    const response = await api.get("/social/friends");
    return response.data;
  },

  // Kullanıcı ara
  searchUsers: async (username: string) => {
    const response = await api.get(`/users/search/${username}`);
    return response.data;
  },

  // Arkadaşlık isteği gönder
  sendFriendRequest: async (friendId: number) => {
    const response = await api.post("/social/friends/request", { friend_id: friendId });
    return response.data;
  },

  // Arkadaşlık isteklerini getir
  getFriendRequests: async () => {
    const response = await api.get("/social/friends/requests");
    return response.data;
  },

  // Arkadaşlık isteğine cevap ver
  respondToFriendRequest: async (friendshipId: number, status: "accepted" | "rejected") => {
    const response = await api.put(`/social/friends/requests/${friendshipId}`, { status });
    return response.data;
  },

  // Arkadaşı kaldır
  removeFriend: async (friendId: number) => {
    const response = await api.delete(`/social/friends/${friendId}`);
    return response.data;
  },

  // Uyumluluk skorunu getir
  getCompatibility: async (friendId: number) => {
    const response = await api.get(`/social/compatibility/${friendId}`);
    return response.data;
  },

  // Bu haftaki film sayısını hesapla
  getWeeklyMovieCount: async () => {
    const response = await api.get("/movies/my-list");
    const movies = response.data;
    
    // Son 7 gün içinde izlenen filmler
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyMovies = movies.filter((movie: any) => {
      if (!movie.izlenme_tarihi) return false;
      const movieDate = new Date(movie.izlenme_tarihi);
      return movieDate >= oneWeekAgo;
    });
    
    return weeklyMovies.length;
  },

  // Aktivite beğen
  likeActivity: async (filmId: number) => {
    const response = await api.post(`/social/activity/${filmId}/like`);
    return response.data;
  },

  // Aktivite beğenisini kaldır
  unlikeActivity: async (filmId: number) => {
    const response = await api.delete(`/social/activity/${filmId}/like`);
    return response.data;
  },

  // Aktivite etkileşimlerini getir
  getActivityInteractions: async (filmId: number) => {
    const response = await api.get(`/social/activity/${filmId}/interactions`);
    return response.data;
  },

  // Aktiviteye yorum ekle
  addComment: async (filmId: number, content: string) => {
    const response = await api.post(`/social/activity/${filmId}/comment`, { film_id: filmId, content });
    return response.data;
  },

  // Yorumu sil
  deleteComment: async (commentId: number) => {
    const response = await api.delete(`/social/activity/comment/${commentId}`);
    return response.data;
  },

  // Yorumu düzenle
  updateComment: async (commentId: number, content: string) => {
    const response = await api.put(`/social/activity/comment/${commentId}`, { content });
    return response.data;
  },
};

export const aiService = {
  // Belirli bir filme benzer filmleri öner
  getMovieRecommendations: async (movieId: number, limit: number = 10) => {
    const response = await api.get(`/ai/recommendations/${movieId}`, { params: { limit } });
    return response.data;
  },

  // Kullanıcıya özel kişiselleştirilmiş öneriler
  getPersonalizedRecommendations: async (limit: number = 20) => {
    const response = await api.get("/ai/recommendations/user/personalized", { params: { limit } });
    return response.data;
  },

  // AI modelini yeniden eğit (admin)
  retrainModel: async () => {
    const response = await api.post("/ai/retrain");
    return response.data;
  },
};

export const externalService = {
  // TV Show arama (TVMaze API)
  searchTVShows: async (query: string) => {
    const response = await api.get("/external/tv/search", { params: { query } });
    return response.data;
  },

  // TV Show detayları (TVMaze API)
  getTVShowDetails: async (showId: number) => {
    const response = await api.get(`/external/tv/${showId}`);
    return response.data;
  },

  // TV Show için zenginleştirilmiş veri (cast, crew, episodes)
  getEnrichedTVData: async (title: string) => {
    try {
      // Önce title ile arama yap
      const searchResponse = await api.get("/external/tv/search", { 
        params: { query: title } 
      });
      
      if (!searchResponse.data || searchResponse.data.length === 0) {
        return null;
      }

      // İlk sonucu al ve detaylarını getir
      const firstResult = searchResponse.data[0];
      const showId = firstResult.show?.id || firstResult.id;
      
      if (!showId) return null;

      // Detaylı bilgi getir (cast ve episodes embedded olarak gelecek)
      const detailsResponse = await api.get(`/external/tv/${showId}`);
      return detailsResponse.data;
    } catch (error) {
      console.error("Error fetching enriched TV data:", error);
      return null;
    }
  },
};

// ============================================================================
// UNIFIED SEARCH API - Category-Based Search with Standardized Output
// ============================================================================
export const unifiedSearchAPI = {
  /**
   * Search Movies (TMDB) - Returns UnifiedMedia[]
   */
  searchMovies: async (query: string): Promise<UnifiedMedia[]> => {
    try {
      const endpoint = query.trim() 
        ? `/movies/search?query=${encodeURIComponent(query)}`
        : '/movies/popular';
      
      const response = await api.get(endpoint);
      const movies = response.data || [];

      return movies.map((movie: any) => ({
        id: movie.id,
        title: movie.title || movie.original_title || "Unknown Title",
        posterUrl: movie.poster_path 
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : "/placeholder-movie.png",
        year: movie.release_date 
          ? new Date(movie.release_date).getFullYear().toString()
          : "N/A",
        rating: movie.vote_average ? parseFloat(movie.vote_average.toFixed(1)) : 0,
        type: "movie" as const,
        overview: movie.overview || "",
        genres: movie.genres?.map((g: any) => g.name) || [],
      }));
    } catch (error) {
      console.error("Error searching movies:", error);
      throw error;
    }
  },

  /**
   * Search TV Series (TVMaze) - Returns UnifiedMedia[]
   */
  searchSeries: async (query: string): Promise<UnifiedMedia[]> => {
    try {
      if (!query.trim()) {
        // TVMaze doesn't have a "popular" endpoint, return empty or fetch a default list
        return [];
      }

      const response = await api.get(`/external/tv/search?query=${encodeURIComponent(query)}`);
      const shows = response.data || [];

      return shows.map((item: any) => {
        const show = item.show || item;
        return {
          id: `tv-${show.id}`,
          title: show.name || "Unknown Show",
          posterUrl: show.image?.medium || show.image?.original || "/placeholder-movie.png",
          year: show.premiered 
            ? new Date(show.premiered).getFullYear().toString()
            : "N/A",
          rating: show.rating?.average ? parseFloat(show.rating.average.toFixed(1)) : 0,
          type: "series" as const,
          overview: show.summary 
            ? show.summary.replace(/<[^>]*>/g, '') // Strip HTML tags
            : "",
          genres: show.genres || [],
          status: show.status || "",
        };
      });
    } catch (error) {
      console.error("Error searching TV series:", error);
      throw error;
    }
  },

  /**
   * Search Anime (Jikan/MyAnimeList) - Returns UnifiedMedia[]
   */
  searchAnime: async (query: string): Promise<UnifiedMedia[]> => {
    try {
      // Use the robust jikanService we created earlier
      const animeList = await jikanService.searchAnime(query);

      return animeList.map((anime: any) => ({
        id: `anime-${anime.mal_id}`,
        title: anime.title || anime.title_english || "Unknown Anime",
        posterUrl: anime.images?.jpg?.large_image_url 
          || anime.images?.jpg?.image_url 
          || "/placeholder-movie.png",
        year: anime.year?.toString() || "N/A",
        rating: anime.score ? parseFloat(anime.score.toFixed(1)) : 0,
        type: "anime" as const,
        overview: anime.synopsis || "",
        genres: anime.genres?.map((g: any) => g.name) || [],
        status: anime.status || "",
        episodes: anime.episodes || 0,
      }));
    } catch (error) {
      console.error("Error searching anime:", error);
      throw error;
    }
  },
};

// ============================================================================
// JIKAN API V4 - Direct Client-Side Integration (Robust & Production-Ready)
// ============================================================================
export const jikanService = {
  /**
   * Search Anime with Intelligent Fallback
   * - Empty query → Fetch Top Anime by Popularity
   * - Valid query → Search with SFW filter
   */
  searchAnime: async (query: string = "") => {
    try {
      let url: string;
      
      if (!query || query.trim() === "") {
        // Empty query → Get Top Anime by Popularity
        url = "https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=25";
      } else {
        // Search with query (SFW = Safe For Work)
        const encodedQuery = encodeURIComponent(query.trim());
        url = `https://api.jikan.moe/v4/anime?q=${encodedQuery}&sfw=true&limit=25`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please wait a moment.");
        }
        throw new Error(`Jikan API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Return simplified anime list
      return (data.data || []).map((anime: any) => ({
        mal_id: anime.mal_id,
        title: anime.title || anime.title_english || "Unknown Title",
        title_english: anime.title_english,
        title_japanese: anime.title_japanese,
        type: anime.type,
        episodes: anime.episodes,
        score: anime.score,
        year: anime.year || anime.aired?.from?.split('-')[0],
        status: anime.status,
        rating: anime.rating,
        synopsis: anime.synopsis,
        images: {
          jpg: {
            image_url: anime.images?.jpg?.image_url || "",
            large_image_url: anime.images?.jpg?.large_image_url || "",
          },
          webp: {
            image_url: anime.images?.webp?.image_url || "",
            large_image_url: anime.images?.webp?.large_image_url || "",
          },
        },
        genres: anime.genres || [],
        studios: anime.studios || [],
      }));
    } catch (error) {
      console.error("Error searching anime:", error);
      throw error;
    }
  },

  /**
   * Get Full Anime Details with Characters & Staff
   * - Fetches 3 endpoints in parallel for optimal performance
   * - Returns combined object with all data
   */
  getAnimeFullDetails: async (jikanId: number) => {
    try {
      // Parallel fetching for maximum performance
      const [infoResponse, charactersResponse, staffResponse] = await Promise.all([
        fetch(`https://api.jikan.moe/v4/anime/${jikanId}/full`),
        fetch(`https://api.jikan.moe/v4/anime/${jikanId}/characters`),
        fetch(`https://api.jikan.moe/v4/anime/${jikanId}/staff`),
      ]);

      // Check for errors
      if (!infoResponse.ok) {
        throw new Error(`Failed to fetch anime info: ${infoResponse.status}`);
      }

      const infoData = await infoResponse.json();
      const charactersData = charactersResponse.ok ? await charactersResponse.json() : { data: [] };
      const staffData = staffResponse.ok ? await staffResponse.json() : { data: [] };

      // Process and structure the data
      const info = infoData.data || {};
      
      // Process characters (top 15, with voice actors)
      const characters = (charactersData.data || []).slice(0, 15).map((char: any) => ({
        character: {
          mal_id: char.character?.mal_id,
          name: char.character?.name,
          images: {
            jpg: {
              image_url: char.character?.images?.jpg?.image_url || "",
            },
          },
        },
        role: char.role, // "Main", "Supporting"
        voice_actors: (char.voice_actors || [])
          .filter((va: any) => va.language === "Japanese") // Prioritize Japanese VAs
          .slice(0, 1)
          .map((va: any) => ({
            person: {
              mal_id: va.person?.mal_id,
              name: va.person?.name,
              images: {
                jpg: {
                  image_url: va.person?.images?.jpg?.image_url || "",
                },
              },
            },
            language: va.language,
          })),
      }));

      // Process staff (filter key positions)
      const staff = (staffData.data || []).map((member: any) => ({
        person: {
          mal_id: member.person?.mal_id,
          name: member.person?.name,
          images: {
            jpg: {
              image_url: member.person?.images?.jpg?.image_url || "",
            },
          },
        },
        positions: member.positions || [],
      }));

      // Return combined object
      return {
        info: {
          mal_id: info.mal_id,
          title: info.title,
          title_english: info.title_english,
          title_japanese: info.title_japanese,
          type: info.type,
          episodes: info.episodes,
          status: info.status,
          aired: info.aired,
          duration: info.duration,
          rating: info.rating,
          score: info.score,
          scored_by: info.scored_by,
          rank: info.rank,
          popularity: info.popularity,
          synopsis: info.synopsis,
          background: info.background,
          season: info.season,
          year: info.year,
          studios: info.studios || [],
          genres: info.genres || [],
          themes: info.themes || [],
          demographics: info.demographics || [],
          images: info.images,
          trailer: info.trailer,
        },
        characters,
        staff,
      };
    } catch (error) {
      console.error("Error fetching anime full details:", error);
      throw error;
    }
  },

  /**
   * Legacy function for backward compatibility with MovieDetail.tsx
   * Now uses the robust searchAnime and getAnimeFullDetails
   */
  getEnrichedAnimeData: async (title: string) => {
    try {
      // Search for anime by title
      const searchResults = await jikanService.searchAnime(title);
      
      if (!searchResults || searchResults.length === 0) {
        return null;
      }

      // Get the first result's full details
      const firstResult = searchResults[0];
      const fullDetails = await jikanService.getAnimeFullDetails(firstResult.mal_id);

      // Return in the format expected by MovieDetail.tsx
      return {
        ...fullDetails.info,
        characters: fullDetails.characters,
        staff: fullDetails.staff,
      };
    } catch (error) {
      console.error("Error fetching enriched anime data:", error);
      return null;
    }
  },
};

export default api;
