import express from 'express';
import cors from 'cors';
import https from 'https';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { getCachedData, setCachedData, clearCache } from '../api/cache.js';

// Resolve project root reliably even if the server is started from project root or elsewhere.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootEnvPath = resolve(__dirname, '../.env');

// Load root .env for local development
dotenv.config({ path: rootEnvPath });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper function to fetch data
const fetchData = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (resp) => {
      let data = '';
      resp.on('data', (chunk) => { data += chunk; });
      resp.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
};

// API route to fetch restaurants
app.get('/api/restaurants', async (req, res) => {
  // Check if manual cache refresh is requested
  const shouldRefresh = req.query.refresh === 'true';
  if (shouldRefresh) {
    console.log('Manual cache refresh requested');
    clearCache();
  }

  // Try to get cached data first
  const cachedData = getCachedData();
  if (cachedData && !shouldRefresh) {
    console.log('Returning cached data');
    return res.json(cachedData);
  }

  // Use server-side env var (private) — set this in Vercel as GOOGLE_PLACES_API_KEY
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  console.log('API Key present:', !!apiKey);
  console.log('Fetching fresh data from Google Places API...');

  if (!apiKey) {
    return res.status(500).json({
      error: 'Google Places API key not configured'
    });
  }

  try {
    const latitude = 42.3601;
    const longitude = -71.0589;
    const radius = 8000;
    
    // Search for different types of Latino restaurants
    const keywords = [
      'mexican restaurant',
      'colombian restaurant', 
      'puerto rican restaurant',
      'dominican restaurant',
      'peruvian restaurant',
      'cuban restaurant',
      'venezuelan restaurant',
      'salvadoran restaurant',
      'brazilian restaurant',
      'argentinian restaurant',
      'latin american restaurant',
      'latino restaurant',
      'spanish restaurant'
    ];
    
    console.log('Starting parallel keyword searches...');
    
    // OPTIMIZATION 1: Parallelize all keyword searches
    const searchPromises = keywords.map(keyword => {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&keyword=${encodeURIComponent(keyword)}&key=${apiKey}`;
      
      return fetchData(url)
        .then(data => {
          console.log(`✓ Completed search for: ${keyword}`);
          return { keyword, data };
        })
        .catch(error => {
          console.error(`✗ Error searching for ${keyword}:`, error.message);
          return { keyword, data: null };
        });
    });

    const searchResults = await Promise.all(searchPromises);
    console.log('All keyword searches completed');

    // Collect all unique place IDs
    const placeIdMap = new Map(); // Map to track which keyword found each place
    searchResults.forEach(({ keyword, data }) => {
      if (data && data.status === 'OK' && data.results) {
        data.results.forEach(place => {
          if (!placeIdMap.has(place.place_id)) {
            placeIdMap.set(place.place_id, keyword);
          }
        });
      }
    });

    const placeIdArray = Array.from(placeIdMap.keys());
    console.log(`Found ${placeIdArray.length} unique place IDs`);

    // OPTIMIZATION 2: Fetch details in parallel batches
    const BATCH_SIZE = 10; // Process 10 places at a time to avoid rate limits
    const allRestaurants = new Map();

    for (let i = 0; i < placeIdArray.length; i += BATCH_SIZE) {
      const batch = placeIdArray.slice(i, i + BATCH_SIZE);
      console.log(`Fetching details batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(placeIdArray.length / BATCH_SIZE)}...`);
      
      const detailsPromises = batch.map(async (placeId) => {
        try {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,photos,website,opening_hours,rating,user_ratings_total,geometry,price_level,types&key=${apiKey}`;
          const detailsData = await fetchData(detailsUrl);

          if (detailsData.status === 'OK' && detailsData.result) {
            const place = detailsData.result;

            // Get photo URL if available
            let photoUrl = null;
            if (place.photos && place.photos.length > 0) {
              const photoReference = place.photos[0].photo_reference;
              photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoReference}&key=${apiKey}`;
            }

            return {
              placeId,
              data: {
                name: place.name,
                address: place.formatted_address,
                place_id: placeId,
                rating: place.rating,
                user_ratings_total: place.user_ratings_total,
                price_level: place.price_level,
                types: place.types,
                opening_hours: place.opening_hours ? {
                  open_now: place.opening_hours.open_now
                } : null,
                geometry: place.geometry,
                searchKeyword: placeIdMap.get(placeId),
                photo: photoUrl,
                website: place.website || null,
                weekday_text: place.opening_hours?.weekday_text || null
              }
            };
          }
          return null;
        } catch (error) {
          console.error(`Error fetching details for ${placeId}:`, error.message);
          return null;
        }
      });

      const batchResults = await Promise.all(detailsPromises);
      
      // Add successful results to the map
      batchResults.forEach(result => {
        if (result) {
          allRestaurants.set(result.placeId, result.data);
        }
      });

      // Small delay between batches to avoid hitting rate limits
      if (i + BATCH_SIZE < placeIdArray.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const restaurants = Array.from(allRestaurants.values());
    console.log(`✓ Successfully fetched details for ${restaurants.length} unique restaurants`);

    const responseData = { restaurants };

    // Cache the data for future requests
    setCachedData(responseData);

    res.json(responseData);
  } catch (error) {
    console.error('Error details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch restaurants', 
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});