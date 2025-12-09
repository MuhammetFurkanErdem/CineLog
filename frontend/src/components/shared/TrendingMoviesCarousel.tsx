import { Card, CardContent } from "../ui/Card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import { ImageWithFallback } from "./ImageWithFallback";
import { Star } from "lucide-react";

interface Movie {
  id: number;
  title: string;
  poster: string;
  rating: number;
}

const TRENDING_MOVIES: Movie[] = [
  {
    id: 1,
    title: "Inception",
    poster: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    rating: 8.8,
  },
  {
    id: 2,
    title: "The Dark Knight",
    poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    rating: 9.0,
  },
  {
    id: 3,
    title: "Interstellar",
    poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    rating: 8.6,
  },
  {
    id: 4,
    title: "Pulp Fiction",
    poster: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    rating: 8.9,
  },
  {
    id: 5,
    title: "Fight Club",
    poster: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    rating: 8.8,
  },
  {
    id: 6,
    title: "Forrest Gump",
    poster: "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
    rating: 8.8,
  },
  {
    id: 7,
    title: "The Matrix",
    poster: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    rating: 8.7,
  },
  {
    id: 8,
    title: "Goodfellas",
    poster: "https://image.tmdb.org/t/p/w500/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg",
    rating: 8.7,
  },
  {
    id: 9,
    title: "The Shawshank Redemption",
    poster: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
    rating: 9.3,
  },
  {
    id: 10,
    title: "The Godfather",
    poster: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    rating: 9.2,
  },
  {
    id: 11,
    title: "Parasite",
    poster: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    rating: 8.6,
  },
  {
    id: 12,
    title: "Whiplash",
    poster: "https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg",
    rating: 8.5,
  },
  {
    id: 13,
    title: "The Prestige",
    poster: "https://image.tmdb.org/t/p/w500/tRNlZbgNCNOpLpbPEz5L8G8A0JN.jpg",
    rating: 8.5,
  },
  {
    id: 14,
    title: "Gladiator",
    poster: "https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg",
    rating: 8.5,
  },
  {
    id: 15,
    title: "The Green Mile",
    poster: "https://image.tmdb.org/t/p/w500/velWPhVMQeQKcxggNEU8YmIo52R.jpg",
    rating: 8.6,
  },
];

export function TrendingMoviesCarousel() {
  return (
    <div className="w-full space-y-4 mb-8">
      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
        <span className="text-3xl">🔥</span>
        Şu An Popüler
      </h2>

      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {TRENDING_MOVIES.map((movie) => (
            <CarouselItem
              key={movie.id}
              className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6"
            >
              <Card className="bg-white/5 backdrop-blur-sm border-purple-500/20 hover:bg-white/10 hover:border-purple-500/40 transition-all duration-300 group cursor-pointer overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative aspect-[2/3] overflow-hidden">
                    <ImageWithFallback
                      src={movie.poster}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    
                    {/* Rating Badge */}
                    <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-white text-xs font-semibold">
                        {movie.rating}
                      </span>
                    </div>

                    {/* Gradient Overlay for Title */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3">
                      <h3 className="text-white text-sm font-semibold line-clamp-2">
                        {movie.title}
                      </h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-4 bg-purple-600/80 hover:bg-purple-600 border-purple-500" />
        <CarouselNext className="hidden md:flex -right-4 bg-purple-600/80 hover:bg-purple-600 border-purple-500" />
      </Carousel>
    </div>
  );
}
