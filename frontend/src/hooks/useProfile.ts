import { useState, useMemo, useEffect, useCallback } from "react";
import { getUserLibrary, LibraryItem } from "../utils/storage";
import { useAuth } from "./useAuth";
import axios from "axios";

type TabType = "watched" | "favorites" | "watchlist" | "reviews";

interface FriendshipStatus {
  isFollowing: boolean;
  isFollower: boolean;
  isFriend: boolean;
  hasPendingSent: boolean;
  hasPendingReceived: boolean;
}

interface UseProfileParams {
  userId?: string;
}

export function useProfile({ userId }: UseProfileParams) {
  // Force refresh mechanism
  const [refreshKey, setRefreshKey] = useState(0);
  const { currentUser, token } = useAuth();
  const [fetchedUser, setFetchedUser] = useState<any>(null);
  const [fetchedFilms, setFetchedFilms] = useState<any[]>([]);
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>({
    isFollowing: false,
    isFollower: false,
    isFriend: false,
    hasPendingSent: false,
    hasPendingReceived: false,
  });
  const [friendshipLoading, setFriendshipLoading] = useState(false);
  
  // Determine profile mode
  const profileUserId = userId || currentUser?.id || "";
  const isOwnProfile = currentUser ? profileUserId === currentUser.id : false;

  // Fetch friendship status
  const fetchFriendshipStatus = useCallback(async () => {
    if (!isOwnProfile && profileUserId && token) {
      try {
        setFriendshipLoading(true);
        const response = await axios.get(
          `http://127.0.0.1:8000/api/social/friends/status/${profileUserId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFriendshipStatus(response.data);
      } catch (error) {
        console.error("Error fetching friendship status:", error);
      } finally {
        setFriendshipLoading(false);
      }
    }
  }, [profileUserId, isOwnProfile, token]);

  // Fetch user data from backend if viewing someone else's profile
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isOwnProfile && profileUserId) {
        console.log('🔄 Fetching friend profile data:', profileUserId);
        try {
          // Fetch user profile
          const userResponse = await axios.get(`http://127.0.0.1:8000/api/users/${profileUserId}`);
          setFetchedUser(userResponse.data);
          
          // Fetch user's films
          try {
            const filmsResponse = await axios.get(`http://127.0.0.1:8000/api/users/${profileUserId}/films`);
            console.log('📦 Fetched films count:', filmsResponse.data.length);
            setFetchedFilms(filmsResponse.data);
          } catch (filmError) {
            console.log("Could not fetch user films:", filmError);
            setFetchedFilms([]);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setFetchedUser(null);
        }
      }
    };

    fetchUserData();
    
    // Auto-refresh friend's profile every 5 seconds
    if (!isOwnProfile && profileUserId) {
      console.log('⏰ Setting up auto-refresh for profile:', profileUserId);
      const interval = setInterval(() => {
        console.log('🔄 Auto-refreshing profile...');
        fetchUserData();
      }, 5000);
      return () => {
        console.log('🛑 Clearing auto-refresh interval');
        clearInterval(interval);
      };
    }
  }, [profileUserId, isOwnProfile, refreshKey]);

  // Fetch friendship status when viewing other profile
  useEffect(() => {
    fetchFriendshipStatus();
  }, [fetchFriendshipStatus]);

  // Get profile user data
  const profileUser = useMemo(() => {
    if (isOwnProfile) {
      return currentUser;
    }
    // Return fetched user from backend
    if (fetchedUser) {
      return {
        id: fetchedUser.id,
        username: fetchedUser.username,
        email: fetchedUser.email,
        name: fetchedUser.username,
        avatar: fetchedUser.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fetchedUser.username}`,
        joinDate: fetchedUser.created_at,
        bio: "",
        socialLinks: { twitter: "", letterboxd: "", imdb: "" },
        stats: { movies: 0, series: 0, reviews: 0, followers: 0, following: 0 },
        badges: [],
      };
    }
    return null;
  }, [profileUserId, isOwnProfile, currentUser, fetchedUser]);

  // Determine friendship status (from backend)
  const isFriend = useMemo(() => {
    if (isOwnProfile) return false;
    return friendshipStatus.isFriend;
  }, [isOwnProfile, friendshipStatus.isFriend]);

  const isFollowing = useMemo(() => {
    if (isOwnProfile) return false;
    return friendshipStatus.isFollowing;
  }, [isOwnProfile, friendshipStatus.isFollowing]);

  // Visibility rules
  const visibility = useMemo(() => {
    if (isOwnProfile) {
      return {
        canSeeWatched: true,
        canSeeFavorites: true,
        canSeeWatchlist: true,
        canSeeReviews: true,
      };
    }
    if (isFriend) {
      return {
        canSeeWatched: true,
        canSeeFavorites: true,
        canSeeWatchlist: false,
        canSeeReviews: true,
      };
    }
    // Public profile
    return {
      canSeeWatched: true,
      canSeeFavorites: false,
      canSeeWatchlist: false,
      canSeeReviews: false,
    };
  }, [isOwnProfile, isFriend]);

  // Get user's library
  const library = useMemo<LibraryItem[]>(() => {
    if (isOwnProfile) {
      // Own profile: use localStorage
      return getUserLibrary() as LibraryItem[];
    }
    // Other user's profile: convert backend films to LibraryItem format
    if (fetchedFilms.length > 0) {
      return fetchedFilms.map(film => ({
        id: `movie-${film.tmdb_id}`,
        type: 'movie' as const,
        title: film.title,
        poster: film.poster_path ? `https://image.tmdb.org/t/p/w500${film.poster_path}` : '/placeholder-movie.png',
        year: film.release_date ? new Date(film.release_date).getFullYear() : undefined,
        rating: film.kisisel_puan || undefined,
        watched: film.izlendi,
        favorite: film.is_favorite,
        watchlist: film.is_watchlist,
        timestamp: new Date(film.izlenme_tarihi || Date.now()).getTime(),
      }));
    }
    return [];
  }, [profileUserId, refreshKey, isOwnProfile, fetchedFilms]);

  // Calculate stats
  const stats = useMemo(() => {
    const watchedItems = library.filter((item) => item.watched);
    return {
      totalMovies: watchedItems.filter((item) => item.type === "movie").length,
      totalSeries: watchedItems.filter((item) => item.type === "series").length,
      totalAnimes: watchedItems.filter((item) => item.type === "anime").length,
      totalFavorites: library.filter((item) => item.favorite).length,
      totalWatchlist: library.filter((item) => item.watchlist).length,
      totalReviews: 0, // Mock for now
    };
  }, [library]);

  // Calculate available tabs based on visibility
  const availableTabs = useMemo<TabType[]>(() => {
    const tabs: TabType[] = [];
    if (visibility.canSeeWatched) tabs.push("watched");
    if (visibility.canSeeFavorites) tabs.push("favorites");
    if (visibility.canSeeWatchlist) tabs.push("watchlist");
    if (visibility.canSeeReviews) tabs.push("reviews");
    return tabs;
  }, [visibility]);

  // Active tab state - default to first available tab
  const [activeTab, setActiveTab] = useState<TabType>(
    availableTabs[0] || "watched"
  );

  // Ensure active tab is always valid when visibility changes
  useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0] || "watched");
    }
  }, [availableTabs, activeTab]);

  // ✅ FIX: Create separate lists for each tab (not dependent on activeTab)
  // This ensures each tab always shows its own data
  const watchedItems = useMemo<LibraryItem[]>(() => {
    return library.filter((item) => item.watched);
  }, [library]);

  const favoriteItems = useMemo<LibraryItem[]>(() => {
    return library.filter((item) => item.favorite);
  }, [library]);

  const watchlistItems = useMemo<LibraryItem[]>(() => {
    return library.filter((item) => item.watchlist);
  }, [library]);

  const reviewItems = useMemo<LibraryItem[]>(() => {
    return []; // Mock for now - will be replaced with real reviews
  }, []);

  // Calculate dynamic badges based on user stats
  const calculatedBadges = useMemo(() => {
    const badges: { name: string; rarity: "legendary" | "rare" | "common" }[] = [];
    const totalWatched = stats.totalMovies + stats.totalSeries + stats.totalAnimes;

    // Movie badges
    if (stats.totalMovies >= 100) {
      badges.push({ name: "🎬 Film Ustası", rarity: "legendary" });
    } else if (stats.totalMovies >= 50) {
      badges.push({ name: "🎬 Sinefil", rarity: "rare" });
    } else if (stats.totalMovies >= 10) {
      badges.push({ name: "🎬 Film Sever", rarity: "common" });
    }

    // Series badges
    if (stats.totalSeries >= 50) {
      badges.push({ name: "📺 Dizi Kralı", rarity: "legendary" });
    } else if (stats.totalSeries >= 20) {
      badges.push({ name: "📺 Dizi Bağımlısı", rarity: "rare" });
    } else if (stats.totalSeries >= 5) {
      badges.push({ name: "📺 Dizi Takipçisi", rarity: "common" });
    }

    // Anime badges
    if (stats.totalAnimes >= 50) {
      badges.push({ name: "🎌 Otaku", rarity: "legendary" });
    } else if (stats.totalAnimes >= 20) {
      badges.push({ name: "🎌 Anime Tutkunu", rarity: "rare" });
    } else if (stats.totalAnimes >= 5) {
      badges.push({ name: "🎌 Anime Sever", rarity: "common" });
    }

    // Total watched badges
    if (totalWatched >= 200) {
      badges.push({ name: "🏆 Efsane İzleyici", rarity: "legendary" });
    } else if (totalWatched >= 100) {
      badges.push({ name: "🌟 Süper İzleyici", rarity: "rare" });
    } else if (totalWatched >= 25) {
      badges.push({ name: "👀 Aktif İzleyici", rarity: "common" });
    }

    // Favorite badges
    if (stats.totalFavorites >= 50) {
      badges.push({ name: "❤️ Koleksiyoncu", rarity: "legendary" });
    } else if (stats.totalFavorites >= 20) {
      badges.push({ name: "❤️ Seçici Beğenen", rarity: "rare" });
    } else if (stats.totalFavorites >= 5) {
      badges.push({ name: "❤️ Favorici", rarity: "common" });
    }

    // New user badge
    if (totalWatched === 0) {
      badges.push({ name: "🌱 Yeni Üye", rarity: "common" });
    }

    return badges;
  }, [stats]);

  // Follow/Unfollow actions
  const handleFollow = useCallback(async () => {
    if (!profileUserId || !token) return;
    try {
      setFriendshipLoading(true);
      await axios.post(
        `http://127.0.0.1:8000/api/social/friends/request`,
        { friend_id: parseInt(profileUserId) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh friendship status
      await fetchFriendshipStatus();
    } catch (error) {
      console.error("Error following user:", error);
    } finally {
      setFriendshipLoading(false);
    }
  }, [profileUserId, token, fetchFriendshipStatus]);

  const handleUnfollow = useCallback(async () => {
    if (!profileUserId || !token) return;
    try {
      setFriendshipLoading(true);
      await axios.delete(
        `http://127.0.0.1:8000/api/social/friends/${profileUserId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh friendship status
      await fetchFriendshipStatus();
    } catch (error) {
      console.error("Error unfollowing user:", error);
    } finally {
      setFriendshipLoading(false);
    }
  }, [profileUserId, token, fetchFriendshipStatus]);

  return {
    profileUser,
    profileUserId,
    isOwnProfile,
    isFriend,
    isFollowing,
    friendshipStatus,
    friendshipLoading,
    handleFollow,
    handleUnfollow,
    visibility,
    library,
    stats,
    activeTab,
    setActiveTab,
    availableTabs,
    // ✅ Return separate lists instead of single filteredItems
    watchedItems,
    favoriteItems,
    watchlistItems,
    reviewItems,
    calculatedBadges,
    refreshLibrary: () => setRefreshKey((prev) => prev + 1),
  };
}

// ✅ Profile logic fully encapsulated in useProfile
// ✅ Each tab has its own data list (not dependent on activeTab)

