import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { FaStar, FaMapMarkerAlt, FaGlobe, FaClock } from 'react-icons/fa';

// Fix for default marker icon in Leaflet with Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom colored markers
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-icon',
    html: `<div style="background-color: ${color}; width: 25px; height: 25px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [25, 25],
    iconAnchor: [12, 24],
  });
};

const categoryColors = {
  'Mexican': '#E76F51',
  'Colombian': '#F4A261',
  'Puerto Rican': '#2E86AB',
  'Dominican': '#80CED7',
  'Peruvian': '#E76F51',
  'Cuban': '#F4A261',
  'Venezuelan': '#2E86AB',
  'Salvadoran': '#80CED7',
  'Brazilian': '#E76F51',
  'Argentinian': '#F4A261',
  'Spanish': '#2E86AB',
  'Other': '#2A2A2A',
};

const RestaurantMap = ({ restaurants, selectedCategory }) => {
  const bostonCenter = [42.3601, -71.0589];

  const filteredRestaurants = restaurants.filter(r =>
    selectedCategory === 'all' || r.category === selectedCategory
  );

  return (
    <div className="h-[500px] w-full rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)' }}>
      <MapContainer
        center={bostonCenter}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {filteredRestaurants.map((restaurant, idx) => {
          if (!restaurant.geometry?.location) return null;

          const position = [
            restaurant.geometry.location.lat,
            restaurant.geometry.location.lng
          ];

          const markerColor = categoryColors[restaurant.category] || '#B5654A';

          return (
            <Marker
              key={idx}
              position={position}
              icon={createCustomIcon(markerColor)}
            >
              <Popup className="custom-popup">
                <div className="p-1 min-w-[280px]">
                  <h3 className="font-bold text-xl mb-3 text-cafe leading-tight">{restaurant.name}</h3>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="inline-block px-3 py-1.5 rounded-full text-xs font-bold bg-coral text-white shadow-sm">
                      {restaurant.category}
                    </span>
                    {restaurant.weekday_text && (() => {
  const now = new Date();
  const today = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = daysMap[today];
  const todayHours = restaurant.weekday_text.find(text => text.startsWith(todayName));
  
  if (todayHours) {
    if (todayHours.includes('Closed')) {
      return (
        <span className="inline-block px-3 py-1.5 rounded-full text-xs font-bold bg-gray-200 text-gray-600 shadow-sm flex items-center gap-1">
          <FaClock className="text-xs" />
          Closed
        </span>
      );
    }
    
    const hoursMatch = todayHours.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*[–-]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/);
    
    if (hoursMatch) {
      let [_, openHour, openMin, openPeriod, closeHour, closeMin, closePeriod] = hoursMatch;
      
      openHour = parseInt(openHour);
      closeHour = parseInt(closeHour);
      openMin = parseInt(openMin);
      closeMin = parseInt(closeMin);
      
      if (openPeriod === 'PM' && openHour !== 12) openHour += 12;
      if (openPeriod === 'AM' && openHour === 12) openHour = 0;
      if (closePeriod === 'PM' && closeHour !== 12) closeHour += 12;
      if (closePeriod === 'AM' && closeHour === 12) closeHour = 0;
      
      const openTime = openHour * 60 + openMin;
      let closeTime = closeHour * 60 + closeMin;
      
      if (closeTime < openTime) {
        closeTime += 24 * 60;
      }
      
      let isOpen;
      if (closeTime > 24 * 60) {
        isOpen = currentTime >= openTime || currentTime < (closeTime - 24 * 60);
      } else {
        isOpen = currentTime >= openTime && currentTime < closeTime;
      }
      
      return isOpen ? (
        <span className="inline-block px-3 py-1.5 rounded-full text-xs font-bold bg-oceanmint text-cafe shadow-sm flex items-center gap-1">
          <FaClock className="text-xs" />
          Open Now
        </span>
      ) : (
        <span className="inline-block px-3 py-1.5 rounded-full text-xs font-bold bg-gray-200 text-gray-600 shadow-sm flex items-center gap-1">
          <FaClock className="text-xs" />
          Closed
        </span>
      );
    }
  }
  return null;
})()}
                  </div>

                  <p className="text-sm text-gray-700 mb-3 flex items-start gap-2 leading-relaxed">
                    <FaMapMarkerAlt className="text-coral mt-1 flex-shrink-0" />
                    <span>{restaurant.address}</span>
                  </p>

                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-200">
                    {restaurant.rating && (
                      <div className="flex items-center gap-1.5 text-base">
                        <FaStar className="text-plantain" />
                        <span className="font-bold text-cafe">{restaurant.rating}</span>
                        <span className="text-gray-400 text-xs">({restaurant.user_ratings_total || 0})</span>
                      </div>
                    )}
                    {restaurant.distance && (
                      <span className="text-sm text-cariblue font-semibold">
                        {restaurant.distance.toFixed(1)} mi from BU
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {restaurant.place_id && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${restaurant.place_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-cariblue text-white rounded-xl text-sm font-bold hover:bg-opacity-90 transition-all shadow-md"
                      >
                        <FaMapMarkerAlt />
                        <span>View on Google Maps</span>
                      </a>
                    )}
                    {restaurant.website && (
                      <a
                        href={restaurant.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-plantain text-white rounded-xl text-sm font-bold hover:bg-opacity-90 transition-all shadow-md"
                      >
                        <FaGlobe />
                        <span>Visit Website</span>
                      </a>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default RestaurantMap;
