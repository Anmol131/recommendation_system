import React, { useRef, useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import MediaCard from './MediaCard';

const SkeletonCard = () => (
  <div className="bg-surface rounded-xl overflow-hidden animate-pulse flex-shrink-0">
    <div className="h-56 bg-surface2" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-surface2 rounded w-3/4" />
      <div className="h-3 bg-surface2 rounded w-1/2" />
      <div className="h-3 bg-surface2 rounded w-2/3" />
    </div>
  </div>
);

const HorizontalScroll = ({
  title,
  items = [],
  type = 'movie',
  loading = false,
  viewAllHref = null,
}) => {
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scroll = (direction) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 350;
    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setShowLeftArrow(container.scrollLeft > 0);
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  return (
    <section className="px-6 py-8 space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        {viewAllHref && (
          <Link
            to={viewAllHref}
            className="text-sm font-semibold text-primary transition hover:text-white"
          >
            View All →
          </Link>
        )}
      </div>

      {/* Scrollable container with arrows */}
      <div className="relative group">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-primaryDark hover:bg-primary text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
          >
            <FiChevronLeft size={24} />
          </button>
        )}

        {/* Cards container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-6 overflow-x-auto hide-scrollbar snap-x snap-mandatory"
        >
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-64">
                  <SkeletonCard />
                </div>
              ))
            : items.map((item, index) => (
                <div key={index} className="flex-shrink-0 w-64">
                  <MediaCard item={item} type={type} />
                </div>
              ))}
        </div>

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-primaryDark hover:bg-primary text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
          >
            <FiChevronRight size={24} />
          </button>
        )}
      </div>
    </section>
  );
};

export default HorizontalScroll;
