import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { FaMapMarkerAlt, FaStar, FaDollarSign, FaExternalLinkAlt, FaClock, FaGlobe } from 'react-icons/fa';
import { MdRestaurant } from 'react-icons/md';

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
      {restaurant.photo && (
        <div className="relative w-full h-56 overflow-hidden bg-gradient-to-br from-coral to-plantain">
          <img
            src={restaurant.photo}
            alt={`${restaurant.name} exterior or food`}
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
          {restaurant.opening_hours && (
            <div className="absolute top-4 left-4">
              {restaurant.opening_hours.open_now ? (
                <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-oceanmint text-cafe shadow-lg flex items-center gap-1">
                  <FaClock />
                  Open Now
                </span>
              ) : (
                <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/90 text-gray-600 shadow-lg flex items-center gap-1">
                  <FaClock />
                  Closed
                </span>
              )}
            </div>
          )}
        </div>
      )}

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
            <span>{restaurant.distance.toFixed(1)} miles from BU</span>
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
              <span>View on Maps</span>
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
              <span>Website</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
};

export default RestaurantCard;
