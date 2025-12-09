export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio?: string;
  stats: {
    movies: number;
    series: number;
    reviews: number;
    followers: number;
    following: number;
  };
  badges: Badge[];
}

export interface Badge {
  name: string;
  rarity: "legendary" | "rare" | "common";
}

export interface Movie {
  id: string;
  title: string;
  poster: string;
  year: number;
  genre: string[];
  rating: number;
  type: "movie" | "series" | "anime";
  runtime?: number;
  seasons?: number;
  episodes?: number;
  description: string;
}

export interface Review {
  id: string;
  userId: string;
  movieId: string;
  rating: number;
  comment: string;
  spoiler: boolean;
  createdAt: string;
  likes: number;
}

export interface Activity {
  id: string;
  userId: string;
  type: "watched" | "review" | "list" | "rating";
  movieId: string;
  rating?: number;
  comment?: string;
  createdAt: string;
}

export const currentUser: User = {
  id: "user-1",
  name: "Furkan Erdem",
  username: "furkan_erdem",
  avatar: "https://images.unsplash.com/photo-1529995049601-ef63465a463f?w=200&h=200&fit=crop",
  bio: "Film tutkunu 🎬 | Retro sinemanın hayranı | Haftada 5+ film",
  stats: {
    movies: 342,
    series: 87,
    reviews: 156,
    followers: 1247,
    following: 483,
  },
  badges: [
    { name: "🎬 Sinefil", rarity: "legendary" },
    { name: "🌟 Eleştirmen", rarity: "rare" },
    { name: "📺 Dizi Bağımlısı", rarity: "common" },
    { name: "🏆 Haftalık 100", rarity: "rare" },
  ],
};

export const users: User[] = [
  currentUser,
  {
    id: "user-2",
    name: "Mehmet Kaya",
    username: "mehmetkaya",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    stats: {
      movies: 218,
      series: 45,
      reviews: 89,
      followers: 654,
      following: 321,
    },
    badges: [
      { name: "🎬 Sinefil", rarity: "rare" },
      { name: "🎭 Drama Sever", rarity: "common" },
    ],
  },
  {
    id: "user-3",
    name: "Zeynep Demir",
    username: "zeynepd",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
    stats: {
      movies: 512,
      series: 123,
      reviews: 287,
      followers: 2341,
      following: 892,
    },
    badges: [
      { name: "🎬 Sinefil", rarity: "legendary" },
      { name: "🌟 Eleştirmen", rarity: "rare" },
      { name: "🏆 Haftalık 100", rarity: "rare" },
      { name: "👑 VIP", rarity: "legendary" },
    ],
  },
];

export const movies: Movie[] = [
  {
    id: "movie-1",
    title: "Inception",
    poster: "https://images.unsplash.com/photo-1655367574486-f63675dd69eb?w=400&h=600&fit=crop",
    year: 2010,
    genre: ["Bilim-Kurgu", "Aksiyon", "Gerilim"],
    rating: 8.8,
    type: "movie",
    runtime: 148,
    description: "Bir hırsız, kurumsal casusluk dünyasında son şansını değerlendirmek için tehlikeli bir görev üstlenir: düşünce yerleştirme.",
  },
  {
    id: "movie-2",
    title: "The Shawshank Redemption",
    poster: "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&h=600&fit=crop",
    year: 1994,
    genre: ["Drama"],
    rating: 9.3,
    type: "movie",
    runtime: 142,
    description: "İki hükmüllü yıllar içinde bağ kurarak, sıradan eylemlerin tesellisine yönelerek sonunda affedilme ve ortak bir kurtuluş hayali bulur.",
  },
  {
    id: "movie-3",
    title: "Breaking Bad",
    poster: "https://images.unsplash.com/photo-1574267432644-f737066e1f92?w=400&h=600&fit=crop",
    year: 2008,
    genre: ["Suç", "Drama", "Gerilim"],
    rating: 9.5,
    type: "series",
    seasons: 5,
    description: "Lise kimya öğretmeni, kanser teşhisi konulduktan sonra ailesinin geleceğini güvence altına almak için metamfetamin üretmeye başlar.",
  },
  {
    id: "movie-4",
    title: "Interstellar",
    poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop",
    year: 2014,
    genre: ["Bilim-Kurgu", "Drama"],
    rating: 8.6,
    type: "movie",
    runtime: 169,
    description: "Bir astronot grubu, insanlığın hayatta kalmasını sağlamak için bir solucan deliğinden geçer ve yıldızlararası seyahate çıkar.",
  },
  {
    id: "movie-5",
    title: "The Dark Knight",
    poster: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=600&fit=crop",
    year: 2008,
    genre: ["Aksiyon", "Suç", "Drama"],
    rating: 9.0,
    type: "movie",
    runtime: 152,
    description: "Batman, Joker olarak bilinen kaotik bir suçluyla karşı karşıya geldiğinde, Gotham halkını koruma konusundaki psikolojik ve fiziksel yeteneğini test eder.",
  },
  {
    id: "movie-6",
    title: "Stranger Things",
    poster: "https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=400&h=600&fit=crop",
    year: 2016,
    genre: ["Bilim-Kurgu", "Korku", "Drama"],
    rating: 8.7,
    type: "series",
    seasons: 4,
    description: "Küçük bir kasabada, genç bir çocuğun ortadan kaybolması gizemli olayların ve hükümet deneylerinin ortaya çıkmasına neden olur.",
  },
  {
    id: "anime-1",
    title: "Your Name (Kimi no Na wa)",
    poster: "https://images.unsplash.com/photo-1569701813229-33284b643e3c?w=400&h=600&fit=crop",
    year: 2016,
    genre: ["Romantik", "Drama", "Fantastik"],
    rating: 8.9,
    type: "anime",
    runtime: 107,
    description: "Bir kırsal kasabada yaşayan kız ve Tokyo'da yaşayan bir erkek birbirlerinin hayatlarını yaşamaya başlarlar.",
  },
  {
    id: "anime-2",
    title: "Attack on Titan (Shingeki no Kyojin)",
    poster: "https://images.unsplash.com/photo-1601430854328-26d0d524344a?w=400&h=600&fit=crop",
    year: 2013,
    genre: ["Aksiyon", "Drama", "Fantastik"],
    rating: 9.0,
    type: "anime",
    seasons: 4,
    episodes: 87,
    description: "İnsanlık, dev insansı yaratıklar tarafından yok edilme tehlikesiyle karşı karşıya. Genç savaşçılar hayatta kalmak için mücadele eder.",
  },
  {
    id: "anime-3",
    title: "Spirited Away (Sen to Chihiro)",
    poster: "https://images.unsplash.com/photo-1530908763814-a02e05de6d17?w=400&h=600&fit=crop",
    year: 2001,
    genre: ["Fantastik", "Macera", "Aile"],
    rating: 8.6,
    type: "anime",
    runtime: 125,
    description: "Genç bir kız, ailesiyle birlikte gizemli bir ruh dünyasına girer ve ebeveynlerini kurtarmak için çalışır.",
  },
  {
    id: "anime-4",
    title: "Death Note",
    poster: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=600&fit=crop",
    year: 2006,
    genre: ["Gerilim", "Psikolojik", "Gizem"],
    rating: 9.0,
    type: "anime",
    seasons: 1,
    episodes: 37,
    description: "Bir lise öğrencisi, ismi yazılan herhangi bir kişiyi öldürebilen doğaüstü bir not defteri bulur.",
  },
];

export const activities: Activity[] = [
  {
    id: "act-1",
    userId: "user-2",
    type: "review",
    movieId: "movie-1",
    rating: 9,
    comment: "Nolan'ın en iyi filmlerinden biri. Her izleyişimde yeni detaylar keşfediyorum.",
    createdAt: "2025-12-03T10:30:00Z",
  },
  {
    id: "act-2",
    userId: "user-3",
    type: "watched",
    movieId: "movie-4",
    rating: 10,
    createdAt: "2025-12-03T09:15:00Z",
  },
  {
    id: "act-3",
    userId: "user-2",
    type: "rating",
    movieId: "movie-5",
    rating: 9,
    createdAt: "2025-12-03T08:45:00Z",
  },
  {
    id: "act-4",
    userId: "user-3",
    type: "review",
    movieId: "movie-2",
    rating: 10,
    comment: "Tüm zamanların en iyi filmi. Umut üzerine muhteşem bir hikaye.",
    createdAt: "2025-12-02T20:00:00Z",
  },
  {
    id: "act-5",
    userId: "user-2",
    type: "watched",
    movieId: "movie-3",
    rating: 10,
    createdAt: "2025-12-02T18:30:00Z",
  },
];

export const reviews: Review[] = [
  {
    id: "rev-1",
    userId: "user-1",
    movieId: "movie-1",
    rating: 9,
    comment: "Akıl oyunları ve görsel efektler mükemmel. Her izleyişimde yeni bir şey fark ediyorum.",
    spoiler: false,
    createdAt: "2025-11-28T14:20:00Z",
    likes: 23,
  },
  {
    id: "rev-2",
    userId: "user-2",
    movieId: "movie-1",
    rating: 9,
    comment: "Nolan'ın en iyi filmlerinden biri. Her izleyişimde yeni detaylar keşfediyorum.",
    spoiler: false,
    createdAt: "2025-12-03T10:30:00Z",
    likes: 15,
  },
  {
    id: "rev-3",
    userId: "user-3",
    movieId: "movie-2",
    rating: 10,
    comment: "Tüm zamanların en iyi filmi. Umut üzerine muhteşem bir hikaye.",
    spoiler: false,
    createdAt: "2025-12-02T20:00:00Z",
    likes: 42,
  },
];

export function getMovieById(id: string): Movie | undefined {
  return movies.find((m) => m.id === id);
}

export function getUserById(id: string): User | undefined {
  return users.find((u) => u.id === id);
}

export function getReviewsByMovieId(movieId: string): Review[] {
  return reviews.filter((r) => r.movieId === movieId);
}

export function getActivitiesByUserId(userId: string): Activity[] {
  return activities.filter((a) => a.userId === userId);
}

export function calculateCinemaCompatibility(user1Id: string, user2Id: string): number {
  // Mock hesaplama - gerçek uygulamada ortak beğeniler, puanlar vb. kullanılır
  const random = Math.abs(
    parseInt(user1Id.split("-")[1]) - parseInt(user2Id.split("-")[1])
  );
  return Math.max(65, Math.min(98, 85 + (random % 15) - 7));
}