from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List

from database import get_db
from models import User, Film, Friendship
from schemas import (
    FriendshipCreate, 
    FriendshipResponse, 
    FriendshipUpdate,
    CompatibilityScore,
    FeedItem,
    UserResponse,
    FilmResponse
)
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


@router.post("/friends/request", response_model=FriendshipResponse)
async def send_friend_request(
    friend_data: FriendshipCreate,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Arkadaşlık isteği gönderir.
    """
    user_id = await get_current_user_id(token, db)
    
    # Kendine istek gönderilemez
    if user_id == friend_data.friend_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kendinize arkadaşlık isteği gönderemezsiniz"
        )
    
    # Hedef kullanıcı var mı kontrol et
    friend = db.query(User).filter(User.id == friend_data.friend_id).first()
    if not friend:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı"
        )
    
    # Daha önce istek gönderilmiş mi kontrol et
    existing = db.query(Friendship).filter(
        or_(
            and_(Friendship.user_id == user_id, Friendship.friend_id == friend_data.friend_id),
            and_(Friendship.user_id == friend_data.friend_id, Friendship.friend_id == user_id)
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu kullanıcıyla zaten bir arkadaşlık ilişkiniz var"
        )
    
    # Yeni arkadaşlık isteği oluştur
    friendship = Friendship(
        user_id=user_id,
        friend_id=friend_data.friend_id,
        status="pending"
    )
    
    db.add(friendship)
    db.commit()
    db.refresh(friendship)
    
    return friendship


@router.get("/friends/requests", response_model=List[FriendshipResponse])
async def get_friend_requests(token: str, db: Session = Depends(get_db)):
    """
    Kullanıcıya gelen arkadaşlık isteklerini döndürür.
    """
    user_id = await get_current_user_id(token, db)
    
    requests = db.query(Friendship).filter(
        Friendship.friend_id == user_id,
        Friendship.status == "pending"
    ).all()
    
    return requests


@router.put("/friends/requests/{friendship_id}", response_model=FriendshipResponse)
async def respond_to_friend_request(
    friendship_id: int,
    response: FriendshipUpdate,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Arkadaşlık isteğini kabul eder veya reddeder.
    """
    user_id = await get_current_user_id(token, db)
    
    friendship = db.query(Friendship).filter(
        Friendship.id == friendship_id,
        Friendship.friend_id == user_id
    ).first()
    
    if not friendship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arkadaşlık isteği bulunamadı"
        )
    
    friendship.status = response.status
    db.commit()
    db.refresh(friendship)
    
    return friendship


@router.get("/friends", response_model=List[UserResponse])
async def get_friends(token: str, db: Session = Depends(get_db)):
    """
    Kullanıcının arkadaş listesini döndürür (kabul edilmiş arkadaşlıklar).
    """
    user_id = await get_current_user_id(token, db)
    
    # Kullanıcının hem gönderdiği hem aldığı kabul edilmiş arkadaşlıkları bul
    friendships = db.query(Friendship).filter(
        or_(
            Friendship.user_id == user_id,
            Friendship.friend_id == user_id
        ),
        Friendship.status == "accepted"
    ).all()
    
    # Arkadaş ID'lerini topla
    friend_ids = []
    for friendship in friendships:
        if friendship.user_id == user_id:
            friend_ids.append(friendship.friend_id)
        else:
            friend_ids.append(friendship.user_id)
    
    # Arkadaşları getir
    friends = db.query(User).filter(User.id.in_(friend_ids)).all()
    
    return friends


@router.delete("/friends/{friend_id}")
async def remove_friend(
    friend_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Arkadaşlığı sonlandırır.
    """
    user_id = await get_current_user_id(token, db)
    
    friendship = db.query(Friendship).filter(
        or_(
            and_(Friendship.user_id == user_id, Friendship.friend_id == friend_id),
            and_(Friendship.user_id == friend_id, Friendship.friend_id == user_id)
        ),
        Friendship.status == "accepted"
    ).first()
    
    if not friendship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arkadaşlık bulunamadı"
        )
    
    db.delete(friendship)
    db.commit()
    
    return {"message": "Arkadaşlık başarıyla sonlandırıldı"}


@router.get("/compatibility/{friend_id}", response_model=CompatibilityScore)
async def get_compatibility_score(
    friend_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """
    İki kullanıcı arasındaki uyum skorunu hesaplar.
    Ortak izlenen filmlerin yüzdesini döndürür.
    """
    user_id = await get_current_user_id(token, db)
    
    # Arkadaş var mı kontrol et
    friend = db.query(User).filter(User.id == friend_id).first()
    if not friend:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı"
        )
    
    # Her iki kullanıcının filmlerini al
    user_films = db.query(Film).filter(Film.user_id == user_id).all()
    friend_films = db.query(Film).filter(Film.user_id == friend_id).all()
    
    # TMDB ID'lerini set olarak al
    user_tmdb_ids = {film.tmdb_id for film in user_films}
    friend_tmdb_ids = {film.tmdb_id for film in friend_films}
    
    # Ortak filmleri bul
    common_films = user_tmdb_ids.intersection(friend_tmdb_ids)
    
    # Uyum skorunu hesapla
    total_unique_films = len(user_tmdb_ids.union(friend_tmdb_ids))
    
    if total_unique_films == 0:
        compatibility_percentage = 0.0
    else:
        compatibility_percentage = (len(common_films) / total_unique_films) * 100
        compatibility_percentage = round(compatibility_percentage, 2)
    
    return {
        "user1_id": user_id,
        "user2_id": friend_id,
        "common_films": len(common_films),
        "user1_total_films": len(user_films),
        "user2_total_films": len(friend_films),
        "compatibility_percentage": compatibility_percentage
    }


@router.get("/feed", response_model=List[FeedItem])
async def get_social_feed(
    token: str,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Arkadaşların son eklediği filmleri döndürür (sosyal akış).
    """
    user_id = await get_current_user_id(token, db)
    
    # Arkadaşları bul
    friendships = db.query(Friendship).filter(
        or_(
            Friendship.user_id == user_id,
            Friendship.friend_id == user_id
        ),
        Friendship.status == "accepted"
    ).all()
    
    friend_ids = []
    for friendship in friendships:
        if friendship.user_id == user_id:
            friend_ids.append(friendship.friend_id)
        else:
            friend_ids.append(friendship.user_id)
    
    if not friend_ids:
        return []
    
    # Arkadaşların son eklediği filmleri getir
    films = db.query(Film).filter(
        Film.user_id.in_(friend_ids)
    ).order_by(Film.izlenme_tarihi.desc()).limit(limit).all()
    
    # Feed item'ları oluştur
    feed_items = []
    for film in films:
        user = db.query(User).filter(User.id == film.user_id).first()
        if user:
            feed_items.append({
                "user": user,
                "film": film
            })
    
    return feed_items
