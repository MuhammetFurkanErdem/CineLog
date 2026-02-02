from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    """Uygulama ayarları - .env dosyasından yüklenir"""
    
    # Database - Production'da PostgreSQL, development'ta SQLite
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./cinelog.db")
    
    @property
    def processed_database_url(self) -> str:
        """PostgreSQL URL düzeltmesi (Railway/Heroku için)"""
        if self.database_url.startswith("postgres://"):
            return self.database_url.replace("postgres://", "postgresql://", 1)
        return self.database_url
    
    # JWT ayarları
    secret_key: str = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Google OAuth ayarları
    google_client_id: str = os.getenv("GOOGLE_CLIENT_ID", "")
    google_client_secret: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    google_redirect_uri: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:5174/callback")
    
    # TMDB API ayarları
    tmdb_api_key: str = os.getenv("TMDB_API_KEY", "")
    tmdb_base_url: str = "https://api.themoviedb.org/3"
    
    # CORS ayarları - Production ve Development
    cors_origins: list = [
        "http://localhost:5173",
        "http://localhost:5174", 
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        # Production domains
        "https://furkanerdem.me",
        "https://www.furkanerdem.me",
        "http://furkanerdem.me",
        "http://www.furkanerdem.me",
        "https://cinelog.furkanerdem.me",
        "https://www.cinelog.furkanerdem.me",
        # Vercel (tüm preview deployments dahil)
        "https://cinelog.vercel.app",
        "https://cine-log.vercel.app",
        # Vercel preview URLs
        "https://cinelog-git-main-muhammetfurkanerdems-projects.vercel.app",
        "https://cinelog-muhammetfurkanerdems-projects.vercel.app",
    ]
    
    # Environment
    environment: str = os.getenv("ENVIRONMENT", "development")
    
    @property
    def is_production(self) -> bool:
        return self.environment == "production"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings():
    """Ayarları singleton olarak döndürür"""
    return Settings()
