from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import get_settings

settings = get_settings()

# Production'da processed_database_url kullan (PostgreSQL URL düzeltmesi)
database_url = settings.processed_database_url

# Veritabanı motoru oluştur
engine = create_engine(
    database_url,
    connect_args={"check_same_thread": False} if "sqlite" in database_url else {},
    pool_pre_ping=True,  # PostgreSQL için connection check
    pool_recycle=3600,   # PostgreSQL için connection recycle
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """
    Veritabanı session'ı için dependency.
    Her istek için yeni bir session oluşturur ve isteğin sonunda kapatır.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Veritabanı tablolarını oluşturur.
    Uygulama başlangıcında çağrılmalıdır.
    """
    from models import User, Film, Friendship, ActivityLike, ActivityComment  # Import burada circular import önlemek için
    Base.metadata.create_all(bind=engine)
