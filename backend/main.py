from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from config import get_settings
from database import init_db

# Router'ları import et
from routers import auth, movies, users, social, ai, external

# Ayarları yükle
settings = get_settings()

# FastAPI uygulamasını oluştur
app = FastAPI(
    title="CineLog API",
    description="Film takip ve sosyal paylaşım uygulaması",
    version="1.0.0"
)

# Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        # Google OAuth popup iletişimi için gerekli header'lar
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
        response.headers["Cross-Origin-Embedder-Policy"] = "unsafe-none"
        return response
    
# Middleware'leri ekle
app.add_middleware(SecurityHeadersMiddleware)

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Router'ları ekle
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(movies.router, prefix="/api/movies", tags=["Movies"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(social.router, prefix="/api/social", tags=["Social"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI Recommendations"])
app.include_router(external.router, prefix="/api/external", tags=["External APIs"])


@app.on_event("startup")
async def startup_event():
    """Uygulama başlangıcında veritabanını başlat"""
    init_db()
    print("✅ Veritabanı başlatıldı")
    
    # AI Recommendation Model'i eğit
    from routers.ai import startup_train_model
    await startup_train_model()


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
