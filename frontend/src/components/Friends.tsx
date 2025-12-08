import { useState } from "react";
import { Link } from "react-router";
import { UserPlus, Search, Sparkles } from "lucide-react";
import { users, currentUser, calculateCinemaCompatibility } from "../utils/mockData";

export function Friends() {
  const [searchQuery, setSearchQuery] = useState("");

  const otherUsers = users.filter((u) => u.id !== currentUser.id);

  const filteredUsers = otherUsers.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
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
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-purple-900/40 to-purple-900/20 rounded-xl p-6 border border-purple-500/20">
          <div className="text-4xl mb-2 text-purple-400">
            {currentUser.stats.followers}
          </div>
          <div className="text-gray-300">Takipçi</div>
        </div>
        <div className="bg-gradient-to-br from-pink-900/40 to-pink-900/20 rounded-xl p-6 border border-pink-500/20">
          <div className="text-4xl mb-2 text-pink-400">
            {currentUser.stats.following}
          </div>
          <div className="text-gray-300">Takip Edilen</div>
        </div>
      </div>

      {/* Friends List */}
      <div className="space-y-4">
        <h2 className="text-2xl text-white">Arkadaş Önerileri</h2>
        {filteredUsers.map((user) => {
          const compatibility = calculateCinemaCompatibility(
            currentUser.id,
            user.id
          );

          return (
            <div
              key={user.id}
              className="bg-slate-900/50 backdrop-blur rounded-xl p-5 border border-purple-500/10 hover:border-purple-500/30 transition-all"
            >
              <div className="flex items-center gap-5">
                {/* Avatar */}
                <Link to={`/profile/${user.id}`} className="flex-shrink-0">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-20 h-20 rounded-full object-cover ring-2 ring-purple-500/30"
                  />
                </Link>

                {/* Compatibility Ring */}
                <div className="flex-shrink-0">
                  <div className="relative w-20 h-20">
                    <svg className="w-full h-full transform -rotate-90">
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
                          2 * Math.PI * 34 * (1 - compatibility / 100)
                        }`}
                        className={`${
                          compatibility >= 85
                            ? "text-green-400"
                            : compatibility >= 70
                            ? "text-yellow-400"
                            : "text-orange-400"
                        }`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-white">
                        {compatibility}%
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Sparkles className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/profile/${user.id}`}
                    className="text-white hover:text-purple-400 transition-colors block truncate"
                  >
                    {user.name}
                  </Link>
                  <div className="text-gray-400 text-sm">@{user.username}</div>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
                    <span>{user.stats.movies} Film</span>
                    <span>•</span>
                    <span>{user.stats.series} Dizi</span>
                    <span>•</span>
                    <span>{user.stats.reviews} İnceleme</span>
                  </div>

                  {/* Badges */}
                  {user.badges && user.badges.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {user.badges.slice(0, 3).map((badge, index) => (
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
                <button className="px-8 py-3.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all flex items-center gap-2 flex-shrink-0 shadow-lg hover:shadow-purple-500/50 hover:scale-105">
                  <UserPlus className="w-5 h-5" />
                  <span className="hidden md:inline">Takip Et</span>
                  <span className="md:hidden">Takip</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">Kullanıcı bulunamadı</p>
        </div>
      )}
    </div>
  );
}