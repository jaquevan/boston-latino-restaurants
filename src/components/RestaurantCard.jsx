import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { FaMapMarkerAlt, FaStar, FaDollarSign, FaExternalLinkAlt, FaClock, FaGlobe } from 'react-icons/fa';
import { MdRestaurant } from 'react-icons/md';

const getCategoryFlag = (category) => {
  const flagMap = {
    'Mexican': '/flags/Mexico.png',
    'Colombian': '/flags/Colombia.png',
    'Puerto Rican': '/flags/Puerto_Rico.png',
    'Dominican': '/flags/Dominican_Republic.png',
    'Peruvian': '/flags/Peru.png',
    'Cuban': '/flags/Cuba.png',
    'Venezuelan': '/flags/Venezuela.png',
    'Salvadoran': '/flags/El_Salvador.png',
    'Brazilian': '/flags/Brazil.png',
    'Argentinian': '/flags/Argentina.png',
    'Spanish': '/flags/Spain.png',
    'Other': '/flags/Other.png'
  };
  return flagMap[category] || '/flags/Other.png';
};

const RestaurantCard = ({ restaurant, index }) => {
  const cardRef = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    // Create intersection observer to only animate when card is visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            // Simple fade-in animation only
            gsap.fromTo(
              cardRef.current,
              { opacity: 0, y: 30 },
              {
                opacity: 1,
                y: 0,
                duration: 0.5,
                ease: 'power2.out'
              }
            );
            setHasAnimated(true);
            // Unobserve after animating once
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [hasAnimated]);

  return (
    <article
      ref={cardRef}
      className="bg-white rounded-3xl overflow-hidden group transition-all duration-300 hover:-translate-y-3 hover:scale-[1.02] opacity-0"
      style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)' }}
      aria-label={`${restaurant.name} - ${restaurant.category} restaurant`}
    >
      <div className="relative w-full h-56 overflow-hidden bg-gradient-to-br from-coral to-plantain">
  <img
    src={getCategoryFlag(restaurant.category)}
    alt={`${restaurant.category} flag`}
    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
    loading="lazy"
  />
  {/* Category badge overlay */}
  <div className="absolute top-4 right-4">
    <span className="px-4 py-2 rounded-full text-xs font-bold bg-coral text-white shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:scale-105">
      {restaurant.category}
    </span>
  </div>
  {/* Open/Closed badge */}
  {restaurant.weekday_text && (
  <div className="absolute top-4 left-4">
    {(() => {
      const now = new Date();
      const today = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes
      
      const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayName = daysMap[today];
      
      // Find today's hours
      const todayHours = restaurant.weekday_text.find(text => text.startsWith(todayName));
      
      if (todayHours) {
        // Check if it says "Closed"
        if (todayHours.includes('Closed')) {
          return (
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/90 text-gray-600 shadow-lg flex items-center gap-1">
              <FaClock />
              Closed
            </span>
          );
        }
        
        // Parse hours - handle both – (en-dash) and - (hyphen)
        const hoursMatch = todayHours.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*[–-]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/);
        
        if (hoursMatch) {
          let [_, openHour, openMin, openPeriod, closeHour, closeMin, closePeriod] = hoursMatch;
          
          // Convert to 24-hour format
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
          
          // Handle places that close after midnight (e.g., 3:00 AM)
          // If close time is earlier than open time, it means next day
          if (closeTime < openTime) {
            closeTime += 24 * 60; // Add 24 hours
          }
          
          // Check if currently open
          let isOpen;
          if (closeTime > 24 * 60) {
            // Place closes after midnight
            isOpen = currentTime >= openTime || currentTime < (closeTime - 24 * 60);
          } else {
            // Normal hours (same day)
            isOpen = currentTime >= openTime && currentTime < closeTime;
          }
          
          return isOpen ? (
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-oceanmint text-cafe shadow-lg flex items-center gap-1">
              <FaClock />
              Abierto ahora
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/90 text-gray-600 shadow-lg flex items-center gap-1">
              <FaClock />
              Cerrado ahora
            </span>
          );
        }
      }
      
      // Fallback if no hours available
      return null;
    })()}
  </div>
)}
</div>

      <div className="p-6">
        {/* Restaurant name */}
        <h2 className="text-2xl font-bold text-cafe mb-3 leading-tight">{restaurant.name}</h2>

        {/* Rating and Price */}
        <div className="flex flex-wrap gap-3 mb-4">
          {restaurant.rating && (
            <div className="flex items-center gap-2 text-base font-bold bg-gradient-to-r from-plantain/20 to-plantain/10 px-4 py-2 rounded-xl">
              <FaStar className="text-plantain text-lg" />
              <span className="text-cafe">{restaurant.rating}</span>
              <span className="text-gray-400 text-sm font-normal">({restaurant.user_ratings_total || 0})</span>
            </div>
          )}

          {restaurant.price_level && (
            <div className="flex items-center gap-0.5 text-base font-bold text-cariblue bg-cariblue/10 px-4 py-2 rounded-xl">
              {[...Array(restaurant.price_level)].map((_, i) => (
                <FaDollarSign key={i} className="text-sm" />
              ))}
            </div>
          )}
        </div>

        {/* Address */}
        <div className="flex items-start gap-3 text-sm text-gray-600 mb-3 pb-3 border-b border-gray-100">
          <FaMapMarkerAlt className="text-coral mt-1 flex-shrink-0 text-base" />
          <span className="leading-relaxed">{restaurant.address}</span>
        </div>

        {/* Distance badge */}
        {restaurant.distance && (
          <div className="text-sm font-semibold text-cariblue mb-4 flex items-center gap-2 bg-cariblue/5 rounded-xl px-4 py-3 border-2 border-cariblue/20">
            <FaMapMarkerAlt className="text-base" />
            <span>{restaurant.distance.toFixed(1)} millas de BU</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 pt-2">
          {restaurant.place_id && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${restaurant.place_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-cariblue text-white rounded-xl hover:bg-opacity-90 transition-all text-sm font-bold shadow-md hover:shadow-lg"
              aria-label={`View ${restaurant.name} on Google Maps`}
            >
              <FaMapMarkerAlt aria-hidden="true" />
              <span>Ver en mapas</span>
            </a>
          )}

          {restaurant.website && (
            <a
              href={restaurant.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-plantain text-white rounded-xl hover:bg-opacity-90 transition-all text-sm font-bold shadow-md hover:shadow-lg"
              aria-label={`Visit ${restaurant.name} website`}
            >
              <FaGlobe aria-hidden="true" />
              <span>Sitio web</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
};

export default RestaurantCard;
