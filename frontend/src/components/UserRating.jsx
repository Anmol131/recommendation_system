import { useEffect, useMemo, useState } from 'react';
import { FaStar } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import * as endpoints from '../api/endpoints';

function UserRating({ itemId, itemType }) {
  const { isAuthenticated } = useAuth();
  const [currentRating, setCurrentRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [showLoginTip, setShowLoginTip] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    const loadRating = async () => {
      if (!isAuthenticated || !itemId) {
        setCurrentRating(0);
        return;
      }

      try {
        const response = await endpoints.getHistory();
        const historyItems = Array.isArray(response.data) ? response.data : [];
        const matchedRatings = historyItems.filter(
          (item) =>
            item.type === itemType &&
            String(item.itemId) === String(itemId) &&
            item.action === 'rated' &&
            Number(item.rating) > 0
        );

        if (matchedRatings.length === 0) {
          setCurrentRating(0);
          return;
        }

        matchedRatings.sort((a, b) => new Date(b.date) - new Date(a.date));
        setCurrentRating(Number(matchedRatings[0].rating));
      } catch {
        setCurrentRating(0);
      }
    };

    loadRating();
  }, [isAuthenticated, itemId, itemType]);

  const displayRating = useMemo(() => hoveredRating || currentRating, [hoveredRating, currentRating]);

  const handleRate = async (rating) => {
    if (!isAuthenticated) {
      setShowLoginTip(true);
      setTimeout(() => setShowLoginTip(false), 2000);
      return;
    }

    try {
      await endpoints.addHistory(itemType, itemId, 'rated', rating);
      setCurrentRating(rating);
      setSavedMessage('Rating saved!');
      setTimeout(() => setSavedMessage(''), 2000);
    } catch {
      setSavedMessage('Could not save rating');
      setTimeout(() => setSavedMessage(''), 2000);
    }
  };

  return (
    <div className="relative inline-flex items-center gap-2 rounded-lg border border-primary/50 bg-surface2 px-4 py-2">
      <div className="inline-flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => {
          const ratingValue = index + 1;
          const active = ratingValue <= displayRating;
          return (
            <button
              key={ratingValue}
              type="button"
              onClick={() => handleRate(ratingValue)}
              onMouseEnter={() => setHoveredRating(ratingValue)}
              onMouseLeave={() => setHoveredRating(0)}
              className="text-base"
              aria-label={`Rate ${ratingValue} star${ratingValue > 1 ? 's' : ''}`}
            >
              <FaStar color={active ? '#F5A623' : '#6B7280'} />
            </button>
          );
        })}
      </div>
      {showLoginTip && <span className="text-xs text-amber-300">Login to rate</span>}
      {savedMessage && <span className="text-xs text-emerald-300">{savedMessage}</span>}
    </div>
  );
}

export default UserRating;