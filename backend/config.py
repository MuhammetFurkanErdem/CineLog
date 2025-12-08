from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Uygulama ayarları - .env dosyasından yüklenir"""
    
    # Veritabanı ayarları
    database_url: str = "sqlite:///./cinelog.db"
    
    # JWT ayarları
    secret_key: str = "your-secret-key-change-this-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Google OAuth ayarları
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:5174/callback"
    
    # TMDB API ayarları
    tmdb_api_key: str = ""
    tmdb_base_url: str = "https://api.themoviedb.org/3"
    
    # CORS ayarları
    cors_origins: list = ["http://localhost:5174", "http://127.0.0.1:5174"]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings():
    """Ayarları singleton olarak döndürür"""
    return Settings()
