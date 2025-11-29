import React, { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { FaMapMarkerAlt, FaStar, FaFilter, FaUtensils, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { MdRestaurant } from 'react-icons/md';
import { GiTacos } from 'react-icons/gi';
import { gsap } from 'gsap';
import RestaurantCard from './components/RestaurantCard';

// Lazy load the map component
const RestaurantMap = lazy(() => import('./components/RestaurantMap'));

function App() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [isMapExpanded, setIsMapExpanded] = useState(true);

  // Refs for GSAP animations
  const heroIconRef = useRef(null);
  const heroTitleRef = useRef(null);
  const heroSubtitleRef = useRef(null);
  const heroStatsRef = useRef([]);

  const categories = ['all', 'Mexican', 'Colombian', 'Puerto Rican', 'Dominican', 'Peruvian', 'Cuban', 'Venezuelan', 'Salvadoran', 'Brazilian', 'Argentinian', 'Spanish', 'Other'];

  // Boston University coordinates
  const BU_LAT = 42.3505;
  const BU_LON = -71.1054;

  useEffect(() => {
    fetchRestaurants();
  }, []);

  // GSAP Hero Animations
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(
      heroIconRef.current,
      { opacity: 0, scale: 0, rotation: -180 },
      { opacity: 1, scale: 1, rotation: 0, duration: 1, ease: 'back.out(1.7)' }
    )
    .fromTo(
      heroTitleRef.current,
      { opacity: 0, y: -50 },
      { opacity: 1, y: 0, duration: 0.8 },
      '-=0.5'
    )
    .fromTo(
      heroSubtitleRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8 },
      '-=0.4'
    )
    .fromTo(
      heroStatsRef.current,
      { opacity: 0, y: 40, scale: 0.8 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.15 },
      '-=0.4'
    );
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
    <div className="min-h-screen bg-coco" data-theme="latino">
      {/* Hero Section - Rebranded */}
      <header className="relative overflow-hidden bg-gradient-to-br from-coral via-coral to-plantain h-screen max-h-[85vh] flex items-center">
        {/* Floating bubbles with varied colors */}
        <div className="floating-bubble bg-cariblue"></div>
        <div className="floating-bubble bg-plantain"></div>
        <div className="floating-bubble bg-oceanmint"></div>
        <div className="floating-bubble bg-white"></div>
        <div className="floating-bubble bg-cariblue"></div>
        <div className="floating-bubble bg-coral"></div>
        <div className="floating-bubble bg-plantain"></div>
        <div className="floating-bubble bg-oceanmint"></div>
        <div className="floating-bubble bg-white"></div>
        <div className="floating-bubble bg-cariblue"></div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            {/* Icon with animation ref */}
            <div ref={heroIconRef} className="mb-6">
              <div className="inline-block p-4 bg-white/20 backdrop-blur-md rounded-full shadow-2xl">
                <GiTacos className="text-7xl md:text-8xl text-white" aria-hidden="true" />
              </div>
            </div>

            {/* Title with animation ref */}
            <h1
              ref={heroTitleRef}
              className="text-6xl md:text-8xl font-black text-white mb-4 tracking-tighter"
              style={{ textShadow: '4px 4px 20px rgba(0,0,0,0.3)' }}
            >
              Sabor Latino Boston
            </h1>

            {/* Subtitle with animation ref */}
            <p
              ref={heroSubtitleRef}
              className="text-xl md:text-3xl text-white mb-12 max-w-4xl mx-auto font-light leading-relaxed"
              style={{ textShadow: '2px 2px 10px rgba(0,0,0,0.2)' }}
            >
              Discover the heart of Latino cuisine in Boston
            </p>

            {/* Stats cards with animation refs */}
            <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto" role="list">
              <div
                ref={(el) => (heroStatsRef.current[0] = el)}
                className="group bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl hover:bg-white/20 transition-all duration-300 min-w-[160px] border-2 border-white/20"
                role="listitem"
              >
                <MdRestaurant className="text-white text-4xl mx-auto mb-3 group-hover:scale-110 transition-transform" aria-hidden="true" />
                {loading ? (
                  <div className="text-4xl font-black text-white mb-1 animate-pulse">...</div>
                ) : (
                  <div className="text-4xl font-black text-white mb-1">{restaurants.length}+</div>
                )}
                <div className="text-base text-white/90 font-medium">Restaurants</div>
              </div>

              <div
                ref={(el) => (heroStatsRef.current[1] = el)}
                className="group bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl hover:bg-white/20 transition-all duration-300 min-w-[160px] border-2 border-white/20"
                role="listitem"
              >
                <FaMapMarkerAlt className="text-white text-4xl mx-auto mb-3 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <div className="text-4xl font-black text-white mb-1">5mi</div>
                <div className="text-base text-white/90 font-medium">Radius</div>
              </div>

              <div
                ref={(el) => (heroStatsRef.current[2] = el)}
                className="group bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl hover:bg-white/20 transition-all duration-300 min-w-[160px] border-2 border-white/20"
                role="listitem"
              >
                <FaUtensils className="text-white text-4xl mx-auto mb-3 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <div className="text-4xl font-black text-white mb-1">13</div>
                <div className="text-base text-white/90 font-medium">Cuisines</div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F7F7F7"/>
          </svg>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Map and Filters Side by Side */}
        {!loading && !error && restaurantsWithDetails.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Filter Container - Left Side */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 sticky top-4" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-cafe">
                  <FaFilter className="text-coral text-lg" />
                  Filter by Cuisine
                </h3>
                <div className="flex flex-col gap-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all text-left ${
                        selectedCategory === category
                          ? 'bg-coral text-white shadow-md'
                          : 'bg-coco text-cafe hover:bg-gray-100'
                      }`}
                    >
                      {category} ({getCategoryCount(category)})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Map Section - Right Side */}
            <div className="lg:col-span-2">
              {/* Sort Controls */}
              <div className="bg-white rounded-2xl p-4 mb-4" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-bold text-cafe">Sort by:</span>
                  <button
                    onClick={() => setSortBy('default')}
                    className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                      sortBy === 'default'
                        ? 'bg-cariblue text-white shadow-md'
                        : 'bg-coco text-cafe hover:bg-gray-100'
                    }`}
                  >
                    Default
                  </button>
                  <button
                    onClick={() => setSortBy('distance')}
                    className={`px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                      sortBy === 'distance'
                        ? 'bg-cariblue text-white shadow-md'
                        : 'bg-coco text-cafe hover:bg-gray-100'
                    }`}
                  >
                    <FaMapMarkerAlt /> Distance
                  </button>
                  <button
                    onClick={() => setSortBy('rating')}
                    className={`px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                      sortBy === 'rating'
                        ? 'bg-cariblue text-white shadow-md'
                        : 'bg-coco text-cafe hover:bg-gray-100'
                    }`}
                  >
                    <FaStar /> Rating
                  </button>
                  <button
                    onClick={() => setSortBy('alphabetical')}
                    className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                      sortBy === 'alphabetical'
                        ? 'bg-cariblue text-white shadow-md'
                        : 'bg-coco text-cafe hover:bg-gray-100'
                    }`}
                  >
                    A-Z
                  </button>
                </div>
              </div>

              {/* Map Container */}
              <div>
                <button
                  onClick={() => setIsMapExpanded(!isMapExpanded)}
                  className="w-full flex items-center justify-between text-xl font-bold text-cafe px-4 py-3 bg-white rounded-xl hover:bg-gray-50 transition-colors mb-4"
                  style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}
                  aria-expanded={isMapExpanded}
                  aria-controls="restaurant-map"
                >
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-coral text-xl" aria-hidden="true" />
                    <span>Restaurant Locations</span>
                  </div>
                  {isMapExpanded ? (
                    <FaChevronUp className="text-lg text-gray-500" aria-hidden="true" />
                  ) : (
                    <FaChevronDown className="text-lg text-gray-500" aria-hidden="true" />
                  )}
                </button>
              {isMapExpanded && (
                <div id="restaurant-map" role="region" aria-label="Interactive map showing restaurant locations">
                  <Suspense fallback={
                    <div className="h-[500px] w-full rounded-2xl bg-white flex items-center justify-center" style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)' }}>
                      <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-cariblue border-t-transparent mb-4"></div>
                        <p className="text-cafe font-medium">Loading map...</p>
                      </div>
                    </div>
                  }>
                    <RestaurantMap
                      restaurants={restaurantsWithDetails}
                      selectedCategory={selectedCategory}
                    />
                  </Suspense>
                </div>
              )}
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-2xl p-12 text-center" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-cariblue border-t-transparent mb-4"></div>
            <p className="text-lg text-cafe font-medium">Loading restaurants...</p>
          </div>
        )}

        {error && (
          <div className="bg-white rounded-2xl p-6 flex items-center justify-between" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
            <div className="flex items-center gap-3">
              <div className="text-coral text-2xl">⚠</div>
              <span className="text-cafe font-medium">Error: {error}</span>
            </div>
            <button
              onClick={fetchRestaurants}
              className="px-4 py-2 bg-coral text-white rounded-lg hover:bg-opacity-90 transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <h2 className="text-2xl font-bold text-cafe mb-6 flex items-center gap-2">
              <MdRestaurant className="text-cariblue text-3xl" />
              All Restaurants ({filteredRestaurants.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRestaurants.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-white rounded-2xl" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' }}>
                  <p className="text-lg text-terracotta">No restaurants found in this category.</p>
                </div>
              ) : (
                filteredRestaurants.map((restaurant, index) => (
                  <RestaurantCard key={index} restaurant={restaurant} index={index} />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;