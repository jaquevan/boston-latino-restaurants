// Vercel Serverless function - Serves cached restaurant data from JSON
import fs from 'fs';
import path from 'path';

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

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📦 Serving cached restaurant data from JSON file');
    
    // Read the restaurants.json file
    const dataPath = path.resolve(process.cwd(), 'data/restaurants.json');
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    const restaurantsData = JSON.parse(fileContent);
    
    console.log(`✅ Loaded ${restaurantsData.count} restaurants from cache`);
    
    // Return the cached data
    res.status(200).json(restaurantsData);
    
  } catch (error) {
    console.error('❌ Error loading restaurant data:', error.message);
    res.status(500).json({
      error: 'Failed to load restaurant data',
      details: error.message,
      hint: 'Make sure data/restaurants.json exists in your project'
    });
  }
}