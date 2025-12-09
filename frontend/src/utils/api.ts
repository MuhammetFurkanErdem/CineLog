import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/api";

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

  // Kullanıcının tür istatistikleri
  getGenreStats: async () => {
    const response = await api.get("/movies/my-genres");
    return response.data;
  },
};

export const socialService = {
  // Arkadaş aktivitelerini getir (sosyal akış)
  getFeed: async (limit: number = 20) => {
    const response = await api.get("/social/feed", { params: { limit } });
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
};

export default api;
