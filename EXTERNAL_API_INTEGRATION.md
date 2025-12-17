# External API Integration - MovieDetail Enhancement

## Overview
Enhanced the MovieDetail page to fetch and display enriched data from external APIs:
- **TVMaze API** for TV shows (cast, crew, episodes)
- **Jikan/MyAnimeList API** for anime (characters, episodes, ratings)

## Files Modified

### 1. `backend/routers/external.py`
**Changes:**
- Updated `get_tv_show_details()` endpoint to include embedded cast and episodes
- Added `embed[]=cast&embed[]=episodes` parameters to TVMaze API call
- Increased timeout to 15 seconds for complex data fetching

**Endpoint:**
```
GET /api/external/tv/{show_id}
```
Returns TV show details with:
- Cast members (actor name, character name, images)
- Episodes (season, episode number, air date, runtime, summary)
- Network, status, rating information

### 2. `frontend/src/utils/api.ts`
**New Functions:**

#### `getEnrichedTVData(title: string)`
- Searches TVMaze by title
- Fetches full details with embedded cast and episodes
- Returns structured TV show data

#### `getEnrichedAnimeData(title: string)`
- Searches Jikan/MyAnimeList by title
- Fetches anime details
- Makes additional call to fetch top 10 characters
- Returns complete anime data with characters

### 3. `frontend/src/components/pages/MovieDetail.tsx`
**New Features:**

#### State Management
```typescript
- externalData: TVShowData | AnimeData | null
- externalLoading: boolean
- showEpisodes: boolean
```

#### Data Fetching
- New `useEffect` that triggers after TMDB movie data loads
- Detects content type based on genres:
  - Anime: Contains "animation" genre + "anime" in title
  - TV Show: Contains "tv" genre or "series"/"season" in title
- Fetches appropriate external data

#### New UI Sections

1. **TV Show Cast Section**
   - Horizontal scrollable cast carousel
   - Circular avatars with actor and character names
   - Pulls from TVMaze `_embedded.cast`

2. **Anime Characters Section**
   - Horizontal scrollable character carousel
   - Character images, names, and roles (Main/Supporting)
   - Pulls from Jikan characters endpoint

3. **Info Badges**
   - Dynamic badges showing:
     - TV: Status, Network, Rating
     - Anime: Episodes count, Studio, MAL Score
   - Color-coded by type

4. **Episodes Accordion**
   - Collapsible section with episode list
   - Shows: Season/Episode number, title, air date, runtime
   - Episode summaries with HTML rendering
   - Max height with scrollbar for long lists

## Technical Details

### Type Safety
Created TypeScript interfaces:
```typescript
interface TVShowData {
  _embedded?: {
    cast?: Array<{...}>;
    episodes?: Array<{...}>;
  };
  status, network, rating, etc.
}

interface AnimeData {
  characters?: Array<{...}>;
  episodes, studios, score, etc.
}
```

### Error Handling
- Try-catch blocks prevent external API failures from breaking the page
- External data is optional - page works without it
- Console logging for debugging without user-facing errors

### Performance
- External data fetches only after TMDB data loads successfully
- Separate loading state prevents UI blocking
- Timeouts prevent hanging requests

## Usage Example

When viewing a TV show like "Breaking Bad":
1. TMDB loads basic movie info (poster, overview, TMDB cast)
2. External API detects "TV" content type
3. Fetches TVMaze data for "Breaking Bad"
4. Displays:
   - TVMaze cast carousel
   - Info badges (Status: Ended, Network: AMC, Rating: 9.5/10)
   - Episodes accordion (62 episodes across 5 seasons)

When viewing an anime like "Naruto":
1. TMDB loads basic info
2. External API detects "Animation" + "anime" keywords
3. Fetches Jikan/MyAnimeList data
4. Displays:
   - Character carousel (Naruto, Sasuke, Sakura, etc.)
   - Info badges (220 Episodes, Studio Pierrot, Score: 8.2/10)

## API Limitations
- **TVMaze**: No API key required, generous rate limits
- **Jikan**: Rate limited (60 requests/minute), requires client-side character fetch
- **Detection Logic**: Relies on genre tags and title keywords (may need refinement)

## Future Improvements
1. Add caching layer for external API responses
2. Improve content type detection algorithm
3. Add crew/staff section for anime
4. Display next episode countdown for ongoing shows
5. Add "Watch Now" links from TVMaze streaming providers
