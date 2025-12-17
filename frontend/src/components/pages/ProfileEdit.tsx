import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { ArrowLeft, Save, Upload, AlertCircle } from "lucide-react";
import axios from "axios";

export function ProfileEdit() {
  const navigate = useNavigate();
  const { currentUser, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: currentUser?.name || "",
    username: currentUser?.username || "",
    bio: currentUser?.bio || "",
    avatar: currentUser?.avatar || "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!currentUser) {
    navigate("/login");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      // Username değiştiyse backend'e gönder
      if (formData.username !== currentUser.username) {
        const token = localStorage.getItem("access_token");
        if (!token) {
          throw new Error("Token bulunamadı. Lütfen tekrar giriş yapın.");
        }

        // Backend'e username güncelleme isteği
        await axios.put(
          "http://127.0.0.1:8000/api/users/me",
          { username: formData.username },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      // localStorage'daki kullanıcı bilgilerini güncelle
      updateUser({
        name: formData.name,
        username: formData.username,
        bio: formData.bio,
        avatar: formData.avatar,
      });

      navigate("/profile");
    } catch (err: any) {
      console.error("Profil güncelleme hatası:", err);
      const errorMessage = err.response?.data?.detail || "Profil güncellenirken bir hata oluştu.";
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Dosya boyutu kontrolü (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Dosya boyutu 5MB'dan küçük olmalıdır.");
      return;
    }

    // Dosya tipi kontrolü
    if (!file.type.startsWith("image/")) {
      alert("Lütfen bir resim dosyası seçin.");
      return;
    }

    // Base64'e çevir ve formData'ya kaydet
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData({ ...formData, avatar: base64String });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Geri Dön
        </button>
        <h1 className="text-3xl font-bold text-white">Profili Düzenle</h1>
        <p className="text-gray-400 mt-2">Profil bilgilerinizi güncelleyin</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Avatar */}
        <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-purple-500/10">
          <label className="block text-sm font-medium text-gray-300 mb-4">
            Profil Fotoğrafı
          </label>
          <div className="flex items-center gap-6">
            <img
              src={formData.avatar || "/default-avatar.png"}
              alt="Avatar"
              className="w-24 h-24 rounded-full object-cover ring-4 ring-purple-500/30"
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={handleAvatarUpload}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-all border border-purple-500/30"
            >
              <Upload className="w-4 h-4" />
              Fotoğraf Yükle
            </button>
          </div>
        </div>

        {/* Name */}
        <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-purple-500/10">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            İsim
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            placeholder="Adınız"
            required
          />
        </div>

        {/* Username */}
        <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-purple-500/10">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Kullanıcı Adı
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            placeholder="kullanici_adi"
            required
          />
        </div>

        {/* Bio */}
        <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-purple-500/10">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Biyografi
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
            placeholder="Kendinizden bahsedin..."
          />
        </div>

        {/* Save Button */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="flex-1 px-6 py-3 bg-slate-800/50 hover:bg-slate-700/50 text-white rounded-xl transition-all"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {isSaving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}
