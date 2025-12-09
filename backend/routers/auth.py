from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Optional
import httpx

from database import get_db
from models import User
from schemas import GoogleAuthRequest, Token, UserResponse
from config import get_settings

router = APIRouter()
settings = get_settings()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """JWT token oluşturur"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def verify_token(token: str):
    """JWT token doğrular"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: int = payload.get("sub")
        if user_id is None:
            return None
        return user_id
    except JWTError:
        return None


@router.post("/google", response_model=Token)
async def google_login(auth_data: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Google OAuth ile giriş yapar.
    Google'dan gelen ID token'ı doğrular ve kullanıcıyı sisteme kaydeder/giriş yapar.
    """
    try:
        # Google ID token'ı doğrula
        idinfo = id_token.verify_oauth2_token(
            auth_data.token,
            google_requests.Request(),
            settings.google_client_id
        )
        
        # Google'dan gelen bilgileri al
        google_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', email.split('@')[0])
        picture = idinfo.get('picture', None)
        
        # Kullanıcıyı veritabanında ara
        user = db.query(User).filter(User.google_id == google_id).first()
        
        if not user:
            # Benzersiz username oluştur
            base_username = email.split('@')[0].lower()
            # Alfasayısal karakterler ve alt çizgi dışındaki karakterleri kaldır
            base_username = ''.join(c if c.isalnum() or c == '_' else '' for c in base_username)
            
            # Eğer username zaten varsa sonuna sayı ekle
            username = base_username
            counter = 1
            while db.query(User).filter(User.username == username).first():
                username = f"{base_username}{counter}"
                counter += 1
            
            # Yeni kullanıcı oluştur
            user = User(
                username=username,
                email=email,
                google_id=google_id,
                picture=picture
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # JWT token oluştur
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email}
        )
        
        return {"access_token": access_token, "token_type": "bearer"}
    
    except ValueError as e:
        # Token geçersiz
        print(f"Google token validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Geçersiz Google token: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        # Diğer hatalar
        print(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Giriş hatası: {str(e)}"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    """
    Mevcut kullanıcının bilgilerini döndürür.
    Header'da Bearer token ile gönderilmelidir.
    """
    # Bearer token'ı parse et
    try:
        scheme, token = authorization.split()
        if scheme.lower() != 'bearer':
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Geçersiz authentication scheme"
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz authorization header"
        )
    
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz veya süresi dolmuş token"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı"
        )
    
    return user


@router.post("/logout")
async def logout():
    """
    Çıkış yapar (Frontend'de token'ı silmek yeterli).
    """
    return {"message": "Başarıyla çıkış yapıldı"}
