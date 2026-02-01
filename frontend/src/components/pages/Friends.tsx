import { useState, useEffect } from "react";
import { Link } from "react-router";
import { UserPlus, UserCheck, UserX, Search, Sparkles, Check, X } from "lucide-react";
import { userService, socialService } from "../../utils/api";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

interface User {
  id: number;
  username: string;
  email: string;
  picture?: string;
}

interface UserStats {
  total_movies: number;
  total_series: number;
  total_reviews: number;
  total_followers: number;
  total_following: number;
  badges?: Array<{
    name: string;
    rarity: string;
  }>;
}

interface Compatibility {
  compatibility_percentage: number;
  common_films: number;
}

interface FriendRequest {
  id: number;
  user_id: number;
  friend_id: number;
  status: string;
  created_at: string;
  user: User;
}

export function Friends() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [myStats, setMyStats] = useState<UserStats | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [compatibilityScores, setCompatibilityScores] = useState<Record<number, Compatibility>>({});
  const [userStats, setUserStats] = useState<Record<number, UserStats>>({});
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [unfollowDialog, setUnfollowDialog] = useState<{ open: boolean; userId: number | null; username: string }>({
    open: false,
    userId: null,
    username: ""
  });
  const [followBackDialog, setFollowBackDialog] = useState<{ open: boolean; userId: number | null; username: string }>({
    open: false,
    userId: null,
    username: ""
  });  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userResponse, statsResponse, friendsResponse, requestsResponse] = await Promise.all([
          userService.getUserProfile(),
          userService.getUserStats(),
          socialService.getFriends(),
          socialService.getFriendRequests(),
        ]);

        setCurrentUser(userResponse);
        setMyStats(statsResponse);
        setFriends(friendsResponse);
        setFriendRequests(requestsResponse);

        // Arkadaşların uyumluluk skorlarını ve istatistiklerini getir
        if (friendsResponse.length > 0) {
          const timestamp = Date.now(); // Cache bypass
          const compatibilityPromises = friendsResponse.map((friend: User) =>
            socialService.getCompatibility(friend.id).catch(() => ({ compatibility_percentage: 0, common_films: 0 }))
          );
          const statsPromises = friendsResponse.map((friend: User) =>
            userService.getUserStats(friend.id.toString()).catch(() => null)
          );

          const [compatibilities, stats] = await Promise.all([
            Promise.all(compatibilityPromises),
            Promise.all(statsPromises),
          ]);

          const compatibilityMap: Record<number, Compatibility> = {};
          const statsMap: Record<number, UserStats> = {};

          friendsResponse.forEach((friend: User, index: number) => {
            compatibilityMap[friend.id] = compatibilities[index];
            if (stats[index]) {
              statsMap[friend.id] = stats[index];
            }
          });

          setCompatibilityScores(compatibilityMap);
          setUserStats(statsMap);
        }
      } catch (error) {
        console.error("Veri yüklenirken hata:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Auto-refresh compatibility scores every 5 seconds
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing compatibility scores...');
      fetchData();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      try {
        const results = await socialService.searchUsers(searchQuery);
        // Kendini ve mevcut arkadaşları filtrele
        const friendIds = friends.map(f => f.id);
        const filtered = results.filter(
          (user: User) => user.id !== currentUser?.id && !friendIds.includes(user.id)
        );
        setSearchResults(filtered);
      } catch (error) {
        console.error("Arama hatası:", error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, currentUser, friends]);

  const handleFollowUser = async (userId: number) => {
    try {
      await socialService.sendFriendRequest(userId);
      toast.success("Arkadaşlık isteği gönderildi!");
      // Arama sonuçlarından kaldır
      setSearchResults(prev => prev.filter(u => u.id !== userId));
    } catch (error: any) {
      console.error("Arkadaşlık isteği gönderilemedi:", error);
      toast.error(error.response?.data?.detail || "Bir hata oluştu");
    }
  };

  const handleAcceptRequest = async (friendshipId: number, userId: number, username: string) => {
    try {
      await socialService.respondToFriendRequest(friendshipId, "accepted");
      
      // İstekleri ve arkadaş listesini yenile
      const [requestsResponse, friendsResponse] = await Promise.all([
        socialService.getFriendRequests(),
        socialService.getFriends(),
      ]);
      setFriendRequests(requestsResponse);
      setFriends(friendsResponse);
      
      // Yeni arkadaş için stats ve compatibility getir
      try {
        const [compatibility, stats] = await Promise.all([
          socialService.getCompatibility(userId).catch(() => ({ compatibility_percentage: 0, common_films: 0 })),
          userService.getUserStats(userId.toString()).catch(() => null)
        ]);
        
        setCompatibilityScores(prev => ({ ...prev, [userId]: compatibility }));
        if (stats) {
          setUserStats(prev => ({ ...prev, [userId]: stats }));
        }
      } catch (error) {
        console.error("Stats yüklenemedi:", error);
      }
      
      // Kendi stats'ımızı güncelle (MUTUAL: hem followers hem following +1)
      try {
        const updatedMyStats = await userService.getUserStats();
        setMyStats(updatedMyStats);
      } catch (error) {
        console.error("Kendi stats güncellenemedi:", error);
      }
      
      // Başarı mesajı - MUTUAL arkadaşlık kuruldu
      toast.success(`${username} ile artık arkadaşsınız!`);
      
    } catch (error: any) {
      console.error("İstek kabul edilemedi:", error);
      toast.error(error.response?.data?.detail || "Bir hata oluştu");
    }
  };

  const handleRejectRequest = async (friendshipId: number) => {
    try {
      await socialService.respondToFriendRequest(friendshipId, "rejected");
      // İstekleri yenile
      const requestsResponse = await socialService.getFriendRequests();
      setFriendRequests(requestsResponse);
      toast.success("Arkadaşlık isteği reddedildi");
    } catch (error: any) {
      console.error("İstek reddedilemedi:", error);
      toast.error(error.response?.data?.detail || "Bir hata oluştu");
    }
  };

  const handleUnfollow = (userId: number, username: string) => {
    setUnfollowDialog({ open: true, userId, username });
  };

  const confirmUnfollow = async () => {
    if (!unfollowDialog.userId) return;

    try {
      await socialService.removeFriend(unfollowDialog.userId);
      // Arkadaş listesini yenile
      const friendsResponse = await socialService.getFriends();
      setFriends(friendsResponse);
      
      // Kendi stats'ımızı güncelle (MUTUAL: hem followers hem following -1)
      try {
        const updatedMyStats = await userService.getUserStats();
        setMyStats(updatedMyStats);
      } catch (error) {
        console.error("Stats güncellenemedi:", error);
      }
      
      toast.success(`${unfollowDialog.username} ile arkadaşlığınız sona erdi`);
      setUnfollowDialog({ open: false, userId: null, username: "" });
    } catch (error: any) {
      console.error("Arkadaşlıktan çıkılamadı:", error);
      toast.error(error.response?.data?.detail || "Bir hata oluştu");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Yükleniyor...</div>
      </div>
    );
  }

  // Görüntülenecek kullanıcıları filtrele (kendi profilini çıkar)
  const displayedUsers = (searchQuery.trim().length >= 2 ? searchResults : friends).filter(
    user => user.id !== currentUser?.id
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-white mb-2">Arkadaşlar</h1>
        <p className="text-gray-400">
          Arkadaşlarınla etkileşime geç ve sinema uyumunu keşfet
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Arkadaş ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900/50 border border-purple-500/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <div className="bg-gradient-to-br from-purple-900/40 to-purple-900/20 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-purple-500/20">
          <div className="text-2xl sm:text-3xl md:text-4xl mb-1 sm:mb-2 text-purple-400">
            {myStats?.total_followers || 0}
          </div>
          <div className="text-gray-300 text-sm sm:text-base">Takip</div>
        </div>
        <div className="bg-gradient-to-br from-pink-900/40 to-pink-900/20 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-pink-500/20">
          <div className="text-2xl sm:text-3xl md:text-4xl mb-1 sm:mb-2 text-pink-400">
            {myStats?.total_following || 0}
          </div>
          <div className="text-gray-300 text-sm sm:text-base">Takipçi</div>
        </div>
      </div>

      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl text-white">Arkadaşlık İstekleri ({friendRequests.length})</h2>
          {friendRequests.map((request) => (
            <div
              key={request.id}
              className="bg-slate-900/50 backdrop-blur rounded-lg sm:rounded-xl p-3 sm:p-5 border border-purple-500/10 hover:border-purple-500/30 transition-all"
            >
              <div className="flex items-center gap-3 sm:gap-5">
                {/* Avatar */}
                <Link to={`/profile/${request.user.id}`} className="flex-shrink-0">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg sm:text-xl font-bold ring-2 ring-purple-500/30">
                    {request.user.username.charAt(0).toUpperCase()}
                  </div>
                </Link>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/profile/${request.user.id}`}
                    className="text-white hover:text-purple-400 transition-colors block truncate text-base sm:text-lg"
                  >
                    {request.user.username}
                  </Link>
                  <div className="text-gray-400 text-xs sm:text-sm">@{request.user.username}</div>
                  <div className="text-gray-500 text-xs mt-1 hidden sm:block">
                    {new Date(request.created_at).toLocaleDateString('tr-TR')}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptRequest(request.id, request.user.id, request.user.username)}
                    className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all shadow-lg hover:scale-105"
                  >
                    Kabul Et
                  </button>
                  <button
                    onClick={() => handleRejectRequest(request.id)}
                    className="px-6 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-lg transition-all"
                  >
                    Reddet
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Friends List */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-xl sm:text-2xl text-white">
          {searchQuery.trim().length >= 2 ? "Arama Sonuçları" : "Arkadaşlarım"}
        </h2>
        {searchLoading && (
          <div className="text-center py-8">
            <div className="text-gray-400">Aranıyor...</div>
          </div>
        )}
        {!searchLoading && displayedUsers.map((user) => {
          const compatibility = compatibilityScores[user.id];
          const stats = userStats[user.id];
          const isFriend = friends.some(f => f.id === user.id);

          return (
            <div
              key={user.id}
              className="bg-slate-900/50 backdrop-blur rounded-xl p-3 sm:p-5 border border-purple-500/10 hover:border-purple-500/30 transition-all"
            >
              <div className="flex items-center gap-3 sm:gap-5">
                {/* Avatar */}
                <Link to={`/profile/${user.id}`} className="flex-shrink-0">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg sm:text-xl md:text-2xl font-bold ring-2 ring-purple-500/30">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                </Link>

                {/* Compatibility Ring */}
                {compatibility && (
                  <div className="flex-shrink-0 hidden sm:block">
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                        <circle
                          cx="40"
                          cy="40"
                          r="34"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          className="text-slate-700"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="34"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 34}`}
                          strokeDashoffset={`${
                            2 * Math.PI * 34 * (1 - compatibility.compatibility_percentage / 100)
                          }`}
                          className={`${
                            compatibility.compatibility_percentage >= 85
                              ? "text-green-400"
                              : compatibility.compatibility_percentage >= 70
                              ? "text-yellow-400"
                              : "text-orange-400"
                          }`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-white text-xs sm:text-sm">
                          {Math.round(compatibility.compatibility_percentage)}%
                        </span>
                        <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
                          <Sparkles className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/profile/${user.id}`}
                      className="text-white text-sm sm:text-base hover:text-purple-400 transition-colors block truncate"
                    >
                      {user.username}
                    </Link>
                    {/* Mobile Compatibility Badge */}
                    {compatibility && (
                      <span className={`sm:hidden text-xs px-1.5 py-0.5 rounded ${
                        compatibility.compatibility_percentage >= 85
                          ? "bg-green-500/20 text-green-400"
                          : compatibility.compatibility_percentage >= 70
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-orange-500/20 text-orange-400"
                      }`}>
                        {Math.round(compatibility.compatibility_percentage)}%
                      </span>
                    )}
                  </div>
                  <div className="text-gray-400 text-xs sm:text-sm">@{user.username}</div>
                  {stats && (
                    <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-2 text-xs sm:text-sm text-gray-400">
                      <span>{stats.total_movies} Film</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{stats.total_series} Dizi</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:inline">{stats.total_reviews} İnceleme</span>
                    </div>
                  )}

                  {/* Badges */}
                  {stats?.badges && stats.badges.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {stats.badges.slice(0, 3).map((badge, index) => (
                        <span
                          key={index}
                          className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded"
                        >
                          {badge.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Button */}
                {isFriend ? (
                  <button
                    onClick={() => handleUnfollow(user.id, user.username)}
                    className="px-3 sm:px-5 md:px-8 py-2 sm:py-2.5 md:py-3.5 bg-slate-700 hover:bg-slate-600 text-white text-xs sm:text-sm rounded-lg sm:rounded-xl transition-all flex items-center gap-1.5 sm:gap-2 flex-shrink-0"
                  >
                    <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Arkadaş</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleFollowUser(user.id)}
                    className="px-3 sm:px-5 md:px-8 py-2 sm:py-2.5 md:py-3.5 bg-purple-500 hover:bg-purple-600 text-white text-xs sm:text-sm rounded-lg sm:rounded-xl transition-all flex items-center gap-1.5 sm:gap-2 flex-shrink-0 shadow-lg hover:shadow-purple-500/50 hover:scale-105"
                  >
                    <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Ekle</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!searchLoading && displayedUsers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">
            {searchQuery.trim().length >= 2 ? "Kullanıcı bulunamadı" : "Henüz arkadaşın yok"}
          </p>
        </div>
      )}

      {/* Remove Friend Confirmation Dialog */}
      <AlertDialog open={unfollowDialog.open} onOpenChange={(open: boolean) => setUnfollowDialog({ open, userId: null, username: "" })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arkadaşlıktan Çıkar?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{unfollowDialog.username}</strong> kullanıcısını arkadaş listenden kaldırmak üzeresiniz. Bu işlemden sonra tekrar arkadaşlık isteği gönderebilirsiniz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUnfollow}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Arkadaşlıktan Çıkar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}