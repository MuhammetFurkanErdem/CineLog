import { createBrowserRouter } from "react-router";
import { Root } from "../components/layouts/Root";
import { Home } from "../components/pages/Home";
import { Discover } from "../components/pages/Discover";
import { Profile } from "../components/pages/Profile";
import { ProfileEdit } from "../components/pages/ProfileEdit";
import { MovieDetail } from "../components/pages/MovieDetail";
import { SeriesDetail } from "../components/pages/SeriesDetail";
import { AnimeDetail } from "../components/pages/AnimeDetail";
import { Friends } from "../components/pages/Friends";
import { Stats } from "../components/pages/Stats";
import { NotFound } from "../components/pages/NotFound";
import LoginPage from "../components/pages/LoginPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "discover", Component: Discover },
      { path: "profile/edit", Component: ProfileEdit },
      { path: "profile/:userId?", Component: Profile },
      { path: "movie/:movieId", Component: MovieDetail },
      { path: "series/:seriesId", Component: SeriesDetail },
      { path: "anime/:animeId", Component: AnimeDetail },
      { path: "friends", Component: Friends },
      { path: "stats", Component: Stats },
      { path: "*", Component: NotFound },
    ],
  },
]);
