import { useEffect, useMemo, useState } from 'react';
import { FaApple, FaGooglePlay, FaLinux, FaMobileAlt, FaSteam, FaWindows, FaYoutube } from 'react-icons/fa';
import { FiMonitor, FiStar } from 'react-icons/fi';
import { useParams } from 'react-router-dom';
import HorizontalScroll from '../components/HorizontalScroll';
import ShareButton from '../components/ShareButton';
import UserRating from '../components/UserRating';
import * as endpoints from '../api/endpoints';

function getInitials(value) {
  return (value || 'Game')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function GameDetailPage() {
  const { gameId } = useParams();
  const [game, setGame] = useState(null);
  const [similarGames, setSimilarGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [similarLoading, setSimilarLoading] = useState(true);
  const youtubeTrailerUrl = useMemo(() => {
    const query = `${game?.title || ''} official trailer gameplay`.trim();
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query).replace(/%20/g, '+')}`;
  }, [game?.title]);

  const steamUrl = useMemo(() => {
    if (!game || game.platform !== 'pc') {
      return '';
    }
    return `https://store.steampowered.com/app/${game.gameId}`;
  }, [game]);

  const googlePlayUrl = useMemo(() => {
    if (!game || game.platform !== 'mobile') {
      return '';
    }
    const query = `${game.title || ''}`.trim();
    return `https://play.google.com/store/search?q=${encodeURIComponent(query).replace(/%20/g, '+')}&c=apps`;
  }, [game]);

  useEffect(() => {
    const loadGame = async () => {
      setLoading(true);
      try {
        const response = await endpoints.getGameById(gameId);
        setGame(response.data || null);
      } catch {
        setGame(null);
      } finally {
        setLoading(false);
      }
    };

    loadGame();
  }, [gameId]);

  useEffect(() => {
    const loadSimilar = async () => {
      if (!game) {
        setSimilarGames([]);
        setSimilarLoading(false);
        return;
      }

      setSimilarLoading(true);
      try {
        const response = await endpoints.getGames({
          limit: 8,
          platform: game.platform,
          genre: game.genres?.[0] || '',
          sort: 'rating',
        });

        const filtered = (response.data.items || []).filter((item) => item.gameId !== game.gameId);
        setSimilarGames(filtered.slice(0, 8));
      } catch {
        setSimilarGames([]);
      } finally {
        setSimilarLoading(false);
      }
    };

    loadSimilar();
  }, [game]);

  const compatibility = useMemo(() => {
    const raw = (game?.pcPlatform || '').toLowerCase();
    return {
      windows: raw.includes('windows') || raw.includes('win'),
      mac: raw.includes('mac'),
      linux: raw.includes('linux'),
    };
  }, [game?.pcPlatform]);

  const ratingUi = useMemo(() => {
    if (!game) {
      return null;
    }
    if (game.platform === 'pc') {
      const percent = Math.min(Math.round((game.rating || 0) * 20), 100);
      return (
        <div className="w-full max-w-sm">
          <div className="mb-1 flex items-center justify-between text-sm text-muted">
            <span>Approval</span>
            <span>{percent}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-surface2">
            <div className="h-3 rounded-full bg-primary" style={{ width: `${percent}%` }} />
          </div>
        </div>
      );
    }
    return (
      <span className="inline-flex items-center gap-2 text-white">
        <FiStar className="text-gold" fill="currentColor" />
        {Number(game.rating || 0).toFixed(1)} stars
      </span>
    );
  }, [game]);

  if (loading) {
    return <div className="px-6 py-24 text-center text-muted">Loading game details...</div>;
  }

  if (!game) {
    return <div className="px-6 py-24 text-center text-muted">Game not found.</div>;
  }

  return (
    <div className="px-6 py-8 sm:px-8 lg:px-10">
      <section className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          {game.image ? (
            <img
              src={game.image}
              alt={game.title}
              className="h-full w-full rounded-xl border border-surface2 object-cover"
            />
          ) : (
            <div className="flex min-h-[420px] w-full items-center justify-center rounded-xl bg-gradient-to-br from-primaryDark to-primary text-6xl font-bold text-bg">
              {getInitials(game.title)}
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          <h1 className="text-4xl font-bold text-white">{game.title}</h1>
          <p className="mt-2 text-lg text-muted">{game.developer || 'Unknown developer'}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-primary">
              {game.platform === 'pc' ? <FiMonitor /> : <FaMobileAlt />}
              {game.platform === 'pc' ? 'PC' : 'Mobile'}
            </span>
            {game.releaseYear && (
              <span className="rounded-full bg-primary/20 px-3 py-1 font-semibold text-primary">{game.releaseYear}</span>
            )}
            {game.source && (
              <span className="rounded-full bg-surface2 px-3 py-1 text-muted uppercase">{game.source}</span>
            )}
            {(game.genres || []).map((genre) => (
              <span key={genre} className="rounded-full bg-surface2 px-3 py-1 text-muted">
                {genre}
              </span>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3">
            {ratingUi}
            <span className="text-muted">{game.totalReviews || 0} reviews</span>
            {game.platform === 'mobile' && game.installs && (
              <span className="text-sm text-muted">{game.installs} installs</span>
            )}
            {game.platform === 'pc' && game.recommendations !== undefined && (
              <span className="text-sm text-muted">{game.recommendations} recommendations</span>
            )}
          </div>

          <p className="mt-6 text-base leading-relaxed text-muted">{game.description || 'No description available.'}</p>

          {game.platform === 'pc' && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold text-white">PC Compatibility</p>
              <div className="flex items-center gap-3 text-muted">
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm ${compatibility.windows ? 'bg-primary/20 text-primary' : 'bg-surface2'}`}>
                  <FaWindows /> Windows
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm ${compatibility.mac ? 'bg-primary/20 text-primary' : 'bg-surface2'}`}>
                  <FaApple /> Mac
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm ${compatibility.linux ? 'bg-primary/20 text-primary' : 'bg-surface2'}`}>
                  <FaLinux /> Linux
                </span>
              </div>
            </div>
          )}

          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">Actions</h2>
            <div className="flex flex-wrap gap-2">
              <a
                href={youtubeTrailerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[#FF0000] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
              >
                <FaYoutube />
                Watch on YouTube
              </a>
              {game.platform === 'pc' && (
                <a
                  href={steamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1b2838] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
                >
                  <FaSteam />
                  View on Steam
                </a>
              )}
              {game.platform === 'mobile' && (
                <a
                  href={googlePlayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1FA463] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
                >
                  <FaGooglePlay />
                  Google Play
                </a>
              )}
              <ShareButton />
              <UserRating itemType="game" itemId={game.gameId} />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <HorizontalScroll
          title="Similar Games"
          items={similarGames}
          type="game"
          loading={similarLoading}
        />
      </section>
    </div>
  );
}

export default GameDetailPage;