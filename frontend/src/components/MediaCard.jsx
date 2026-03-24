import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiStar } from 'react-icons/fi';

const MediaCard = ({ item, type = 'movie' }) => {
  const navigate = useNavigate();

  // Determine image source based on type
  const getImage = () => {
    return (
      item.posterPath ||
      item.poster ||
      item.albumArt ||
      item.thumbnail ||
      item.coverImage ||
      item.cover ||
      item.image ||
      null
    );
  };

  // Get initials for placeholder
  const getInitials = () => {
    const title = item.title || item.name || 'Item';
    return title
      .split(' ')
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  };

  // Handle card click
  const handleCardClick = () => {
    switch (type) {
      case 'movie':
        navigate('/explore?type=movies');
        break;
      case 'book':
        navigate('/explore?type=books');
        break;
      case 'game':
        navigate('/explore?type=games');
        break;
      case 'music':
        navigate('/explore?type=music');
        break;
      default:
        break;
    }
  };

  // Get type badge properties
  const getTypeBadgeProps = () => {
    const badges = {
      movie: { bg: 'bg-blue-600', label: 'Movie' },
      book: { bg: 'bg-green-600', label: 'Book' },
      game: { bg: 'bg-orange-600', label: 'Game' },
      music: { bg: 'bg-primary', label: 'Music' },
    };
    return badges[type] || badges.movie;
  };

  const getAccentBorderClass = () => {
    const accents = {
      movie: 'border-b-2 border-blue-500',
      book: 'border-b-2 border-green-500',
      game: 'border-b-2 border-orange-500',
      music: 'border-b-2 border-purple-500',
    };
    return accents[type] || accents.movie;
  };

  const typeBadge = getTypeBadgeProps();
  const accentBorder = getAccentBorderClass();
  const image = getImage();
  const rating = item.avgRating || item.rating || item.popularity || 0;
  const year = item.year || item.releaseYear || item.releaseDate || '';

  return (
    <div
      onClick={handleCardClick}
      className={`bg-surface rounded-xl overflow-hidden hover:scale-105 transition-transform cursor-pointer group ${accentBorder}`}
      style={{
        boxShadow:
          'rgba(184, 169, 245, 0.1) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.3) 0px 4px 12px',
      }}
    >
      {/* Image container */}
      <div className="relative h-56 bg-surface2 overflow-hidden group-hover:glow-purple">
        {image ? (
          <img
            src={image}
            alt={item.title || item.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full gradient-placeholder flex items-center justify-center">
            {type === 'music' ? (
              <span className="text-5xl text-white">🎵</span>
            ) : (
              <span className="text-4xl font-bold text-white opacity-80">{getInitials()}</span>
            )}
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Rating badge */}
        {rating > 0 && (
          <div className="absolute top-3 right-3 bg-gold text-bg px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold text-sm shadow-lg">
            <FiStar size={14} fill="currentColor" />
            {rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="text-lg text-white font-semibold truncate-1 group-hover:text-primary transition">
          {item.title || item.name}
        </h3>

        {type === 'book' && item.author && <p className="text-sm text-muted truncate-1">{item.author}</p>}
        {type === 'music' && item.artist && <p className="text-sm text-muted truncate-1">{item.artist}</p>}

        {/* Year and Type badge */}
        <div className="flex items-center gap-2 text-xs text-muted">
          {year && <span>{year}</span>}
          <span className={`${typeBadge.bg} text-white px-2 py-0.5 rounded-full font-medium`}>
            {typeBadge.label}
          </span>
          {type === 'game' && item.platform && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: item.platform === 'pc' ? '#2563EB' : '#16A34A' }}
            >
              {item.platform === 'pc' ? '🖥️ PC' : '📱 Mobile'}
            </span>
          )}
        </div>

        {/* Additional info based on type */}
        <div className="text-xs text-muted truncate-1">
          {type === 'game' && item.genres?.length > 0 && <span>{item.genres.join(', ')}</span>}
        </div>
      </div>
    </div>
  );
};

export default MediaCard;
