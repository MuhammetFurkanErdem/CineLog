import { Link } from "react-router";
import { Home } from "lucide-react";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-8xl mb-4">🎬</div>
      <h1 className="text-4xl text-white mb-4">404</h1>
      <p className="text-gray-400 mb-6">
        Üzgünüz, aradığınız sayfa bulunamadı.
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all flex items-center gap-2"
      >
        <Home className="w-5 h-5" />
        Ana Sayfaya Dön
      </Link>
    </div>
  );
}
