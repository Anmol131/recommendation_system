import { useEffect, useState } from 'react';
import { FaSpotify, FaYoutube } from 'react-icons/fa';
import { FiExternalLink, FiLoader, FiMusic } from 'react-icons/fi';
import { useParams } from 'react-router-dom';
import HorizontalScroll from '../components/HorizontalScroll';
import ShareButton from '../components/ShareButton';
import UserRating from '../components/UserRating';
import * as endpoints from '../api/endpoints';

function getInitials(value) {
  return (value || 'Track')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function formatDuration(durationSec) {
  const seconds = Number(durationSec || 0);
  const mins = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function MusicDetailPage() {
  const { trackId } = useParams();
  const [track, setTrack] = useState(null);
  const [moreTracks, setMoreTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(true);

  useEffect(() => {
    const loadTrack = async () => {
      setLoading(true);
      console.log('Fetching trackId:', trackId);
      try {
        const response = await endpoints.getMusicByTrackId(trackId);
        if (response.data) {
          setTrack(response.data);
          return;
        }

        const fallbackResponse = await endpoints.searchMusic(trackId);
        const fallbackMatch = (fallbackResponse.data || []).find(
          (item) =>
            String(item.trackId) === String(trackId) ||
            String(item._id) === String(trackId) ||
            String(item.lastfmId) === String(trackId)
        );
        setTrack(fallbackMatch || null);
      } catch {
        try {
          const fallbackResponse = await endpoints.searchMusic(trackId);
          const fallbackMatch = (fallbackResponse.data || []).find(
            (item) =>
              String(item.trackId) === String(trackId) ||
              String(item._id) === String(trackId) ||
              String(item.lastfmId) === String(trackId)
          );
          setTrack(fallbackMatch || null);
        } catch {
          setTrack(null);
        }
      } finally {
        setLoading(false);
      }
    };

    loadTrack();
  }, [trackId]);

  useEffect(() => {
    const loadMore = async () => {
      const artistName = track?.artist || track?.artistName;
      if (!artistName) {
        setMoreTracks([]);
        setMoreLoading(false);
        return;
      }

      setMoreLoading(true);
      try {
        const response = await endpoints.searchMusic(artistName);
        const currentTrackId = track?._id || track?.trackId || track?.lastfmId;
        const filtered = (response.data || []).filter((item) => {
          const itemId = item._id || item.trackId || item.lastfmId;
          return String(itemId) !== String(currentTrackId);
        });
        setMoreTracks(filtered.slice(0, 8));
      } catch {
        setMoreTracks([]);
      } finally {
        setMoreLoading(false);
      }
    };

    loadMore();
  }, [track]);

  if (loading) {
    return (
      <div className="px-6 py-24 text-center text-muted">
        <div className="inline-flex items-center gap-3 rounded-xl bg-surface px-5 py-3">
          <FiLoader className="animate-spin" />
          Loading track details...
        </div>
      </div>
    );
  }

  if (!track) {
    return <div className="px-6 py-24 text-center text-muted">Track not found.</div>;
  }

  const title = track?.title || track?.name || 'Unknown Title';
  const artist = track?.artist || track?.artistName || 'Unknown artist';
  const album = track?.album || track?.albumName || 'Unknown album';
  const albumArt = track?.albumArt || track?.image || track?.cover || null;
  const duration = track?.duration || track?.durationSec || track?.durationMs || null;
  const trackIdentity = track?._id || track?.trackId || track?.lastfmId;
  const rawPopularity = Number(track?.popularity || 0);
  const popularityPercent = Math.min(Math.round((rawPopularity / 2000000) * 100), 100);
  const popularityLabel = rawPopularity > 1000
    ? `${(rawPopularity / 1000).toFixed(0)}K listeners`
    : `${rawPopularity} listeners`;

  const youtubeMusicVideoUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${artist} official music video`.trim()).replace(/%20/g, '+')}`;
  const youtubeLyricsUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${artist} lyrics`.trim()).replace(/%20/g, '+')}`;
  const spotifyUrl = track.spotifyUrl || `https://open.spotify.com/search/${encodeURIComponent(`${title} ${artist}`.trim()).replace(/%20/g, '+')}`;

  return (
    <div className="px-6 py-8 sm:px-8 lg:px-10">
      <section className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          {albumArt ? (
            <img
              src={albumArt}
              alt={title}
              className="aspect-square w-full rounded-xl border border-surface2 object-cover shadow-[0_0_35px_rgba(184,169,245,0.35)]"
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-gradient-to-br from-primaryDark to-primary text-6xl font-bold text-bg shadow-[0_0_35px_rgba(184,169,245,0.35)]">
              <div className="flex flex-col items-center gap-3">
                <FiMusic size={60} />
                <span className="text-xl">{getInitials(title)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          <h1 className="text-4xl font-bold text-white">{title}</h1>
          <p className="mt-2 text-lg text-muted">{artist}</p>
          <p className="mt-1 text-sm text-muted">💿 Album: {album}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            {track.genre && (
              <span className="rounded-full bg-surface2 px-3 py-1 text-muted">{track.genre}</span>
            )}
            {track.explicit && (
              <span className="rounded bg-red-600 px-2 py-1 text-xs font-bold text-white">E</span>
            )}
          </div>

          <div className="mt-6 max-w-xl">
            <div className="mb-2 flex items-center justify-between text-sm text-muted">
              <span>Popularity</span>
              <span>{popularityLabel}</span>
            </div>
            <div className="h-3 w-full rounded-full bg-surface2">
              <div
                className="h-3 rounded-full bg-primary"
                style={{ width: `${popularityPercent}%` }}
              />
            </div>
          </div>

          <p className="mt-5 text-sm text-muted">Duration: {duration ? formatDuration(duration) : 'N/A'}</p>

          {track.previewUrl && (
            <div className="mt-5 max-w-xl rounded-xl border border-surface2 bg-surface2 p-3">
              <p className="mb-2 text-sm font-semibold text-white">▶ Preview</p>
              <audio controls className="w-full">
                <source src={track.previewUrl} type="audio/mpeg" />
                Your browser does not support the audio player.
              </audio>
            </div>
          )}

          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">Actions</h2>
            <div className="flex flex-wrap gap-2">
              <a
                href={youtubeMusicVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[#FF0000] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
              >
                <FaYoutube />
                Music Video
              </a>
              <a
                href={youtubeLyricsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-[#FF3C3C] bg-[#B31217] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
              >
                <FaYoutube />
                Lyrics Video
              </a>
              <a
                href={spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[#1DB954] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
              >
                <FaSpotify />
                Open Spotify
              </a>
              {track.lastfmUrl && (
                <a
                  href={track.lastfmUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#d51007] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
                >
                  Last.fm
                  <FiExternalLink size={14} />
                </a>
              )}
              <ShareButton />
              <UserRating itemType="music" itemId={trackIdentity} />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <HorizontalScroll
          title="More from this artist"
          items={moreTracks}
          type="music"
          loading={moreLoading}
        />
      </section>
    </div>
  );
}

export default MusicDetailPage;