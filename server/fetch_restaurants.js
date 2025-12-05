import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Helper function to fetch data from a URL
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

async function fetchAndSaveRestaurants() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     Fetching Latino Restaurants in Boston Area        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    console.error('❌ ERROR: API key not found in .env file');
    console.error('💡 Make sure your .env has: GOOGLE_PLACES_API_KEY=your_key');
    process.exit(1);
  }

  console.log('🔑 API Key found ✓');
  console.log('🌎 Starting data fetch...\n');

  try {
    // Boston coordinates
    const latitude = 42.3601;
    const longitude = -71.0589;
    const radius = 8000; // 8km radius
    
    // All Latino cuisine types to search
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
    
    console.log(`📍 Location: Boston (${latitude}, ${longitude})`);
    console.log(`📏 Radius: ${radius}m`);
    console.log(`🔍 Searching ${keywords.length} cuisine types`);
    console.log('⏳ This will take 30-60 seconds...\n');
    
    // ============================================
    // STEP 1: Search for restaurants by keyword
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STEP 1/3: Searching for restaurants by cuisine type');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const searchPromises = keywords.map(keyword => {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&keyword=${encodeURIComponent(keyword)}&key=${apiKey}`;
      
      return fetchData(url)
        .then(data => {
          const count = data.results ? data.results.length : 0;
          console.log(`  ✓ ${keyword.padEnd(30)} → ${count} results`);
          return { keyword, data };
        })
        .catch(error => {
          console.error(`  ✗ ${keyword.padEnd(30)} → ERROR: ${error.message}`);
          return { keyword, data: null };
        });
    });

    const searchResults = await Promise.all(searchPromises);
    console.log('\n✅ All searches completed!\n');

    // ============================================
    // STEP 2: Collect unique place IDs
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STEP 2/3: Filtering unique restaurants');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const placeIdMap = new Map(); // place_id -> keyword that found it
    let totalFound = 0;
    
    searchResults.forEach(({ keyword, data }) => {
      if (data && data.status === 'OK' && data.results) {
        data.results.forEach(place => {
          totalFound++;
          if (!placeIdMap.has(place.place_id)) {
            placeIdMap.set(place.place_id, keyword);
          }
        });
      }
    });

    const placeIdArray = Array.from(placeIdMap.keys());
    console.log(`📊 Total results from searches: ${totalFound}`);
    console.log(`📊 Unique restaurants found: ${placeIdArray.length}`);
    console.log(`📊 Duplicates removed: ${totalFound - placeIdArray.length}\n`);

    // ============================================
    // STEP 3: Fetch detailed info for each
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STEP 3/3: Fetching detailed information');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💰 This costs ~$0.017 per restaurant\n');

    const BATCH_SIZE = 10; // Process 10 at a time
    const allRestaurants = new Map();
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < placeIdArray.length; i += BATCH_SIZE) {
      const batch = placeIdArray.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(placeIdArray.length / BATCH_SIZE);
      
      process.stdout.write(`  Batch ${batchNum}/${totalBatches} (${batch.length} restaurants)... `);
      
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
          return null;
        }
      });

      const batchResults = await Promise.all(detailsPromises);
      
      // Count successes
      batchResults.forEach(result => {
        if (result) {
          allRestaurants.set(result.placeId, result.data);
          successCount++;
        } else {
          errorCount++;
        }
      });

      console.log(`✓ [${successCount} OK, ${errorCount} errors]`);

      // Small delay between batches
      if (i + BATCH_SIZE < placeIdArray.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const restaurants = Array.from(allRestaurants.values());
    console.log(`\n✅ Successfully fetched ${restaurants.length} restaurants!\n`);

    // ============================================
    // SAVE TO JSON FILE
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('SAVING DATA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Create data directory if it doesn't exist
    const dataDir = path.resolve(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('📁 Created data/ directory');
    }

    // Prepare output data
    const outputData = {
      restaurants,
      lastUpdated: new Date().toISOString(),
      count: restaurants.length,
      location: {
        latitude,
        longitude,
        radius,
        city: 'Boston, MA'
      },
      metadata: {
        fetchDate: new Date().toISOString(),
        keywordsSearched: keywords.length,
        totalSearchResults: totalFound,
        uniqueRestaurants: placeIdArray.length,
        successfulFetches: restaurants.length,
        failedFetches: errorCount
      }
    };

    // Save to JSON file
    const outputPath = path.resolve(dataDir, 'restaurants.json');
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    
    console.log(`📄 Saved to: ${outputPath}`);
    console.log(`📊 File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB\n`);

    // ============================================
    // COST BREAKDOWN
    // ============================================
    const searchCost = keywords.length * 0.032;
    const detailsCost = restaurants.length * 0.017;
    const totalCost = searchCost + detailsCost;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💰 COST BREAKDOWN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`  Nearby Search:    ${keywords.length} × $0.032 = $${searchCost.toFixed(2)}`);
    console.log(`  Place Details:    ${restaurants.length} × $0.017 = $${detailsCost.toFixed(2)}`);
    console.log(`  ─────────────────────────────────────────────`);
    console.log(`  TOTAL COST:                      ~$${totalCost.toFixed(2)}`);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ SUCCESS! ✨');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`✅ ${restaurants.length} restaurants saved to data/restaurants.json`);
    console.log(`💰 Cost: ~$${totalCost.toFixed(2)} (one-time)`);
    console.log(`📅 Last updated: ${new Date().toLocaleString()}`);
    console.log('\n🚀 Next step: Update your server to use this data!');
    console.log('   Your server should read from data/restaurants.json\n');

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the fetch!
fetchAndSaveRestaurants();