import React from 'react';

const SkeletonCard = ({ index = 0 }) => {
  return (
    <article
      className="bg-white rounded-3xl overflow-hidden animate-pulse"
      style={{
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
        animationDelay: `${index * 50}ms`
      }}
      aria-label="Loading restaurant..."
    >
      {/* Image skeleton */}
      <div className="relative w-full h-56 bg-gradient-to-br from-gray-200 to-gray-300">
        {/* Category badge skeleton */}
        <div className="absolute top-4 right-4">
          <div className="h-7 w-24 bg-gray-300 rounded-full"></div>
        </div>
        {/* Open/Closed badge skeleton */}
        <div className="absolute top-4 left-4">
          <div className="h-7 w-20 bg-gray-300 rounded-full"></div>
        </div>
      </div>

      <div className="p-6">
        {/* Restaurant name skeleton */}
        <div className="mb-3 space-y-2">
          <div className="h-7 bg-gray-200 rounded-lg w-3/4"></div>
        </div>

        {/* Rating and Price skeleton */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="h-10 w-32 bg-gray-200 rounded-xl"></div>
          <div className="h-10 w-20 bg-gray-200 rounded-xl"></div>
        </div>

        {/* Address skeleton */}
        <div className="flex items-start gap-3 mb-3 pb-3 border-b border-gray-100">
          <div className="w-4 h-4 bg-gray-200 rounded-full mt-1 flex-shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>

        {/* Distance badge skeleton */}
        <div className="mb-4">
          <div className="h-11 bg-gray-200 rounded-xl w-48"></div>
        </div>

        {/* Action buttons skeleton */}
        <div className="flex flex-wrap gap-3 pt-2">
          <div className="flex-1 h-12 bg-gray-200 rounded-xl min-w-[120px]"></div>
          <div className="flex-1 h-12 bg-gray-200 rounded-xl min-w-[120px]"></div>
        </div>
      </div>
    </article>
  );
};

export default SkeletonCard;
