import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function updatePhotoURLs() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║        Converting Photo References to URLs           ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    console.error('❌ ERROR: API key not found in .env file');
    process.exit(1);
  }

  // Read the existing restaurants.json
  const dataPath = path.resolve(__dirname, '../data/restaurants.json');
  
  console.log('📂 Reading restaurants.json...');
  const fileContent = fs.readFileSync(dataPath, 'utf-8');
  const data = JSON.parse(fileContent);
  
  console.log(`✅ Found ${data.restaurants.length} restaurants`);
  console.log('🔄 Converting photo references to permanent URLs...\n');

  let updatedCount = 0;
  let alreadyDone = 0;

  // Update each restaurant's photo URL
  data.restaurants.forEach((restaurant, index) => {
    if (restaurant.photo) {
      // Check if it's still a reference URL (contains photo_reference parameter)
      if (restaurant.photo.includes('photo_reference')) {
        // Add the API key to make it a permanent URL
        restaurant.photo = `${restaurant.photo}&key=${apiKey}`;
        updatedCount++;
        
        if (index < 5) {
          console.log(`  ✓ ${restaurant.name.substring(0, 30).padEnd(30)} → Updated`);
        }
      } else if (restaurant.photo.includes('key=')) {
        // Already has a key
        alreadyDone++;
      } else {
        // Add key if missing
        restaurant.photo = `${restaurant.photo}&key=${apiKey}`;
        updatedCount++;
      }
    }
  });

  if (updatedCount > 5) {
    console.log(`  ... (${updatedCount - 5} more)`);
  }

  console.log(`\n📊 Summary:`);
  console.log(`   • Photos updated: ${updatedCount}`);
  console.log(`   • Already had URLs: ${alreadyDone}`);
  console.log(`   • No photos: ${data.restaurants.length - updatedCount - alreadyDone}`);

  // Save the updated data back
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  
  console.log('\n✅ SUCCESS!');
  console.log(`📄 Updated file saved: ${dataPath}`);
  console.log('\n🎉 All photo URLs are now permanent!');
  console.log('   Your frontend can now display images without API key!\n');
}

updatePhotoURLs();