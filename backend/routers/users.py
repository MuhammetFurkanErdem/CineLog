from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, Film
from schemas import UserResponse, UserStats, FilmResponse
from config import get_settings

router = APIRouter()
settings = get_settings()


async def get_current_user_id(token: str, db: Session = Depends(get_db)) -> int:
    """Token'dan kullanıcı ID'sini döndürür"""
    from routers.auth import verify_token
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz token"
        )
    return user_id


@router.get("/me", response_model=UserResponse)
async def get_my_profile(token: str, db: Session = Depends(get_db)):
    """
    Kullanıcının kendi profil bilgilerini döndürür.
    """
    user_id = await get_current_user_id(token, db)
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı"
        )
    
    return user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    """
    Belirtilen kullanıcının profil bilgilerini döndürür.
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı"
        )
    
    return user


@router.get("/me/stats", response_model=UserStats)
async def get_my_stats(token: str, db: Session = Depends(get_db)):
    """
    Kullanıcının detaylı istatistiklerini döndürür.
    """
    from models import Friendship
    from datetime import datetime, timedelta
    from sqlalchemy import func, extract
    
    user_id = await get_current_user_id(token, db)
    
    # Toplam film sayısı
    total_movies = db.query(Film).filter(
        Film.user_id == user_id,
        Film.izlendi == True
    ).count()
    
    # Ortalama puan hesapla (sadece puan verilmiş filmler)
    films_with_rating = db.query(Film).filter(
        Film.user_id == user_id,
        Film.kisisel_puan.isnot(None)
    ).all()
    
    if films_with_rating:
        average_rating = sum(f.kisisel_puan for f in films_with_rating) / len(films_with_rating)
        average_rating = round(average_rating, 2)
    else:
        average_rating = 0.0
    
    # Yorum sayısı
    total_reviews = db.query(Film).filter(
        Film.user_id == user_id,
        Film.kisisel_yorum.isnot(None),
        Film.kisisel_yorum != ""
    ).count()
    
    # Arkadaş sayıları
    total_followers = db.query(Friendship).filter(
        Friendship.friend_id == user_id,
        Friendship.status == "accepted"
    ).count()
    
    total_following = db.query(Friendship).filter(
        Friendship.user_id == user_id,
        Friendship.status == "accepted"
    ).count()
    
    # Bu ay izlenen filmler
    now = datetime.utcnow()
    start_of_month = datetime(now.year, now.month, 1)
    movies_this_month = db.query(Film).filter(
        Film.user_id == user_id,
        Film.izlenme_tarihi >= start_of_month,
        Film.izlendi == True
    ).count()
    
    # Bu yıl izlenen filmler
    start_of_year = datetime(now.year, 1, 1)
    movies_this_year = db.query(Film).filter(
        Film.user_id == user_id,
        Film.izlenme_tarihi >= start_of_year,
        Film.izlendi == True
    ).count()
    
    # Rozetler (basit rozet sistemi)
    badges = []
    if total_movies >= 100:
        badges.append({"name": "🎬 Sinema Gurmesi", "rarity": "legendary"})
    elif total_movies >= 50:
        badges.append({"name": "🎬 Film Tutkunları", "rarity": "rare"})
    elif total_movies >= 10:
        badges.append({"name": "🎬 İlk Adım", "rarity": "common"})
    
    if total_reviews >= 50:
        badges.append({"name": "✍️ Eleştirmen", "rarity": "legendary"})
    elif total_reviews >= 20:
        badges.append({"name": "✍️ Yorum Yazarı", "rarity": "rare"})
    
    if average_rating and average_rating >= 8.5:
        badges.append({"name": "⭐ İyi Gözlü", "rarity": "rare"})
    
    # Tahmini izleme süresi (ortalama film 120 dakika)
    total_watch_time = total_movies * 120  # Dakika
    total_watch_hours = total_watch_time // 60  # Saat
    
    return {
        "total_movies": total_movies,
        "total_series": 0,  # Şimdilik sadece filmler var
        "average_rating": average_rating,
        "total_watch_time": total_watch_time,
        "total_reviews": total_reviews,
        "total_followers": total_followers,
        "total_following": total_following,
        "movies_this_month": movies_this_month,
        "movies_this_year": movies_this_year,
        "series_watching": 0,  # Şimdilik sadece filmler var
        "series_completed": 0,  # Şimdilik sadece filmler var
        "total_watch_hours": total_watch_hours,
        "badges": badges
    }


@router.get("/{user_id}/films", response_model=List[FilmResponse])
async def get_user_films(user_id: int, db: Session = Depends(get_db)):
    """
    Belirtilen kullanıcının film listesini döndürür.
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı"
        )
    
    films = db.query(Film).filter(Film.user_id == user_id).all()
    return films


@router.get("/search/{username}", response_model=List[UserResponse])
async def search_users(username: str, db: Session = Depends(get_db)):
    """
    Kullanıcı adına göre arama yapar.
    """
    users = db.query(User).filter(
        User.username.ilike(f"%{username}%")
    ).limit(20).all()
    
    return users
