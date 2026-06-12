import React from 'react';

export function RestaurantShimmer({ count = 6 }) {
  return (
    <div className="restaurant-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="shimmer-card">
          <div className="shimmer-img"></div>
          <div className="shimmer-content">
            <div className="shimmer-title"></div>
            <div className="shimmer-text"></div>
            <div className="shimmer-footer"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
