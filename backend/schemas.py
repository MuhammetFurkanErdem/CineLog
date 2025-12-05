from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# ==================== USER SCHEMAS ====================

class UserBase(BaseModel):
    """Temel kullanıcı bilgileri"""
    username: str
    email: EmailStr


class UserCreate(UserBase):
    """Kullanıcı oluşturma için schema"""
    google_id: Optional[str] = None
    picture: Optional[str] = None


class UserResponse(UserBase):
    """Kullanıcı response schema"""
    id: int
    picture: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserStats(BaseModel):
    """Kullanıcı istatistikleri"""
    total_films: int
    average_rating: Optional[float] = None
    total_friends: int


# ==================== FILM SCHEMAS ====================

class FilmBase(BaseModel):
    """Temel film bilgileri"""
    tmdb_id: int
    title: str
    poster_path: Optional[str] = None
    release_date: Optional[str] = None
    overview: Optional[str] = None


class FilmCreate(FilmBase):
    """Film ekleme için schema"""
    kisisel_puan: Optional[float] = Field(None, ge=0, le=10)
    kisisel_yorum: Optional[str] = None
    izlendi: bool = True


class FilmUpdate(BaseModel):
    """Film güncelleme için schema"""
    kisisel_puan: Optional[float] = Field(None, ge=0, le=10)
    kisisel_yorum: Optional[str] = None
    izlendi: Optional[bool] = None


class FilmResponse(FilmBase):
    """Film response schema"""
    id: int
    user_id: int
    kisisel_puan: Optional[float] = None
    kisisel_yorum: Optional[str] = None
    izlendi: bool
    izlenme_tarihi: datetime
    
    class Config:
        from_attributes = True


# ==================== FRIENDSHIP SCHEMAS ====================

class FriendshipCreate(BaseModel):
    """Arkadaşlık isteği gönderme"""
    friend_id: int


class FriendshipResponse(BaseModel):
    """Arkadaşlık response schema"""
    id: int
    user_id: int
    friend_id: int
    status: str  # pending, accepted, rejected
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class FriendshipUpdate(BaseModel):
    """Arkadaşlık durumu güncelleme"""
    status: str = Field(..., pattern="^(accepted|rejected)$")


# ==================== AUTH SCHEMAS ====================

class Token(BaseModel):
    """JWT Token response"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token içindeki data"""
    user_id: Optional[int] = None
    email: Optional[str] = None


class GoogleAuthRequest(BaseModel):
    """Google OAuth için gelen token"""
    token: str


# ==================== SOCIAL SCHEMAS ====================

class CompatibilityScore(BaseModel):
    """İki kullanıcı arasındaki uyum skoru"""
    user1_id: int
    user2_id: int
    common_films: int
    user1_total_films: int
    user2_total_films: int
    compatibility_percentage: float


class FeedItem(BaseModel):
    """Sosyal akış için film öğesi"""
    user: UserResponse
    film: FilmResponse


# ==================== TMDB SCHEMAS ====================

class TMDBMovieSearch(BaseModel):
    """TMDB film arama sonucu"""
    id: int
    title: str
    poster_path: Optional[str] = None
    release_date: Optional[str] = None
    overview: Optional[str] = None
    vote_average: Optional[float] = None


class MovieRecommendation(BaseModel):
    """Film önerisi"""
    source_film: TMDBMovieSearch
    recommended_film: TMDBMovieSearch
