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


class UserUpdate(BaseModel):
    """Kullanıcı güncelleme için schema"""
    username: Optional[str] = None
    
    class Config:
        from_attributes = True


class UserStats(BaseModel):
    """Kullanıcı istatistikleri"""
    total_movies: int
    total_series: int
    average_rating: Optional[float] = None
    total_watch_time: int  # Dakika cinsinden
    total_reviews: int
    total_followers: int
    total_following: int
    movies_this_month: int
    movies_this_year: int
    series_watching: int
    series_completed: int
    total_watch_hours: int  # Saat cinsinden
    badges: list = []


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
    izlendi: bool = False
    is_favorite: bool = False
    is_watchlist: bool = False


class FilmUpdate(BaseModel):
    """Film güncelleme için schema"""
    kisisel_puan: Optional[float] = Field(None, ge=0, le=10)
    kisisel_yorum: Optional[str] = None
    izlendi: Optional[bool] = None
    is_favorite: Optional[bool] = None
    is_watchlist: Optional[bool] = None


class FilmResponse(FilmBase):
    """Film response schema"""
    id: int
    user_id: int
    kisisel_puan: Optional[float] = None
    kisisel_yorum: Optional[str] = None
    izlendi: bool
    is_favorite: bool
    is_watchlist: bool
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


class FriendshipWithUser(BaseModel):
    """Kullanıcı bilgisiyle birlikte arkadaşlık isteği"""
    id: int
    user_id: int
    friend_id: int
    status: str
    created_at: datetime
    user: UserResponse  # İsteği gönderen kullanıcı
    
    class Config:
        from_attributes = True


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


class RegisterRequest(BaseModel):
    """Kullanıcı kayıt isteği"""
    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(..., min_length=8)


class LoginRequest(BaseModel):
    """Kullanıcı giriş isteği"""
    username: str
    password: str


class AuthResponse(BaseModel):
    """Giriş/Kayıt başarılı response"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class UsernameCheckResponse(BaseModel):
    """Kullanıcı adı müsaitlik kontrolü"""
    available: bool
    message: str


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


# ==================== ACTIVITY SCHEMAS ====================

class ActivityLikeCreate(BaseModel):
    """Aktivite beğeni oluşturma"""
    film_id: int


class ActivityLikeResponse(BaseModel):
    """Aktivite beğeni response"""
    id: int
    user_id: int
    film_id: int
    created_at: datetime
    user: UserResponse
    
    class Config:
        from_attributes = True


class ActivityCommentCreate(BaseModel):
    """Aktivite yorum oluşturma"""
    film_id: int
    content: str


class ActivityCommentUpdate(BaseModel):
    """Aktivite yorum güncelleme"""
    content: str


class ActivityCommentResponse(BaseModel):
    """Aktivite yorum response"""
    id: int
    user_id: int
    film_id: int
    content: str
    created_at: datetime
    user: UserResponse
    
    class Config:
        from_attributes = True


class ActivityLikesAndComments(BaseModel):
    """Bir aktivitenin beğeni ve yorum sayıları"""
    like_count: int
    comment_count: int
    is_liked_by_me: bool
    likes: list[ActivityLikeResponse] = []
    comments: list[ActivityCommentResponse] = []
