# CineLog Backend API

Film takip ve sosyal paylaşım uygulaması için FastAPI backend.

## 📁 Proje Yapısı

```
backend/
├── main.py          # Uygulama giriş noktası
├── database.py      # SQLAlchemy bağlantısı
├── models.py        # Veritabanı modelleri
├── schemas.py       # Pydantic şemaları
├── config.py        # Yapılandırma ayarları
├── requirements.txt # Python bağımlılıkları
└── routers/         # API endpoint'leri
    ├── auth.py      # Google OAuth giriş
    ├── movies.py    # Film arama, ekleme, öneri
    ├── users.py     # Kullanıcı profili, istatistikler
    └── social.py    # Arkadaşlık, feed, uyum skoru
```

## 🚀 Kurulum

### 1. Sanal ortam oluştur ve aktif et
```bash
python -m venv venv
.\venv\Scripts\activate  # Windows
```

### 2. Bağımlılıkları yükle
```bash
pip install -r requirements.txt
```

### 3. .env dosyası oluştur
`.env.example` dosyasını `.env` olarak kopyalayın ve gerekli bilgileri girin:

```env
DATABASE_URL=sqlite:///./cinelog.db
SECRET_KEY=your-super-secret-key-change-this
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
TMDB_API_KEY=your-tmdb-api-key
```

### 4. Uygulamayı çalıştır
```bash
uvicorn main:app --reload
```

API şu adreste çalışacaktır: `http://127.0.0.1:8000`

## 📚 API Dokümantasyonu

Uygulama çalıştıktan sonra:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

## 🔑 Endpoint'ler

### Authentication (`/api/auth`)
- `POST /google` - Google OAuth ile giriş
- `GET /me` - Mevcut kullanıcı bilgileri
- `POST /logout` - Çıkış

### Movies (`/api/movies`)
- `GET /search` - TMDB'den film ara
- `GET /{tmdb_id}` - Film detayları
- `POST /add` - Listeye film ekle
- `GET /my-list` - Kendi film listem
- `PUT /{film_id}` - Film güncelle
- `DELETE /{film_id}` - Film sil
- `GET /recommend/random` - Rastgele film önerisi

### Users (`/api/users`)
- `GET /me` - Kendi profilim
- `GET /{user_id}` - Kullanıcı profili
- `GET /me/stats` - İstatistiklerim
- `GET /{user_id}/films` - Kullanıcının filmleri
- `GET /search/{username}` - Kullanıcı ara

### Social (`/api/social`)
- `POST /friends/request` - Arkadaşlık isteği gönder
- `GET /friends/requests` - Gelen istekler
- `PUT /friends/requests/{id}` - İsteğe cevap ver
- `GET /friends` - Arkadaş listesi
- `DELETE /friends/{friend_id}` - Arkadaşlığı sonlandır
- `GET /compatibility/{friend_id}` - Uyum skoru hesapla
- `GET /feed` - Sosyal akış

## 🗄️ Veritabanı Modelleri

### User
- `username`, `email`, `picture`, `google_id`

### Film
- `tmdb_id`, `title`, `poster_path`
- `kisisel_puan`, `kisisel_yorum`, `izlendi`

### Friendship
- `user_id`, `friend_id`, `status` (pending/accepted/rejected)

## 🔒 Güvenlik

- JWT token authentication
- Google OAuth 2.0
- CORS yapılandırması (`http://127.0.0.1:5500`)

## 🧮 Özel Algoritmalar

### Uyum Skoru
İki kullanıcının ortak filmlerinin, toplam benzersiz filmlerine oranı:
```
uyum_yüzdesi = (ortak_filmler / toplam_benzersiz_filmler) * 100
```

### Film Önerisi
Kullanıcının listesinden rastgele film seçilir, TMDB'den benzer filmler aranır ve rastgele biri önerilir.

## 🛠️ Geliştirme

```bash
# Test için
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production için
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 📝 Notlar

- Veritabanı ilk çalıştırmada otomatik oluşturulur
- TMDB API anahtarı için: https://www.themoviedb.org/settings/api
- Google OAuth için: https://console.cloud.google.com/
