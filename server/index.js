const express = require('express');
const cors = require('cors');
const https = require('https');
require('dotenv').config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Helper function to make HTTPS requests
function fetchURL(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// API route to fetch restaurants
app.get('/api/restaurants', async (req, res) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  
  console.log('API Key present:', !!apiKey);
  
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
    
    let allRestaurants = new Map(); // Use Map to avoid duplicates
    
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
    
    // Search with each keyword
    for (const keyword of keywords) {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&keyword=${encodeURIComponent(keyword)}&key=${apiKey}`;
      
      console.log(`Searching for: ${keyword}...`);
      const data = await fetchData(url);
      
      if (data.status === 'OK' && data.results) {
        data.results.forEach(place => {
          // Use place_id as key to avoid duplicates
          if (!allRestaurants.has(place.place_id)) {
            allRestaurants.set(place.place_id, {
              name: place.name,
              address: place.vicinity || place.formatted_address,
              place_id: place.place_id,
              rating: place.rating,
              user_ratings_total: place.user_ratings_total,
              price_level: place.price_level,
              types: place.types,
              opening_hours: place.opening_hours,
              geometry: place.geometry,
              searchKeyword: keyword // Track which keyword found this restaurant
            });
          }
        });
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const restaurants = Array.from(allRestaurants.values());
    console.log(`Found ${restaurants.length} unique restaurants`);
    res.json({ restaurants });
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