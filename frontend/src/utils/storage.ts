// Local storage utility for managing user library data

export interface LibraryItem {
  id: string;
  type: 'movie' | 'series' | 'anime';
  title: string;
  poster: string;
  year?: number | string;
  rating?: number;
  watched: boolean;
  favorite: boolean;
  watchlist: boolean;
  timestamp: number;
}

export type InteractionAction = 'watched' | 'favorite' | 'watchlist';

const STORAGE_KEY = 'cinelog_user_library';

/**
 * Get all items from localStorage
 */
function getStorageData(): LibraryItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
}

/**
 * Save items to localStorage
 */
function setStorageData(items: LibraryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
}

/**
 * Toggle an interaction (watched/favorite/watchlist) for an item
 * Creates the item if it doesn't exist, or updates it if it does
 */
export function toggleInteraction(
  itemData: {
    id: string;
    type: 'movie' | 'series' | 'anime';
    title: string;
    poster: string;
    year?: number | string;
    rating?: number;
  },
  action: InteractionAction
): boolean {
  const items = getStorageData();
  const existingIndex = items.findIndex((item) => item.id === itemData.id);

  if (existingIndex !== -1) {
    // Item exists - toggle the specific action
    const currentValue = items[existingIndex][action];
    items[existingIndex][action] = !currentValue;
    items[existingIndex].timestamp = Date.now();

    // If all interactions are false, remove the item
    if (!items[existingIndex].watched && 
        !items[existingIndex].favorite && 
        !items[existingIndex].watchlist) {
      items.splice(existingIndex, 1);
      setStorageData(items);
      return false;
    }

    setStorageData(items);
    return items[existingIndex][action];
  } else {
    // Item doesn't exist - create new item with the action set to true
    const newItem: LibraryItem = {
      ...itemData,
      watched: action === 'watched',
      favorite: action === 'favorite',
      watchlist: action === 'watchlist',
      timestamp: Date.now(),
    };
    items.push(newItem);
    setStorageData(items);
    return true;
  }
}

/**
 * Get the status of a specific item
 */
export function getItemStatus(id: string): {
  isWatched: boolean;
  isFavorite: boolean;
  isWatchlist: boolean;
} {
  const items = getStorageData();
  const item = items.find((item) => item.id === id);

  return {
    isWatched: item?.watched || false,
    isFavorite: item?.favorite || false,
    isWatchlist: item?.watchlist || false,
  };
}

/**
 * Get all items from user library
 */
export function getUserLibrary(): LibraryItem[] {
  return getStorageData();
}

/**
 * Get items filtered by interaction type
 */
export function getItemsByInteraction(action: InteractionAction): LibraryItem[] {
  const items = getStorageData();
  return items.filter((item) => item[action] === true);
}

/**
 * Clear all library data (useful for logout or reset)
 */
export function clearLibrary(): void {
  localStorage.removeItem(STORAGE_KEY);
}
