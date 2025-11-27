import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('default'); // default, distance, alphabetical

  const categories = ['all', 'Mexican', 'Colombian', 'Puerto Rican', 'Dominican', 'Peruvian', 'Cuban', 'Venezuelan', 'Salvadoran', 'Brazilian', 'Argentinian', 'Spanish', 'Other'];

  // Boston University coordinates
  const BU_LAT = 42.3505;
  const BU_LON = -71.1054;

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/restaurants');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch restaurants');
      }
      setRestaurants(data.restaurants || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  const categorizeRestaurant = (restaurant) => {
    const name = restaurant.name.toLowerCase();
    const types = restaurant.types ? restaurant.types.join(' ').toLowerCase() : '';
    const keyword = restaurant.searchKeyword ? restaurant.searchKeyword.toLowerCase() : '';
    const searchText = name + ' ' + types + ' ' + keyword;
    
    if (searchText.includes('mexican') || searchText.includes('taco') || searchText.includes('burrito') || 
        searchText.includes('cantina') || searchText.includes('taqueria') || searchText.includes('quesadilla')) {
      return 'Mexican';
    } else if (searchText.includes('colombian') || searchText.includes('arepa') || searchText.includes('colombia') ||
               searchText.includes('bandeja') || searchText.includes('empanada colombian')) {
      return 'Colombian';
    } else if (searchText.includes('puerto rican') || searchText.includes('boricua') || searchText.includes('puerto rico') ||
               searchText.includes('mofongo') || searchText.includes('pernil')) {
      return 'Puerto Rican';
    } else if (searchText.includes('dominican') || searchText.includes('dominicana') || searchText.includes('mangu')) {
      return 'Dominican';
    } else if (searchText.includes('peruvian') || searchText.includes('ceviche') || searchText.includes('peru') ||
               searchText.includes('lomo saltado') || searchText.includes('pollo a la brasa')) {
      return 'Peruvian';
    } else if (searchText.includes('cuban') || searchText.includes('cuba') || searchText.includes('habana') ||
               searchText.includes('ropa vieja') || searchText.includes('cubano')) {
      return 'Cuban';
    } else if (searchText.includes('venezuelan') || searchText.includes('venezuela') || searchText.includes('cachapa')) {
      return 'Venezuelan';
    } else if (searchText.includes('salvadoran') || searchText.includes('pupusa') || searchText.includes('el salvador')) {
      return 'Salvadoran';
    } else if (searchText.includes('brazilian') || searchText.includes('brazil') || searchText.includes('churrasco') ||
               searchText.includes('feijoada')) {
      return 'Brazilian';
    } else if (searchText.includes('argentinian') || searchText.includes('argentina') || searchText.includes('parrilla')) {
      return 'Argentinian';
    } else if (searchText.includes('spanish') || searchText.includes('spain') || searchText.includes('tapas') ||
               searchText.includes('paella')) {
      return 'Spanish';
    }
    return 'Other';
  };

  // Add category and distance to restaurants
  const restaurantsWithDetails = restaurants.map(r => {
    const category = categorizeRestaurant(r);
    let distance = null;
    if (r.geometry && r.geometry.location) {
      distance = calculateDistance(BU_LAT, BU_LON, r.geometry.location.lat, r.geometry.location.lng);
    }
    return { ...r, category, distance };
  });

  // Filter by category
  let filteredRestaurants = restaurantsWithDetails.filter(r => 
    selectedCategory === 'all' || r.category === selectedCategory
  );

  // Sort restaurants
  if (sortBy === 'distance') {
    filteredRestaurants = filteredRestaurants.sort((a, b) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
  } else if (sortBy === 'rating') {
    filteredRestaurants = filteredRestaurants.sort((a, b) => {
      if (!a.rating) return 1;
      if (!b.rating) return -1;
      return b.rating - a.rating; // Higher ratings first
    });
  } else if (sortBy === 'alphabetical') {
    filteredRestaurants = filteredRestaurants.sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }

  const getCategoryCount = (category) => {
    if (category === 'all') return restaurants.length;
    return restaurantsWithDetails.filter(r => r.category === category).length;
  };

  return (
    <div className="App">
      <header className="header">
        <h1>🌮 Latino Restaurants in Boston</h1>
        <p className="subtitle">Discover authentic Latino cuisine across the city</p>
      </header>

      {/* Filter Container */}
      <div className="filter-container">
        <div className="filter-section">
          <h3>Filter by Cuisine:</h3>
          <div className="category-buttons">
            {categories.map(category => (
              <button key={category} onClick={() => setSelectedCategory(category)} className={'category-button' + (selectedCategory === category ? ' active' : '')}>
                {category} ({getCategoryCount(category)})
              </button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <h3>Sort by:</h3>
          <div className="sort-buttons">
            <button onClick={() => setSortBy('default')} className={'sort-button' + (sortBy === 'default' ? ' active' : '')}>
              Default
            </button>
            <button onClick={() => setSortBy('distance')} className={'sort-button' + (sortBy === 'distance' ? ' active' : '')}>
              Distance from BU
            </button>
            <button onClick={() => setSortBy('rating')} className={'sort-button' + (sortBy === 'rating' ? ' active' : '')}>
              Rating (High to Low)
            </button>
            <button onClick={() => setSortBy('alphabetical')} className={'sort-button' + (sortBy === 'alphabetical' ? ' active' : '')}>
              Alphabetical (A-Z)
            </button>
          </div>
        </div>
      </div>

      {loading && (<div className="message-box"><p>Loading restaurants...</p></div>)}
      {error && (<div className="message-box error"><p>⚠️ Error: {error}</p><button onClick={fetchRestaurants} className="retry-button">Try Again</button></div>)}
      {!loading && !error && (
        <div className="grid">
          {filteredRestaurants.length === 0 ? (<p className="no-results">No restaurants found in this category.</p>) : (
            filteredRestaurants.map((restaurant, index) => (
              <div key={index} className="card">
                <div className="category-badge">{restaurant.category}</div>
                <h2>{restaurant.name}</h2>
                <div className="cuisine-type">🍽️ {restaurant.category} Cuisine</div>
                <p className="address">{restaurant.address}</p>
                {restaurant.distance && (
                  <div className="distance">
                    📍 {restaurant.distance.toFixed(1)} miles from BU
                  </div>
                )}
                {restaurant.rating && (<div className="rating">⭐ {restaurant.rating} ({restaurant.user_ratings_total || 0} reviews)</div>)}
                {restaurant.price_level && (<div className="price-level">{'$'.repeat(restaurant.price_level)}</div>)}
                {restaurant.opening_hours && (<div className="open-status">{restaurant.opening_hours.open_now ? <span className="open-now">🟢 Open Now</span> : <span className="closed">🔴 Closed</span>}</div>)}
                {restaurant.place_id && (<a href={'https://www.google.com/maps/search/?api=1&query=Google&query_place_id=' + restaurant.place_id} target="_blank" rel="noopener noreferrer" className="view-button">View on Google Maps</a>)}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default App;