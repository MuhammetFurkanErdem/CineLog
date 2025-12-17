from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    """Kullanıcı tablosu - Email/Şifre veya Google OAuth ile giriş yapan kullanıcılar"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)  # Email/şifre ile kayıt için
    picture = Column(String, nullable=True)  # Profil resmi URL
    google_id = Column(String, unique=True, index=True, nullable=True)  # Google OAuth için (opsiyonel)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # İlişkiler
    films = relationship("Film", back_populates="user", cascade="all, delete-orphan")
    friendships_sent = relationship(
        "Friendship",
        foreign_keys="Friendship.user_id",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    friendships_received = relationship(
        "Friendship",
        foreign_keys="Friendship.friend_id",
        back_populates="friend",
        cascade="all, delete-orphan"
    )


class Film(Base):
    """Film tablosu - Kullanıcının izlediği filmler"""
    __tablename__ = "films"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tmdb_id = Column(Integer, nullable=False, index=True)  # TMDB film ID
    title = Column(String, nullable=False)
    poster_path = Column(String, nullable=True)
    release_date = Column(String, nullable=True)
    overview = Column(Text, nullable=True)
    
    # Kullanıcıya özel alanlar
    kisisel_puan = Column(Float, nullable=True)  # Kullanıcının verdiği puan (0-10)
    kisisel_yorum = Column(Text, nullable=True)  # Kullanıcının yorumu
    izlendi = Column(Boolean, default=False)  # İzlenme durumu
    is_favorite = Column(Boolean, default=False)  # Favori durumu
    is_watchlist = Column(Boolean, default=False)  # İzleme listesi durumu
    izlenme_tarihi = Column(DateTime, default=datetime.utcnow)
    
    # İlişkiler
    user = relationship("User", back_populates="films")
    
    # Composite index - bir kullanıcı aynı filmi birden fazla ekleyemez
    __table_args__ = (
        UniqueConstraint('user_id', 'tmdb_id', name='uq_user_film'),
        {'sqlite_autoincrement': True},
    )


class Friendship(Base):
    """Arkadaşlık tablosu - Kullanıcılar arası arkadaşlık ilişkileri"""
    __tablename__ = "friendships"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # İsteği gönderen
    friend_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # İsteği alan
    status = Column(String, default="pending")  
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # İlişkiler
    user = relationship("User", foreign_keys=[user_id], back_populates="friendships_sent")
    friend = relationship("User", foreign_keys=[friend_id], back_populates="friendships_received")
    
    __table_args__ = (
        {'sqlite_autoincrement': True},
    )


class ActivityLike(Base):
    """Aktivite beğeni tablosu - Kullanıcıların film aktivitelerini beğenmesi"""
    __tablename__ = "activity_likes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Beğenen kullanıcı
    film_id = Column(Integer, ForeignKey("films.id"), nullable=False)  # Beğenilen film aktivitesi
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # İlişkiler
    user = relationship("User")
    film = relationship("Film")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'film_id', name='uq_user_film_like'),
        {'sqlite_autoincrement': True},
    )


class ActivityComment(Base):
    """Aktivite yorum tablosu - Kullanıcıların film aktivitelerine yorum yapması"""
    __tablename__ = "activity_comments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Yorum yapan kullanıcı
    film_id = Column(Integer, ForeignKey("films.id"), nullable=False)  # Yorum yapılan film aktivitesi
    content = Column(Text, nullable=False)  # Yorum içeriği
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # İlişkiler
    user = relationship("User")
    film = relationship("Film")
    
    __table_args__ = (
        {'sqlite_autoincrement': True},
    )
