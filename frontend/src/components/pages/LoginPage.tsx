import { useState, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { BarChart3, Users, Trophy, Eye, EyeOff, Check, X, Loader2, Mail, Lock, User } from "lucide-react";
import { TrendingMoviesCarousel } from "../shared/TrendingMoviesCarousel";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";

type TabType = "login" | "register";

export default function LoginPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("login");
  
  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  
  // Register form state
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");
  
  // Username availability check
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameMessage, setUsernameMessage] = useState("");
  const [usernameChecking, setUsernameChecking] = useState(false);
  
  // Email availability check
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [emailMessage, setEmailMessage] = useState("");
  
  // Password strength
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordMessage, setPasswordMessage] = useState("");

  // Check username availability with debounce
  useEffect(() => {
    if (registerUsername.length < 3) {
      setUsernameAvailable(null);
      setUsernameMessage("");
      return;
    }
    
    const timer = setTimeout(async () => {
      setUsernameChecking(true);
      try {
        const response = await api.get(`/auth/check-username/${registerUsername}`);
        setUsernameAvailable(response.data.available);
        setUsernameMessage(response.data.message);
      } catch (error: any) {
        console.error("Username check error:", error);
        setUsernameAvailable(false);
        setUsernameMessage(error.response?.data?.message || "Kontrol edilemedi");
      } finally {
        setUsernameChecking(false);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [registerUsername]);

  // Check email availability
  useEffect(() => {
    if (!registerEmail || !registerEmail.includes("@")) {
      setEmailAvailable(null);
      setEmailMessage("");
      return;
    }
    
    const timer = setTimeout(async () => {
      try {
        const response = await api.get(`/auth/check-email/${registerEmail}`);
        setEmailAvailable(response.data.available);
        setEmailMessage(response.data.message);
      } catch (error: any) {
        console.error("Email check error:", error);
        setEmailAvailable(null);
        setEmailMessage(error.response?.data?.message || "Kontrol edilemedi");
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [registerEmail]);

  // Calculate password strength
  useEffect(() => {
    if (!registerPassword) {
      setPasswordStrength(0);
      setPasswordMessage("");
      return;
    }
    
    let strength = 0;
    const checks = [];
    
    if (registerPassword.length >= 8) {
      strength += 25;
      checks.push("✓ 8+ karakter");
    } else {
      checks.push("✗ 8+ karakter");
    }
    
    if (/[A-Z]/.test(registerPassword)) {
      strength += 25;
      checks.push("✓ Büyük harf");
    } else {
      checks.push("✗ Büyük harf");
    }
    
    if (/[a-z]/.test(registerPassword)) {
      strength += 25;
      checks.push("✓ Küçük harf");
    } else {
      checks.push("✗ Küçük harf");
    }
    
    if (/[0-9]/.test(registerPassword)) {
      strength += 25;
      checks.push("✓ Rakam");
    } else {
      checks.push("✗ Rakam");
    }
    
    setPasswordStrength(strength);
    setPasswordMessage(checks.join(" | "));
  }, [registerPassword]);

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) return "bg-red-500";
    if (passwordStrength <= 50) return "bg-orange-500";
    if (passwordStrength <= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 25) return "Zayıf";
    if (passwordStrength <= 50) return "Orta";
    if (passwordStrength <= 75) return "İyi";
    return "Güçlü";
  };

  const saveUserToStorage = async () => {
    try {
      const userResponse = await api.get("/auth/me");
      
      const userData = {
        id: userResponse.data.id,
        username: userResponse.data.username,
        email: userResponse.data.email,
        avatar: userResponse.data.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userResponse.data.username}`,
        joinDate: userResponse.data.created_at,
        bio: "",
        socialLinks: { twitter: "", letterboxd: "", imdb: "" },
        stats: { moviesWatched: 0, seriesWatched: 0, animeWatched: 0, totalHours: 0, favoriteGenres: [] },
        favoriteMovies: [],
        badges: []
      };
      
      localStorage.setItem("currentUser", JSON.stringify(userData));
    } catch (error) {
      console.error("Failed to fetch user info:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    
    try {
      const response = await api.post("/auth/login", {
        username: loginUsername,
        password: loginPassword
      });
      
      const accessToken = response.data.access_token;
      localStorage.setItem("access_token", accessToken);
      
      await saveUserToStorage();
      navigate("/");
    } catch (error: any) {
      const message = error.response?.data?.detail || "Giriş başarısız oldu";
      setLoginError(message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterError("");
    
    // Validations
    if (registerPassword !== registerPasswordConfirm) {
      setRegisterError("Şifreler eşleşmiyor");
      setRegisterLoading(false);
      return;
    }
    
    if (passwordStrength < 100) {
      setRegisterError("Şifre gereksinimleri karşılanmıyor");
      setRegisterLoading(false);
      return;
    }
    
    if (!usernameAvailable) {
      setRegisterError("Kullanıcı adı uygun değil");
      setRegisterLoading(false);
      return;
    }
    
    if (emailAvailable === false) {
      setRegisterError("Bu email adresi zaten kullanılıyor");
      setRegisterLoading(false);
      return;
    }
    
    try {
      const response = await api.post("/auth/register", {
        username: registerUsername,
        email: registerEmail,
        password: registerPassword
      });
      
      const accessToken = response.data.access_token;
      localStorage.setItem("access_token", accessToken);
      
      await saveUserToStorage();
      navigate("/");
    } catch (error: any) {
      const message = error.response?.data?.detail || "Kayıt başarısız oldu";
      setRegisterError(message);
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const response = await api.post("/auth/google", {
        token: credentialResponse.credential,
      });

      const accessToken = response.data.access_token;
      localStorage.setItem("access_token", accessToken);
      
      await saveUserToStorage();
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
      <div className="container mx-auto px-4 py-12 space-y-12">
        {/* Hero Section */}
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-black leading-tight">
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
              CineLog
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-purple-200/80 max-w-2xl mx-auto font-light">
            Film ve dizi arşivini oluştur, puanla ve sinema zevkini karşılaştır.
          </p>
        </div>

        {/* Auth Card */}
        <div className="max-w-md mx-auto">
          <Card className="bg-white/5 backdrop-blur-xl border-purple-500/20 overflow-hidden">
            {/* Tab Header */}
            <div className="flex border-b border-purple-500/20">
              <button
                onClick={() => setActiveTab("login")}
                className={`flex-1 py-4 text-center font-semibold transition-all ${
                  activeTab === "login"
                    ? "bg-purple-500/20 text-purple-300 border-b-2 border-purple-500"
                    : "text-gray-400 hover:text-gray-300 hover:bg-white/5"
                }`}
              >
                Giriş Yap
              </button>
              <button
                onClick={() => setActiveTab("register")}
                className={`flex-1 py-4 text-center font-semibold transition-all ${
                  activeTab === "register"
                    ? "bg-purple-500/20 text-purple-300 border-b-2 border-purple-500"
                    : "text-gray-400 hover:text-gray-300 hover:bg-white/5"
                }`}
              >
                Kayıt Ol
              </button>
            </div>

            <CardContent className="p-6 space-y-6">
              {/* Login Form */}
              {activeTab === "login" && (
                <form onSubmit={handleLogin} className="space-y-4">
                  {loginError && (
                    <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                      {loginError}
                    </div>
                  )}
                  
                  {/* Username Input */}
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Kullanıcı Adı veya Email</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        placeholder="kullaniciadi veya email@ornek.com"
                        className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Şifre</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-12 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-purple-500 focus:ring-purple-500"
                    />
                    <label htmlFor="rememberMe" className="text-sm text-gray-400">Beni hatırla</label>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loginLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Giriş yapılıyor...
                      </>
                    ) : (
                      "Giriş Yap"
                    )}
                  </button>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-[#1a0b2e] text-gray-500">veya</span>
                    </div>
                  </div>

                  {/* Google Login */}
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
                </form>
              )}

              {/* Register Form */}
              {activeTab === "register" && (
                <form onSubmit={handleRegister} className="space-y-4">
                  {registerError && (
                    <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                      {registerError}
                    </div>
                  )}
                  
                  {/* Username Input */}
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Kullanıcı Adı</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        value={registerUsername}
                        onChange={(e) => setRegisterUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        placeholder="kullaniciadi"
                        className="w-full pl-10 pr-12 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                        required
                        minLength={3}
                        maxLength={30}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {usernameChecking && <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />}
                        {!usernameChecking && usernameAvailable === true && <Check className="w-5 h-5 text-green-500" />}
                        {!usernameChecking && usernameAvailable === false && <X className="w-5 h-5 text-red-500" />}
                      </div>
                    </div>
                    {usernameMessage && (
                      <p className={`text-xs ${usernameAvailable ? "text-green-400" : "text-red-400"}`}>
                        {usernameMessage}
                      </p>
                    )}
                  </div>

                  {/* Email Input */}
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="email"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        placeholder="email@ornek.com"
                        className="w-full pl-10 pr-12 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                        required
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {emailAvailable === true && <Check className="w-5 h-5 text-green-500" />}
                        {emailAvailable === false && <X className="w-5 h-5 text-red-500" />}
                      </div>
                    </div>
                    {emailMessage && !emailAvailable && (
                      <p className="text-xs text-red-400">{emailMessage}</p>
                    )}
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Şifre</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type={showRegisterPassword ? "text" : "password"}
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-12 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showRegisterPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    
                    {/* Password Strength */}
                    {registerPassword && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${getPasswordStrengthColor()}`}
                              style={{ width: `${passwordStrength}%` }}
                            />
                          </div>
                          <span className={`text-xs ${passwordStrength === 100 ? "text-green-400" : "text-gray-400"}`}>
                            {getPasswordStrengthText()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{passwordMessage}</p>
                      </div>
                    )}
                  </div>

                  {/* Password Confirm Input */}
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Şifre Tekrar</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type={showRegisterPassword ? "text" : "password"}
                        value={registerPasswordConfirm}
                        onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-12 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                        required
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {registerPasswordConfirm && (
                          registerPassword === registerPasswordConfirm 
                            ? <Check className="w-5 h-5 text-green-500" />
                            : <X className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    </div>
                    {registerPasswordConfirm && registerPassword !== registerPasswordConfirm && (
                      <p className="text-xs text-red-400">Şifreler eşleşmiyor</p>
                    )}
                  </div>

                  {/* Register Button */}
                  <button
                    type="submit"
                    disabled={
                      registerLoading || 
                      passwordStrength < 100 || 
                      !usernameAvailable || 
                      emailAvailable === false ||
                      !registerEmail ||
                      registerPassword !== registerPasswordConfirm
                    }
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {registerLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Kayıt yapılıyor...
                      </>
                    ) : (
                      "Kayıt Ol"
                    )}
                  </button>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-[#1a0b2e] text-gray-500">veya</span>
                    </div>
                  </div>

                  {/* Google Login */}
                  <div className="flex justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      theme="filled_black"
                      size="large"
                      text="signup_with"
                      shape="rectangular"
                    />
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
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
