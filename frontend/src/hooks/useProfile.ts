import { useState, useMemo, useEffect } from "react";
import { User } from "../utils/mockData";
import { getUserLibrary, LibraryItem } from "../utils/storage";
import { useAuth } from "./useAuth";

// Mock friends data - replace with actual API call
const mockFriends: Partial<User>[] = [
  { id: "2", username: "johnDoe", name: "John Doe", avatar: "/avatars/john.jpg", stats: { movies: 0, series: 0, reviews: 0, followers: 0, following: 0 }, badges: [] },
  { id: "3", username: "janeDoe", name: "Jane Doe", avatar: "/avatars/jane.jpg", stats: { movies: 0, series: 0, reviews: 0, followers: 0, following: 0 }, badges: [] },
];

type TabType = "watched" | "favorites" | "watchlist" | "reviews";

interface UseProfileParams {
  userId?: string;
}



export function useProfile({ userId }: UseProfileParams) {
  // Force refresh mechanism
  const [refreshKey, setRefreshKey] = useState(0);
  const { currentUser } = useAuth();
  
  // Determine profile mode
  const profileUserId = userId || currentUser?.id || "";
  const isOwnProfile = currentUser ? profileUserId === currentUser.id : false;

  // Get profile user data
  const profileUser = useMemo(() => {
  if (isOwnProfile) {
    return currentUser;
  }
  return mockFriends.find((friend) => friend.id === String(profileUserId)) || null;
}, [profileUserId, isOwnProfile, currentUser]);

  // Determine friendship status
  const isFriend = useMemo(() => {
  if (isOwnProfile) return false;
  return mockFriends.some((friend) => friend.id === String(profileUserId));
}, [profileUserId, isOwnProfile, currentUser]);

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
  return getUserLibrary() as LibraryItem[];
}, [profileUserId, refreshKey]);

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

  return {
    profileUser,
    profileUserId,
    isOwnProfile,
    isFriend,
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
    refreshLibrary: () => setRefreshKey((prev) => prev + 1),
  };
}

// ✅ Profile logic fully encapsulated in useProfile
// ✅ Each tab has its own data list (not dependent on activeTab)
