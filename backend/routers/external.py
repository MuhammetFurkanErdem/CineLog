"""
External APIs Router
Integration with TVMaze (TV Shows) and Jikan (Anime) public APIs
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import httpx

router = APIRouter()


@router.get("/tv/search")
async def search_tv_shows(query: str = Query(..., min_length=1, description="TV show name to search")):
    """
    Search TV shows using TVMaze API (Public - No API Key Required)
    
    Args:
        query: TV show name to search
        
    Returns:
        List of TV shows matching the search query
        
    Example:
        GET /api/external/tv/search?query=breaking bad
    """
    if not query or not query.strip():
        raise HTTPException(status_code=400, detail="Query parameter cannot be empty")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                "https://api.tvmaze.com/search/shows",
                params={"q": query}
            )
            
            if response.status_code == 404:
                return []
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"TVMaze API error: {response.text}"
                )
            
            return response.json()
            
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="TVMaze API request timeout"
        )
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Could not connect to TVMaze API"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching TV shows: {str(e)}"
        )


@router.get("/tv/{show_id}")
async def get_tv_show_details(show_id: int):
    """
    Get detailed information about a specific TV show from TVMaze
    Includes embedded cast and episodes information
    
    Args:
        show_id: TVMaze show ID
        
    Returns:
        Detailed TV show information with cast and episodes
        
    Example:
        GET /api/external/tv/169
    """
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Request with embedded cast and episodes
            response = await client.get(
                f"https://api.tvmaze.com/shows/{show_id}",
                params={"embed[]": ["cast", "episodes"]}
            )
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="TV show not found")
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"TVMaze API error: {response.text}"
                )
            
            return response.json()
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="TVMaze API request timeout")
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Could not connect to TVMaze API")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching TV show: {str(e)}")


@router.get("/anime/search")
async def search_anime(
    query: str = Query(..., min_length=1, description="Anime title to search"),
    limit: int = Query(25, ge=1, le=50, description="Number of results to return")
):
    """
    Search anime using Jikan API (MyAnimeList unofficial API - Public, No API Key)
    
    Args:
        query: Anime title to search
        limit: Number of results to return (1-50, default: 25)
        
    Returns:
        List of anime matching the search query
        
    Example:
        GET /api/external/anime/search?query=naruto&limit=10
    """
    if not query or not query.strip():
        raise HTTPException(status_code=400, detail="Query parameter cannot be empty")
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                "https://api.jikan.moe/v4/anime",
                params={
                    "q": query,
                    "limit": limit,
                    "sfw": True  # Safe for work filter
                }
            )
            
            if response.status_code == 404:
                return {"data": [], "pagination": {}}
            
            if response.status_code == 429:
                raise HTTPException(
                    status_code=429,
                    detail="Jikan API rate limit exceeded. Please wait a moment and try again."
                )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Jikan API error: {response.text}"
                )
            
            result = response.json()
            
            # Return only the data field as specified
            return result.get("data", [])
            
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Jikan API request timeout"
        )
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Could not connect to Jikan API"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching anime: {str(e)}"
        )


@router.get("/anime/{anime_id}")
async def get_anime_details(anime_id: int):
    """
    Get detailed information about a specific anime from Jikan/MyAnimeList
    
    Args:
        anime_id: MyAnimeList anime ID
        
    Returns:
        Detailed anime information
        
    Example:
        GET /api/external/anime/1
    """
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(f"https://api.jikan.moe/v4/anime/{anime_id}")
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="Anime not found")
            
            if response.status_code == 429:
                raise HTTPException(
                    status_code=429,
                    detail="Jikan API rate limit exceeded. Please wait a moment and try again."
                )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Jikan API error: {response.text}"
                )
            
            result = response.json()
            
            # Return the data field
            return result.get("data", {})
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Jikan API request timeout")
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Could not connect to Jikan API")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching anime: {str(e)}")


@router.get("/anime/top")
async def get_top_anime(
    limit: int = Query(25, ge=1, le=50, description="Number of results to return"),
    filter_type: Optional[str] = Query(None, description="Filter by type: tv, movie, ova, special, ona, music")
):
    """
    Get top-rated anime from MyAnimeList
    
    Args:
        limit: Number of results to return (1-50, default: 25)
        filter_type: Filter by anime type (optional)
        
    Returns:
        List of top-rated anime
        
    Example:
        GET /api/external/anime/top?limit=10&filter_type=tv
    """
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            params = {"limit": limit}
            if filter_type:
                params["filter"] = filter_type
            
            response = await client.get(
                "https://api.jikan.moe/v4/top/anime",
                params=params
            )
            
            if response.status_code == 429:
                raise HTTPException(
                    status_code=429,
                    detail="Jikan API rate limit exceeded. Please wait a moment and try again."
                )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Jikan API error: {response.text}"
                )
            
            result = response.json()
            return result.get("data", [])
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Jikan API request timeout")
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Could not connect to Jikan API")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching top anime: {str(e)}")
