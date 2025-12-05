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
    Kullanıcının istatistiklerini döndürür.
    - Toplam film sayısı
    - Ortalama puan
    - Toplam arkadaş sayısı
    """
    from models import Friendship
    
    user_id = await get_current_user_id(token, db)
    
    # Toplam film sayısı
    total_films = db.query(Film).filter(Film.user_id == user_id).count()
    
    # Ortalama puan hesapla (sadece puan verilmiş filmler)
    films_with_rating = db.query(Film).filter(
        Film.user_id == user_id,
        Film.kisisel_puan.isnot(None)
    ).all()
    
    if films_with_rating:
        average_rating = sum(f.kisisel_puan for f in films_with_rating) / len(films_with_rating)
        average_rating = round(average_rating, 2)
    else:
        average_rating = None
    
    # Toplam arkadaş sayısı (kabul edilmiş arkadaşlıklar)
    total_friends = db.query(Friendship).filter(
        ((Friendship.user_id == user_id) | (Friendship.friend_id == user_id)) &
        (Friendship.status == "accepted")
    ).count()
    
    return {
        "total_films": total_films,
        "average_rating": average_rating,
        "total_friends": total_friends
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
