import fs from 'fs';
import path from 'path';

const CACHE_DIR = '/tmp';
const CACHE_FILE = path.join(CACHE_DIR, 'restaurants-cache.json');
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

/**
 * Gets cached restaurant data if valid, otherwise returns null
 */
export function getCachedData() {
  try {
    // Check if cache file exists
    if (!fs.existsSync(CACHE_FILE)) {
      console.log('Cache file does not exist');
      return null;
    }

    // Read cache file
    const cacheContent = fs.readFileSync(CACHE_FILE, 'utf8');
    const cache = JSON.parse(cacheContent);

    // Check if cache is still valid
    const now = Date.now();
    const cacheAge = now - cache.timestamp;

    if (cacheAge < CACHE_DURATION) {
      const hoursOld = (cacheAge / (60 * 60 * 1000)).toFixed(1);
      console.log(`✅ Cache hit! Data is ${hoursOld} hours old`);
      return cache.data;
    } else {
      console.log('Cache expired, will fetch fresh data');
      return null;
    }
  } catch (error) {
    console.error('Error reading cache:', error.message);
    return null;
  }
}

/**
 * Saves restaurant data to cache
 */
export function setCachedData(data) {
  try {
    // Ensure cache directory exists
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    // Create cache object with timestamp
    const cache = {
      timestamp: Date.now(),
      data: data
    };

    // Write to cache file
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache), 'utf8');
    console.log(`✅ Cached ${data.restaurants?.length || 0} restaurants`);
  } catch (error) {
    console.error('Error writing cache:', error.message);
  }
}

/**
 * Clears the cache (useful for manual refresh)
 */
export function clearCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE);
      console.log('Cache cleared');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error clearing cache:', error.message);
    return false;
  }
}