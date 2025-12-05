from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import get_settings
from database import init_db

# Router'ları import et
from routers import auth, movies, users, social

# Ayarları yükle
settings = get_settings()

# FastAPI uygulamasını oluştur
app = FastAPI(
    title="CineLog API",
    description="Film takip ve sosyal paylaşım uygulaması",
    version="1.0.0"
)

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,  # Frontend URL'leri
    allow_credentials=True,
    allow_methods=["*"],  # Tüm HTTP metodlarına izin ver
    allow_headers=["*"],  # Tüm header'lara izin ver
)

# Router'ları ekle
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(movies.router, prefix="/api/movies", tags=["Movies"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(social.router, prefix="/api/social", tags=["Social"])


@app.on_event("startup")
async def startup_event():
    """Uygulama başlangıcında veritabanını başlat"""
    init_db()
    print("✅ Veritabanı başlatıldı")


@app.get("/")
async def root():
    """API ana endpoint"""
    return {
        "message": "CineLog API'ye hoş geldiniz!",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Sağlık kontrolü endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
