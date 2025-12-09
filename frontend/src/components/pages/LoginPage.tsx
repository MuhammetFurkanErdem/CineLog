import { Card, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { Chrome, BarChart3, Users, Trophy } from "lucide-react";
import { TrendingMoviesCarousel } from "../shared/TrendingMoviesCarousel";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function LoginPage() {
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      // Backend'e Google token'ı gönder
      const response = await axios.post("http://127.0.0.1:8000/api/auth/google", {
        token: credentialResponse.credential,
      });

      // JWT token'ı localStorage'a kaydet
      localStorage.setItem("access_token", response.data.access_token);
      
      // Ana sayfaya yönlendir
      navigate("/");
    } catch (error) {
      console.error("Login failed:", error);
      alert("Giriş başarısız oldu. Lütfen tekrar deneyin.");
    }
  };

  const handleGoogleError = () => {
    console.error("Google login failed");
    alert("Google ile giriş başarısız oldu.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0118] via-[#1a0b2e] to-[#2d1b4e] overflow-x-hidden">
      <div className="container mx-auto px-4 py-16 space-y-16">
        {/* Hero Section */}
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-black leading-tight">
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
              İzleme Alışkanlıklarını Keşfet,
            </span>
            <br />
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Sinema Zevkini Karşılaştır
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-purple-200/80 max-w-3xl mx-auto font-light">
            CineLog ile film ve dizi arşivini oluştur, puanla ve sinema uyumunu ölç.
          </p>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_black"
              size="large"
              text="signin_with"
              shape="rectangular"
            />
          </div>
        </div>

        {/* Trending Movies Carousel */}
        <div className="max-w-7xl mx-auto">
          <TrendingMoviesCarousel />
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1: Stats */}
          <Card className="bg-white/5 backdrop-blur-xl border-purple-500/20 hover:bg-white/10 hover:border-purple-400/40 transition-all duration-500 group">
            <CardContent className="p-8 text-center space-y-5">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-teal-400 to-cyan-500 rounded-3xl flex items-center justify-center shadow-lg shadow-teal-500/30 group-hover:shadow-teal-500/60 transition-shadow duration-500">
                <BarChart3 className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-teal-400">Detaylı İstatistikler</h3>
              <p className="text-purple-200/60 text-base leading-relaxed">
                İzlediğin film ve dizilerin detaylı analizini gör, izleme alışkanlıklarını keşfet.
              </p>
            </CardContent>
          </Card>

          {/* Feature 2: Social */}
          <Card className="bg-white/5 backdrop-blur-xl border-purple-500/20 hover:bg-white/10 hover:border-purple-400/40 transition-all duration-500 group">
            <CardContent className="p-8 text-center space-y-5">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center shadow-lg shadow-yellow-500/30 group-hover:shadow-yellow-500/60 transition-shadow duration-500">
                <Users className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-yellow-400">Sosyal Uyum Skoru</h3>
              <p className="text-purple-200/60 text-base leading-relaxed">
                Arkadaşlarınla sinema zevkini karşılaştır, uyum skorunu hesapla.
              </p>
            </CardContent>
          </Card>

          {/* Feature 3: Badges */}
          <Card className="bg-white/5 backdrop-blur-xl border-purple-500/20 hover:bg-white/10 hover:border-purple-400/40 transition-all duration-500 group">
            <CardContent className="p-8 text-center space-y-5">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-pink-400 to-purple-500 rounded-3xl flex items-center justify-center shadow-lg shadow-pink-500/30 group-hover:shadow-pink-500/60 transition-shadow duration-500">
                <Trophy className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-pink-400">Rozet ve Ödüller</h3>
              <p className="text-purple-200/60 text-base leading-relaxed">
                İzleme hedeflerini tamamla, özel rozetler kazan ve koleksiyonunu genişlet.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="max-w-4xl mx-auto text-center pt-8">
          <p className="text-purple-300/40 text-sm">
            Giriş yaparak{" "}
            <a href="#" className="text-purple-400/80 hover:text-purple-300 underline transition-colors">
              Kullanım Koşulları
            </a>
            'nı ve{" "}
            <a href="#" className="text-purple-400/80 hover:text-purple-300 underline transition-colors">
              Gizlilik Politikası
            </a>
            'nı kabul etmiş olursunuz.
          </p>
        </div>
      </div>
    </div>
  );
}
