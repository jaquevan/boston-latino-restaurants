import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Load cached restaurant data from JSON file
let restaurantsData;
const dataPath = resolve(__dirname, '../data/restaurants.json');

try {
  console.log('📂 Loading restaurant data from:', dataPath);
  const fileContent = fs.readFileSync(dataPath, 'utf-8');
  restaurantsData = JSON.parse(fileContent);
  
  console.log('✅ Successfully loaded restaurant data!');
  console.log(`📊 Restaurants: ${restaurantsData.count}`);
  console.log(`📅 Last updated: ${new Date(restaurantsData.lastUpdated).toLocaleString()}`);
  
} catch (error) {
  console.error('❌ Error loading restaurant data:', error.message);
  restaurantsData = { 
    restaurants: [], 
    count: 0,
    lastUpdated: null
  };
}

// API route - just returns the cached JSON data
app.get('/api/restaurants', (req, res) => {
  console.log('📦 Serving cached restaurant data (cost: $0.00)');
  
  if (restaurantsData.count === 0) {
    return res.status(503).json({
      error: 'Restaurant data not available',
      message: 'Run: node server/fetch_restaurants.js'
    });
  }
  
  res.json(restaurantsData);
});

app.get('/api/health', (req, res) => {
  res.json({
    status: restaurantsData.count > 0 ? 'healthy' : 'no_data',
    restaurantCount: restaurantsData.count,
    lastUpdated: restaurantsData.lastUpdated
  });
});

app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║          🚀 Server Started Successfully! 🚀            ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`📊 Serving ${restaurantsData.count} restaurants`);
  console.log(`💰 Cost per request: $0.00 (cached data)\n`);
});