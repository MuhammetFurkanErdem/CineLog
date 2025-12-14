"""
AI Recommendation Router
Content-Based Filtering using TF-IDF and Cosine Similarity
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity, linear_kernel

from database import get_db
from models import Film, User
from schemas import FilmResponse
import httpx
from config import get_settings

router = APIRouter()
settings = get_settings()

# Global variables to store the trained model
tfidf_matrix = None
tfidf_vectorizer = None
movie_indices = {}
movie_data = []


async def get_current_user_id(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> int:
    """Authorization header'dan token'ı alır ve kullanıcı ID'sini döndürür"""
    from routers.auth import verify_token
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Token bulunamadı"
        )
    
    token = authorization.replace("Bearer ", "")
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Geçersiz token"
        )
    return user_id


async def fetch_tmdb_movies_for_training(limit: int = 100):
    """
    TMDB API'den popüler filmleri çeker ve training için hazırlar
    """
    async with httpx.AsyncClient() as client:
        try:
            # Popüler filmleri al (5 sayfa = ~100 film)
            all_movies = []
            for page in range(1, 6):
                response = await client.get(
                    f"https://api.themoviedb.org/3/movie/popular",
                    params={"api_key": settings.tmdb_api_key, "page": page, "language": "tr-TR"}
                )
                if response.status_code == 200:
                    data = response.json()
                    all_movies.extend(data.get("results", []))
            
            return all_movies[:limit]
        except Exception as e:
            print(f"TMDB fetch error: {e}")
            return []


def train_recommendation_model(movies_data: list):
    """
    TF-IDF ve Cosine Similarity kullanarak recommendation modelini eğitir
    """
    global tfidf_matrix, tfidf_vectorizer, movie_indices, movie_data
    
    if not movies_data:
        print("⚠️ No movie data for training")
        return
    
    # DataFrame oluştur
    df = pd.DataFrame(movies_data)
    
    # Eksik overview'ları doldur
    df['overview'] = df['overview'].fillna('')
    df['title'] = df['title'].fillna('')
    
    # Genre bilgilerini ekle (genre_ids'den)
    # TMDB genre ID'lerini text'e çevir (basitleştirilmiş)
    genre_map = {
        28: "Aksiyon", 12: "Macera", 16: "Animasyon", 35: "Komedi",
        80: "Suç", 99: "Belgesel", 18: "Drama", 10751: "Aile",
        14: "Fantastik", 36: "Tarih", 27: "Korku", 10402: "Müzik",
        9648: "Gizem", 10749: "Romantik", 878: "Bilim-Kurgu",
        10770: "TV Film", 53: "Gerilim", 10752: "Savaş", 37: "Vahşi Batı"
    }
    
    df['genres_text'] = df['genre_ids'].apply(
        lambda x: ' '.join([genre_map.get(g, '') for g in x]) if isinstance(x, list) else ''
    )
    
    # Birleştirilmiş text: title + overview + genres
    df['combined_features'] = (
        df['title'] + ' ' + 
        df['overview'] + ' ' + 
        df['genres_text'] + ' ' +
        df['genres_text']  # Genres'a daha fazla ağırlık ver
    )
    
    # TF-IDF Vectorizer
    tfidf_vectorizer = TfidfVectorizer(
        max_features=5000,
        stop_words='english',  # İngilizce stop words (TR için genişletilebilir)
        ngram_range=(1, 2),
        min_df=1
    )
    
    # TF-IDF matrix oluştur
    tfidf_matrix = tfidf_vectorizer.fit_transform(df['combined_features'])
    
    # Film indekslerini sakla (tmdb_id -> dataframe index mapping)
    movie_indices = {int(row['id']): idx for idx, row in df.iterrows()}
    movie_data = movies_data
    
    print(f"✅ AI Recommendation Model trained with {len(movies_data)} movies")
    print(f"   TF-IDF Matrix shape: {tfidf_matrix.shape}")


@router.on_event("startup")
async def startup_train_model():
    """
    Uygulama başlangıcında modeli eğit
    """
    print("🤖 Training AI Recommendation Model...")
    movies = await fetch_tmdb_movies_for_training(limit=200)
    train_recommendation_model(movies)


@router.get("/recommendations/{movie_id}", response_model=List[dict])
async def get_movie_recommendations(
    movie_id: int,
    limit: int = 10,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None)
):
    """
    Belirli bir filme benzer filmleri önerir (Content-Based Filtering)
    """
    user_id = await get_current_user_id(authorization, db)
    
    if tfidf_matrix is None or not movie_data:
        raise HTTPException(
            status_code=503,
            detail="Recommendation model not ready. Please try again later."
        )
    
    # Film index'ini bul
    if movie_id not in movie_indices:
        raise HTTPException(
            status_code=404,
            detail="Movie not found in recommendation database"
        )
    
    idx = movie_indices[movie_id]
    
    # Cosine similarity hesapla
    cosine_similarities = linear_kernel(tfidf_matrix[idx:idx+1], tfidf_matrix).flatten()
    
    # En benzer filmleri bul (kendisi hariç)
    similar_indices = cosine_similarities.argsort()[::-1][1:limit+1]
    
    # Sonuçları hazırla
    recommendations = []
    for i in similar_indices:
        movie = movie_data[i]
        recommendations.append({
            "id": movie["id"],
            "title": movie["title"],
            "overview": movie.get("overview", ""),
            "poster_path": movie.get("poster_path"),
            "vote_average": movie.get("vote_average", 0),
            "release_date": movie.get("release_date", ""),
            "similarity_score": float(cosine_similarities[i])
        })
    
    return recommendations


@router.get("/recommendations/user/personalized", response_model=List[dict])
async def get_personalized_recommendations(
    limit: int = 20,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None)
):
    """
    Kullanıcının izlediği filmlere göre kişiselleştirilmiş öneriler
    Kullanıcının beğendiği filmlere benzer filmleri bulur
    """
    user_id = await get_current_user_id(authorization, db)
    
    if tfidf_matrix is None or not movie_data:
        raise HTTPException(
            status_code=503,
            detail="Recommendation model not ready. Please try again later."
        )
    
    # Kullanıcının izlediği ve beğendiği filmleri al (kisisel_puan >= 7)
    user_films = db.query(Film).filter(
        Film.user_id == user_id,
        Film.izlendi == True,
        Film.kisisel_puan >= 7.0
    ).order_by(Film.kisisel_puan.desc()).limit(10).all()
    
    if not user_films:
        # Kullanıcının filmi yoksa, popüler filmleri öner
        return sorted(movie_data, key=lambda x: x.get('vote_average', 0), reverse=True)[:limit]
    
    # Her beğenilen film için benzer filmleri bul ve skorları topla
    recommendation_scores = {}
    
    for user_film in user_films:
        if user_film.tmdb_id not in movie_indices:
            continue
        
        idx = movie_indices[user_film.tmdb_id]
        
        # Cosine similarity hesapla
        cosine_similarities = linear_kernel(tfidf_matrix[idx:idx+1], tfidf_matrix).flatten()
        
        # Skorları ağırlıklandır (kullanıcının puanına göre)
        weight = user_film.kisisel_puan / 10.0
        
        # Her film için skoru ekle/güncelle
        for i, score in enumerate(cosine_similarities):
            movie = movie_data[i]
            movie_id = movie["id"]
            
            # Kullanıcının zaten izlediği filmleri ekleme
            if movie_id == user_film.tmdb_id:
                continue
            
            if movie_id in recommendation_scores:
                recommendation_scores[movie_id] += score * weight
            else:
                recommendation_scores[movie_id] = score * weight
    
    # Skorlara göre sırala ve en iyileri al
    sorted_recommendations = sorted(
        recommendation_scores.items(),
        key=lambda x: x[1],
        reverse=True
    )[:limit]
    
    # Detaylı bilgileri hazırla
    recommendations = []
    for movie_id, score in sorted_recommendations:
        # movie_data'dan filmi bul
        movie = next((m for m in movie_data if m["id"] == movie_id), None)
        if movie:
            recommendations.append({
                "id": movie["id"],
                "title": movie["title"],
                "overview": movie.get("overview", ""),
                "poster_path": movie.get("poster_path"),
                "vote_average": movie.get("vote_average", 0),
                "release_date": movie.get("release_date", ""),
                "recommendation_score": float(score)
            })
    
    return recommendations


@router.post("/retrain")
async def retrain_model(
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None)
):
    """
    Modeli yeniden eğit (Admin için)
    """
    user_id = await get_current_user_id(authorization, db)
    
    print("🔄 Retraining AI Recommendation Model...")
    movies = await fetch_tmdb_movies_for_training(limit=200)
    train_recommendation_model(movies)
    
    return {
        "message": "Model successfully retrained",
        "movies_count": len(movie_data),
        "matrix_shape": tfidf_matrix.shape if tfidf_matrix is not None else None
    }
