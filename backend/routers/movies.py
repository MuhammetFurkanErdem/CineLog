from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import httpx
import random

from database import get_db
from models import User, Film
from schemas import FilmCreate, FilmResponse, FilmUpdate, TMDBMovieSearch, MovieRecommendation
from config import get_settings

router = APIRouter()
settings = get_settings()


async def get_current_user_id(token: str, db: Session = Depends(get_db)) -> int:
    """Token'dan kullanıcı ID'sini döndürür (authentication için)"""
    from routers.auth import verify_token
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


@router.get("/{tmdb_id}", response_model=TMDBMovieSearch)
async def get_movie_details(tmdb_id: int):
    """
    TMDB API'den film detaylarını getirir.
    """
    if not settings.tmdb_api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="TMDB API anahtarı yapılandırılmamış"
        )
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.tmdb_base_url}/movie/{tmdb_id}",
            params={
                "api_key": settings.tmdb_api_key,
                "language": "tr-TR"
            }
        )
        
        if response.status_code == 404:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Film bulunamadı"
            )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="TMDB API'den film bilgisi alınamadı"
            )
        
        return response.json()


@router.post("/add", response_model=FilmResponse)
async def add_film_to_list(
    film_data: FilmCreate,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Kullanıcının listesine film ekler.
    """
    user_id = await get_current_user_id(token, db)
    
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
        izlendi=film_data.izlendi
    )
    
    db.add(new_film)
    db.commit()
    db.refresh(new_film)
    
    return new_film


@router.get("/my-list", response_model=List[FilmResponse])
async def get_my_films(token: str, db: Session = Depends(get_db)):
    """
    Kullanıcının film listesini döndürür.
    """
    user_id = await get_current_user_id(token, db)
    films = db.query(Film).filter(Film.user_id == user_id).all()
    return films


@router.put("/{film_id}", response_model=FilmResponse)
async def update_film(
    film_id: int,
    film_data: FilmUpdate,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Kullanıcının listesindeki bir filmi günceller.
    """
    user_id = await get_current_user_id(token, db)
    
    film = db.query(Film).filter(
        Film.id == film_id,
        Film.user_id == user_id
    ).first()
    
    if not film:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Film bulunamadı"
        )
    
    # Güncelleme
    if film_data.kisisel_puan is not None:
        film.kisisel_puan = film_data.kisisel_puan
    if film_data.kisisel_yorum is not None:
        film.kisisel_yorum = film_data.kisisel_yorum
    if film_data.izlendi is not None:
        film.izlendi = film_data.izlendi
    
    db.commit()
    db.refresh(film)
    
    return film


@router.delete("/{film_id}")
async def delete_film(
    film_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Kullanıcının listesinden bir filmi siler.
    """
    user_id = await get_current_user_id(token, db)
    
    film = db.query(Film).filter(
        Film.id == film_id,
        Film.user_id == user_id
    ).first()
    
    if not film:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Film bulunamadı"
        )
    
    db.delete(film)
    db.commit()
    
    return {"message": "Film başarıyla silindi"}


@router.get("/recommend/random", response_model=MovieRecommendation)
async def get_random_recommendation(token: str, db: Session = Depends(get_db)):
    """
    Kullanıcının listesinden rastgele bir film seçer ve TMDB'den benzer film önerir.
    """
    user_id = await get_current_user_id(token, db)
    
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
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="TMDB API'den benzer filmler alınamadı"
            )
        
        similar_movies = response.json().get("results", [])
        
        if not similar_movies:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Benzer film bulunamadı"
            )
        
        # Rastgele bir benzer film seç
        recommended = random.choice(similar_movies)
        
        return {
            "source_film": {
                "id": source_film.tmdb_id,
                "title": source_film.title,
                "poster_path": source_film.poster_path,
                "release_date": source_film.release_date,
                "overview": source_film.overview,
                "vote_average": None
            },
            "recommended_film": recommended
        }
