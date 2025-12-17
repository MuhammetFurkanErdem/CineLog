from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import List, Optional
import httpx
import random

from database import get_db
from models import User, Film
from schemas import FilmCreate, FilmResponse, FilmUpdate, TMDBMovieSearch, MovieRecommendation
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


@router.get("/search", response_model=List[TMDBMovieSearch])
async def search_movies(query: str, page: int = 1):
    """
    TMDB API'den film arar.
    """
    if not settings.tmdb_api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="TMDB API anahtarı yapılandırılmamış"
        )
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.tmdb_base_url}/search/movie",
            params={
                "api_key": settings.tmdb_api_key,
                "query": query,
                "page": page,
                "language": "tr-TR"
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="TMDB API'den film aranamadı"
            )
        
        data = response.json()
        return data.get("results", [])


@router.get("/popular", response_model=List[TMDBMovieSearch])
async def get_popular_movies(page: int = 1):
    """
    TMDB API'den popüler filmleri getirir.
    """
    if not settings.tmdb_api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="TMDB API anahtarı yapılandırılmamış"
        )
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.tmdb_base_url}/movie/popular",
            params={
                "api_key": settings.tmdb_api_key,
                "page": page,
                "language": "tr-TR"
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="TMDB API'den popüler filmler alınamadı"
            )
        
        data = response.json()
        return data.get("results", [])


@router.get("/trending", response_model=List[TMDBMovieSearch])
async def get_trending_movies():
    """
    TMDB API'den haftalık trend filmleri getirir.
    """
    if not settings.tmdb_api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="TMDB API anahtarı yapılandırılmamış"
        )
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.tmdb_base_url}/trending/movie/week",
            params={
                "api_key": settings.tmdb_api_key,
                "language": "tr-TR"
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="TMDB API'den trend filmler alınamadı"
            )
        
        data = response.json()
        return data.get("results", [])


@router.get("/tmdb/{tmdb_id}")
async def get_movie_details(tmdb_id: int):
    """
    TMDB API'den film detaylarını getirir.
    Credits (cast, crew) ve watch providers dahil.
    """
    if not settings.tmdb_api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="TMDB API anahtarı yapılandırılmamış"
        )
    
    async with httpx.AsyncClient() as client:
        # Film detaylarını al
        movie_response = await client.get(
            f"{settings.tmdb_base_url}/movie/{tmdb_id}",
            params={
                "api_key": settings.tmdb_api_key,
                "language": "tr-TR"
            }
        )
        
        if movie_response.status_code == 404:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Film bulunamadı"
            )
        
        if movie_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="TMDB API'den film bilgisi alınamadı"
            )
        
        movie_data = movie_response.json()
        
        # Credits (oyuncular ve ekip) bilgisini al
        credits_response = await client.get(
            f"{settings.tmdb_base_url}/movie/{tmdb_id}/credits",
            params={
                "api_key": settings.tmdb_api_key,
                "language": "tr-TR"
            }
        )
        
        # Watch providers (nerede izlenir) bilgisini al
        providers_response = await client.get(
            f"{settings.tmdb_base_url}/movie/{tmdb_id}/watch/providers",
            params={
                "api_key": settings.tmdb_api_key
            }
        )
        
        # Credits verilerini ekle
        if credits_response.status_code == 200:
            credits_data = credits_response.json()
            movie_data["cast"] = credits_data.get("cast", [])[:10]  # İlk 10 oyuncu
            movie_data["crew"] = credits_data.get("crew", [])
            
            # Yönetmeni bul
            directors = [crew for crew in movie_data["crew"] if crew.get("job") == "Director"]
            movie_data["director"] = directors[0] if directors else None
        
        # Watch providers verilerini ekle (Türkiye için)
        if providers_response.status_code == 200:
            providers_data = providers_response.json()
            tr_providers = providers_data.get("results", {}).get("TR", {})
            movie_data["watch_providers"] = {
                "flatrate": tr_providers.get("flatrate", []),  # Netflix, Disney+ vb.
                "buy": tr_providers.get("buy", []),
                "rent": tr_providers.get("rent", [])
            }
        else:
            movie_data["watch_providers"] = {"flatrate": [], "buy": [], "rent": []}
        
        return movie_data


@router.post("/add", response_model=FilmResponse)
async def add_film_to_list(
    film_data: FilmCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Kullanıcının listesine film ekler.
    """
    # Kullanıcı bu filmi daha önce eklediyse hata ver
    existing_film = db.query(Film).filter(
        Film.user_id == user_id,
        Film.tmdb_id == film_data.tmdb_id
    ).first()
    
    if existing_film:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu film zaten listenizde"
        )
    
    # Yeni film ekle
    new_film = Film(
        user_id=user_id,
        tmdb_id=film_data.tmdb_id,
        title=film_data.title,
        poster_path=film_data.poster_path,
        release_date=film_data.release_date,
        overview=film_data.overview,
        kisisel_puan=film_data.kisisel_puan,
        kisisel_yorum=film_data.kisisel_yorum,
        izlendi=film_data.izlendi,
        is_favorite=film_data.is_favorite,
        is_watchlist=film_data.is_watchlist
    )
    
    db.add(new_film)
    db.commit()
    db.refresh(new_film)
    
    return new_film


@router.get("/my-list", response_model=List[FilmResponse])
async def get_my_films(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Kullanıcının film listesini getirir.
    """
    films = db.query(Film).filter(Film.user_id == user_id).all()
    return films


@router.get("/recommend/random", response_model=MovieRecommendation)
async def get_random_recommendation(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Kullanıcının listesinden rastgele bir film seçer ve TMDB'den benzer film önerir.
    """
    # Kullanıcının filmlerini al
    user_films = db.query(Film).filter(Film.user_id == user_id).all()
    
    if not user_films:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listenizde film yok. Önce film ekleyin."
        )
    
    # Rastgele bir film seç
    source_film = random.choice(user_films)
    
    # TMDB'den benzer filmleri al
    if not settings.tmdb_api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="TMDB API anahtarı yapılandırılmamış"
        )
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.tmdb_base_url}/movie/{source_film.tmdb_id}/similar",
            params={
                "api_key": settings.tmdb_api_key,
                "language": "tr-TR",
                "page": 1
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="TMDB API yanıt vermedi"
            )
    
    data = response.json()
    results = data.get("results", [])
    
    if not results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Benzer film bulunamadı"
        )
    
    # İlk sonucu öneri olarak döndür
    recommendation = results[0]
    
    return MovieRecommendation(
        source_film_id=source_film.id,
        source_film_title=source_film.title,
        recommended_tmdb_id=recommendation.get("id"),
        recommended_title=recommendation.get("title"),
        overview=recommendation.get("overview"),
        poster_path=recommendation.get("poster_path"),
        release_date=recommendation.get("release_date")
    )


@router.put("/{film_id}", response_model=FilmResponse)
async def update_film(
    film_id: int,
    film_data: FilmUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Kullanıcının listesindeki bir filmi günceller.
    """
    film = db.query(Film).filter(Film.id == film_id, Film.user_id == user_id).first()
    
    if not film:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Film bulunamadı"
        )
    
    # Güncelleme verilerini uygula
    update_data = film_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(film, key, value)
    
    db.commit()
    db.refresh(film)
    
    return film


@router.delete("/{film_id}")
async def delete_film(
    film_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Kullanıcının listesinden bir filmi siler.
    """
    film = db.query(Film).filter(Film.id == film_id, Film.user_id == user_id).first()
    
    if not film:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Film bulunamadı"
        )
    
    db.delete(film)
    db.commit()
    
    return {"message": "Film başarıyla silindi"}


@router.get("/my-genres")
async def get_my_genre_stats(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Kullanıcının izlediği filmlerin tür istatistiklerini döndürür.
    TMDB'den her filmin türünü çeker ve sayar.
    """
    # Kullanıcının izlediği filmleri al
    user_films = db.query(Film).filter(
        Film.user_id == user_id,
        Film.izlendi == True
    ).all()
    
    if not user_films:
        return {"genres": [], "total": 0}
    
    if not settings.tmdb_api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="TMDB API anahtarı yapılandırılmamış"
        )
    
    # Tür sayacı
    genre_counts = {}
    
    async with httpx.AsyncClient() as client:
        for film in user_films:
            try:
                response = await client.get(
                    f"{settings.tmdb_base_url}/movie/{film.tmdb_id}",
                    params={
                        "api_key": settings.tmdb_api_key,
                        "language": "tr-TR"
                    }
                )
                
                if response.status_code == 200:
                    movie_data = response.json()
                    genres = movie_data.get("genres", [])
                    
                    for genre in genres:
                        genre_name = genre.get("name")
                        if genre_name:
                            genre_counts[genre_name] = genre_counts.get(genre_name, 0) + 1
            except Exception:
                # Hata olursa bu filmi atla
                continue
    
    # Türleri sayıya göre sırala
    sorted_genres = sorted(
        [{"name": name, "count": count} for name, count in genre_counts.items()],
        key=lambda x: x["count"],
        reverse=True
    )
    
    return {
        "genres": sorted_genres[:5],  # En çok 5 tür döndür
        "total": len(user_films)
    }
