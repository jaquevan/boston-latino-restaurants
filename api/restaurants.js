// Vercel Serverless function - Full restaurant search with place details
import { getCachedData, setCachedData, clearCache } from './cache.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests (and support cache clearing with ?refresh=true)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    return res.status(200).json(cachedData);
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  console.log('API Key present:', !!apiKey);
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Fetching fresh data from Google Places API...');

  if (!apiKey) {
    return res.status(500).json({
      error: 'Google Places API key not configured on the server'
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

    let allRestaurants = new Map(); // Use Map to avoid duplicates

    // Search with each keyword
    for (const keyword of keywords) {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&keyword=${encodeURIComponent(keyword)}&key=${apiKey}`;

      console.log(`Searching for: ${keyword}...`);

      const searchResponse = await fetch(url);
      const data = await searchResponse.json();

      if (data.status === 'OK' && data.results) {
        // Get place_ids from search results
        const placeIds = data.results.map(place => place.place_id);

        // Fetch detailed info for each place
        for (const placeId of placeIds) {
          if (!allRestaurants.has(placeId)) {
            try {
              // Fetch place details
              const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,photos,website,opening_hours,rating,user_ratings_total,geometry,price_level,types&key=${apiKey}`;

              const detailsResponse = await fetch(detailsUrl);
              const detailsData = await detailsResponse.json();

              if (detailsData.status === 'OK' && detailsData.result) {
                const place = detailsData.result;

                // Get photo URL if available
                let photoUrl = null;
                if (place.photos && place.photos.length > 0) {
                  const photoReference = place.photos[0].photo_reference;
                  photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoReference}&key=${apiKey}`;
                }

                allRestaurants.set(placeId, {
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
                  searchKeyword: keyword,
                  photo: photoUrl,
                  website: place.website || null,
                  weekday_text: place.opening_hours?.weekday_text || null
                });
              }

              // Small delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
              console.error(`Error fetching details for ${placeId}:`, error.message);
            }
          }
        }
      }

      // Small delay between keyword searches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const restaurants = Array.from(allRestaurants.values());
    console.log(`Found ${restaurants.length} unique restaurants`);

    const responseData = { restaurants };

    // Cache the data for future requests
    setCachedData(responseData);

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error details:', error);
    res.status(500).json({
      error: 'Failed to fetch restaurants',
      details: error.message
    });
  }
}
