from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional, Union

from database import get_db
from models import User, Film, Friendship, ActivityLike, ActivityComment
from schemas import (
    FriendshipCreate, 
    FriendshipResponse, 
    FriendshipUpdate,
    FriendshipWithUser,
    CompatibilityScore,
    FeedItem,
    UserResponse,
    FilmResponse,
    ActivityLikeCreate,
    ActivityLikeResponse,
    ActivityCommentCreate,
    ActivityCommentResponse,
    ActivityLikesAndComments
)
from config import get_settings

router = APIRouter()
settings = get_settings()


async def get_current_user_id(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> int:
    """Authorization header'dan token'ı alır ve kullanıcı ID'sini döndürür"""
    from routers.auth import verify_token
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token bulunamadı"
        )
    
    token = authorization.replace("Bearer ", "")
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
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None)
):
    """
    Arkadaşlık isteği gönderir.
    """
    user_id = await get_current_user_id(authorization, db)
    
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
    
    # Daha önce aktif/bekleyen istek var mı kontrol et (rejected kayıtlar hariç)
    existing = db.query(Friendship).filter(
        or_(
            and_(Friendship.user_id == user_id, Friendship.friend_id == friend_data.friend_id),
            and_(Friendship.user_id == friend_data.friend_id, Friendship.friend_id == user_id)
        ),
        or_(
            Friendship.status == "pending",
            Friendship.status == "accepted"
        )
    ).first()
    
    if existing:
        if existing.status == "pending":
            detail = "Bu kullanıcıya zaten bir arkadaşlık isteği gönderdınız veya bu kullanıcıdan bir istek bekliyor"
        else:
            detail = "Bu kullanıcıyla zaten arkadaşsınız"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
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


@router.get("/friends/requests", response_model=List[FriendshipWithUser])
async def get_friend_requests(
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None)
):
    """
    Kullanıcıya gelen arkadaşlık isteklerini döndürür.
    İsteği gönderen kullanıcı bilgileriyle birlikte.
    """
    user_id = await get_current_user_id(authorization, db)
    
    requests = db.query(Friendship).filter(
        Friendship.friend_id == user_id,
        Friendship.status == "pending"
    ).all()
    
    # Her istek için kullanıcı bilgisini ekle
    result = []
    for request in requests:
        user = db.query(User).filter(User.id == request.user_id).first()
        if user:
            result.append({
                "id": request.id,
                "user_id": request.user_id,
                "friend_id": request.friend_id,
                "status": request.status,
                "created_at": request.created_at,
                "user": user
            })
    
    return result


@router.put("/friends/requests/{friendship_id}")
async def respond_to_friend_request(
    friendship_id: int,
    response: FriendshipUpdate,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None)
):
    """
    Arkadaşlık isteğini kabul eder veya reddeder.
    MUTUAL FRIENDSHIP (Facebook-style): Kabul edilince çift yönlü arkadaşlık oluşur.
    Reddedilince kayıt silinir, böylece tekrar istek gönderilebilir.
    """
    user_id = await get_current_user_id(authorization, db)
    
    friendship = db.query(Friendship).filter(
        Friendship.id == friendship_id,
        Friendship.friend_id == user_id
    ).first()
    
    if not friendship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arkadaşlık isteği bulunamadı"
        )
    
    # Eğer istek reddedildiyse, kaydı sil (tekrar istek gönderilebilsin)
    if response.status == "rejected":
        db.delete(friendship)
        db.commit()
        return {"message": "Arkadaşlık isteği reddedildi"}
    
    # Eğer istek kabul edildiyse, çift yönlü arkadaşlık oluştur (MUTUAL)
    friendship.status = "accepted"
    
    # Ters yönde de bir Friendship kaydı oluştur (karşılıklı arkadaşlık için)
    reverse_friendship = db.query(Friendship).filter(
        Friendship.user_id == user_id,
        Friendship.friend_id == friendship.user_id
    ).first()
    
    if not reverse_friendship:
        reverse_friendship = Friendship(
            user_id=user_id,
            friend_id=friendship.user_id,
            status="accepted"
        )
        db.add(reverse_friendship)
    else:
        reverse_friendship.status = "accepted"
    
    db.commit()
    db.refresh(friendship)
    
    return friendship


@router.get("/friends", response_model=List[UserResponse])
async def get_following(
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None)
):
    """
    Kullanıcının bağlantılarını döndürür:
    - Benim takip ettiklerim
    - Beni takip edenler
    Her iki yönden de kabul edilmiş ilişkileri içerir.
    """
    user_id = await get_current_user_id(authorization, db)
    
    # Benim takip ettiklerim
    following_ids = db.query(Friendship.friend_id).filter(
        Friendship.user_id == user_id,
        Friendship.status == "accepted"
    ).all()
    following_ids = [f[0] for f in following_ids]
    
    # Beni takip edenler
    follower_ids = db.query(Friendship.user_id).filter(
        Friendship.friend_id == user_id,
        Friendship.status == "accepted"
    ).all()
    follower_ids = [f[0] for f in follower_ids]
    
    # Her iki listeden unique ID'leri birleştir
    friend_ids = list(set(following_ids + follower_ids))
    
    if not friend_ids:
        return []
    
    # Kullanıcıları getir
    friends = db.query(User).filter(User.id.in_(friend_ids)).all()
    
    return friends


@router.get("/friends/status/{target_user_id}")
async def get_friendship_status(
    target_user_id: int,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None)
):
    """
    Belirli bir kullanıcıyla arkadaşlık durumunu kontrol eder.
    Returns: isFollowing, isFollower, isFriend, hasPendingRequest
    """
    user_id = await get_current_user_id(authorization, db)
    
    # Benim ona gönderdiğim istek
    my_request = db.query(Friendship).filter(
        Friendship.user_id == user_id,
        Friendship.friend_id == target_user_id
    ).first()
    
    # Onun bana gönderdiği istek
    their_request = db.query(Friendship).filter(
        Friendship.user_id == target_user_id,
        Friendship.friend_id == user_id
    ).first()
    
    is_following = my_request and my_request.status == "accepted"
    is_follower = their_request and their_request.status == "accepted"
    is_friend = is_following and is_follower  # Karşılıklı takip
    has_pending_sent = my_request and my_request.status == "pending"
    has_pending_received = their_request and their_request.status == "pending"
    
    return {
        "isFollowing": is_following,
        "isFollower": is_follower,
        "isFriend": is_friend,
        "hasPendingSent": has_pending_sent,
        "hasPendingReceived": has_pending_received
    }


@router.delete("/friends/{friend_id}")
async def unfollow_user(
    friend_id: int,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None)
):
    """
    Arkadaşlıktan çıkar (MUTUAL FRIENDSHIP - her iki yönden de ilişki kaldırılır).
    """
    user_id = await get_current_user_id(authorization, db)
    
    # Her iki yönden de friendship kayıtlarını bul ve sil
    friendships = db.query(Friendship).filter(
        or_(
            and_(Friendship.user_id == user_id, Friendship.friend_id == friend_id),
            and_(Friendship.user_id == friend_id, Friendship.friend_id == user_id)
        ),
        Friendship.status == "accepted"
    ).all()
    
    if not friendships:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bu kullanıcıyla arkadaş değilsiniz"
        )
    
    # Her iki kaydı da sil (mutual friendship kaldırma)
    for friendship in friendships:
        db.delete(friendship)
    
    db.commit()
    
    return {"message": "Arkadaşlıktan çıkıldı"}


@router.get("/compatibility/{friend_id}", response_model=CompatibilityScore)
async def get_compatibility_score(
    friend_id: int,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None)
):
    """
    İki kullanıcı arasındaki uyum skorunu hesaplar.
    Ortak izlenen filmlerin yüzdesini döndürür.
    """
    user_id = await get_current_user_id(authorization, db)
    
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
    limit: int = 20,
    source: str = "all",  # all, friends, me
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None)
):
    """
    Son eklenen filmleri döndürür (sosyal akış).
    source: 'all' = herkes, 'friends' = sadece arkadaşlar, 'me' = sadece ben
    """
    user_id = await get_current_user_id(authorization, db)
    print(f"🔍 Feed request - user_id: {user_id}, source: {source}")
    
    # Kaynak türüne göre filmleri getir
    if source == "me":
        # Sadece kendi filmlerim
        films = db.query(Film).filter(
            Film.user_id == user_id
        ).order_by(Film.izlenme_tarihi.desc()).limit(limit).all()
    elif source == "friends":
        # Sadece arkadaşların filmleri
        friendships = db.query(Friendship).filter(
            or_(
                Friendship.user_id == user_id,
                Friendship.friend_id == user_id
            ),
            Friendship.status == "accepted"
        ).all()
        
        print(f"🔍 Found {len(friendships)} accepted friendships")
        
        friend_ids = []
        for friendship in friendships:
            if friendship.user_id == user_id:
                friend_ids.append(friendship.friend_id)
            else:
                friend_ids.append(friendship.user_id)
        
        print(f"🔍 Friend IDs: {friend_ids}")
        
        if not friend_ids:
            return []
        
        films = db.query(Film).filter(
            Film.user_id.in_(friend_ids)
        ).order_by(Film.izlenme_tarihi.desc()).limit(limit).all()
    else:
        # Hepsi - arkadaşlar + ben
        friendships = db.query(Friendship).filter(
            or_(
                Friendship.user_id == user_id,
                Friendship.friend_id == user_id
            ),
            Friendship.status == "accepted"
        ).all()
        
        friend_ids = [user_id]  # Kendimi de ekle
        for friendship in friendships:
            if friendship.user_id == user_id:
                friend_ids.append(friendship.friend_id)
            else:
                friend_ids.append(friendship.user_id)
        
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


# ==================== LIKE ENDPOINTS ====================

@router.post("/activity/{film_id}/like")
async def like_activity(
    film_id: int,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None)
):
    """Bir aktiviteyi beğen"""
    user_id = await get_current_user_id(authorization, db)
    
    # Film var mı kontrol et
    film = db.query(Film).filter(Film.id == film_id).first()
    if not film:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aktivite bulunamadı"
        )
    
    # Zaten beğenilmiş mi kontrol et
    existing_like = db.query(ActivityLike).filter(
        ActivityLike.user_id == user_id,
        ActivityLike.film_id == film_id
    ).first()
    
    if existing_like:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu aktiviteyi zaten beğendiniz"
        )
    
    # Beğeni oluştur
    new_like = ActivityLike(
        user_id=user_id,
        film_id=film_id
    )
    db.add(new_like)
    db.commit()
    db.refresh(new_like)
    
    return {"message": "Aktivite beğenildi", "like_id": new_like.id}


@router.delete("/activity/{film_id}/like")
async def unlike_activity(
    film_id: int,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None)
):
    """Aktivite beğenisini kaldır"""
    user_id = await get_current_user_id(authorization, db)
    
    # Beğeni var mı kontrol et
    like = db.query(ActivityLike).filter(
        ActivityLike.user_id == user_id,
        ActivityLike.film_id == film_id
    ).first()
    
    if not like:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Beğeni bulunamadı"
        )
    
    db.delete(like)
    db.commit()
    
    return {"message": "Beğeni kaldırıldı"}


@router.get("/activity/{film_id}/interactions")
async def get_activity_interactions(
    film_id: int,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None)
):
    """Bir aktivitenin beğeni ve yorumlarını getir"""
    user_id = await get_current_user_id(authorization, db)
    
    # Beğenileri getir
    likes = db.query(ActivityLike).filter(ActivityLike.film_id == film_id).all()
    
    # Yorumları getir
    comments = db.query(ActivityComment).filter(ActivityComment.film_id == film_id).order_by(ActivityComment.created_at.desc()).all()
    
    # Benim beğenim var mı kontrol et
    is_liked_by_me = db.query(ActivityLike).filter(
        ActivityLike.user_id == user_id,
        ActivityLike.film_id == film_id
    ).first() is not None
    
    # Kullanıcı bilgilerini ekle
    likes_with_user = []
    for like in likes:
        user = db.query(User).filter(User.id == like.user_id).first()
        if user:
            likes_with_user.append({
                "id": like.id,
                "user_id": like.user_id,
                "film_id": like.film_id,
                "created_at": like.created_at,
                "user": user
            })
    
    comments_with_user = []
    for comment in comments:
        user = db.query(User).filter(User.id == comment.user_id).first()
        if user:
            comments_with_user.append({
                "id": comment.id,
                "user_id": comment.user_id,
                "film_id": comment.film_id,
                "content": comment.content,
                "created_at": comment.created_at,
                "user": user
            })
    
    return {
        "like_count": len(likes),
        "comment_count": len(comments),
        "is_liked_by_me": is_liked_by_me,
        "likes": likes_with_user,
        "comments": comments_with_user
    }


# ==================== COMMENT ENDPOINTS ====================

@router.post("/activity/{film_id}/comment")
async def add_comment(
    film_id: int,
    comment_data: ActivityCommentCreate,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None)
):
    """Bir aktiviteye yorum ekle"""
    user_id = await get_current_user_id(authorization, db)
    
    # Film var mı kontrol et
    film = db.query(Film).filter(Film.id == film_id).first()
    if not film:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aktivite bulunamadı"
        )
    
    # Yorum oluştur
    new_comment = ActivityComment(
        user_id=user_id,
        film_id=film_id,
        content=comment_data.content
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
    user = db.query(User).filter(User.id == user_id).first()
    
    return {
        "id": new_comment.id,
        "user_id": new_comment.user_id,
        "film_id": new_comment.film_id,
        "content": new_comment.content,
        "created_at": new_comment.created_at,
        "user": user
    }


@router.delete("/activity/comment/{comment_id}")
async def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None)
):
    """Yorumu sil (sadece kendi yorumunu)"""
    user_id = await get_current_user_id(authorization, db)
    print(f"🗑️ Delete comment request - user_id: {user_id}, comment_id: {comment_id}")
    
    # Yorum var mı kontrol et
    comment = db.query(ActivityComment).filter(ActivityComment.id == comment_id).first()
    
    if not comment:
        print(f"❌ Comment not found: {comment_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Yorum bulunamadı"
        )
    
    print(f"📝 Comment found - comment.user_id: {comment.user_id}, requesting user_id: {user_id}")
    
    # Sadece kendi yorumunu silebilir
    if comment.user_id != user_id:
        print(f"🚫 Permission denied - comment owner: {comment.user_id}, requesting user: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu yorumu silme yetkiniz yok"
        )
    
    print(f"✅ Deleting comment {comment_id}")
    db.delete(comment)
    db.commit()
    
    print(f"✅ Comment {comment_id} deleted successfully")
    return {"message": "Yorum silindi"}
