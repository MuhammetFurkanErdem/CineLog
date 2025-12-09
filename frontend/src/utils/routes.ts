import { createBrowserRouter } from "react-router";
import { Root } from "../components/layouts/Root";
import { Home } from "../components/pages/Home";
import { Discover } from "../components/pages/Discover";
import { Profile } from "../components/pages/Profile";
import { MovieDetail } from "../components/pages/MovieDetail";
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
      { path: "profile/:userId?", Component: Profile },
      { path: "movie/:movieId", Component: MovieDetail },
      { path: "friends", Component: Friends },
      { path: "stats", Component: Stats },
      { path: "*", Component: NotFound },
    ],
  },
]);
