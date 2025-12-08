import { createBrowserRouter } from "react-router";
import { Root } from "../components/Root";
import { Home } from "../components/Home";
import { Discover } from "../components/Discover";
import { Profile } from "../components/Profile";
import { MovieDetail } from "../components/MovieDetail";
import { Friends } from "../components/Friends";
import { Stats } from "../components/Stats";
import { NotFound } from "../components/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "discover", Component: Discover },
      { path: "profile/:userId?", Component: Profile },
      { path: "movie/:movieId", Component: MovieDetail },
      { path: "friends", Component: Friends },
      { path: "stats", Component: Stats },
      { path: "*", Component: NotFound },
    ],
  },
]);
