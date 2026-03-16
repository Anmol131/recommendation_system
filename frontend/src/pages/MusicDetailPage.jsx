import { useEffect, useState } from 'react';
import { FiExternalLink, FiLoader, FiMusic } from 'react-icons/fi';
import { useParams } from 'react-router-dom';
import HorizontalScroll from '../components/HorizontalScroll';
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
          (item) => String(item.trackId) === String(trackId)
        );
        setTrack(fallbackMatch || null);
      } catch (error) {
        try {
          const fallbackResponse = await endpoints.searchMusic(trackId);
          const fallbackMatch = (fallbackResponse.data || []).find(
            (item) => String(item.trackId) === String(trackId)
          );
          setTrack(fallbackMatch || null);
        } catch (fallbackError) {
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
      if (!track?.artist) {
        setMoreTracks([]);
        setMoreLoading(false);
        return;
      }

      setMoreLoading(true);
      try {
        const response = await endpoints.searchMusic(track.artist);
        const filtered = (response.data || []).filter((item) => item.trackId !== track.trackId);
        setMoreTracks(filtered.slice(0, 8));
      } catch (error) {
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

  return (
    <div className="px-6 py-8 sm:px-8 lg:px-10">
      <section className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          {track.cover ? (
            <img
              src={track.cover}
              alt={track.title}
              className="aspect-square w-full rounded-xl border border-surface2 object-cover shadow-[0_0_35px_rgba(184,169,245,0.35)]"
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-gradient-to-br from-primaryDark to-primary text-6xl font-bold text-bg shadow-[0_0_35px_rgba(184,169,245,0.35)]">
              <div className="flex flex-col items-center gap-3">
                <FiMusic size={60} />
                <span className="text-xl">{getInitials(track.title)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          <h1 className="text-4xl font-bold text-white">{track.title}</h1>
          <p className="mt-2 text-lg text-muted">{track.artist || 'Unknown artist'}</p>
          <p className="mt-1 text-sm text-muted">💿 Album: {track.album || 'Unknown album'}</p>

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
              <span>{track.popularity || 0}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-surface2">
              <div
                className="h-3 rounded-full bg-primary"
                style={{ width: `${Math.min(Number(track.popularity || 0), 100)}%` }}
              />
            </div>
          </div>

          <p className="mt-5 text-sm text-muted">Duration: {formatDuration(track.durationSec)}</p>

          {track.previewUrl && (
            <div className="mt-5 max-w-xl rounded-xl border border-surface2 bg-surface2 p-3">
              <p className="mb-2 text-sm font-semibold text-white">▶ Preview</p>
              <audio controls className="w-full">
                <source src={track.previewUrl} type="audio/mpeg" />
                Your browser does not support the audio player.
              </audio>
            </div>
          )}

          {track.spotifyUrl && (
            <div className="mt-6">
              <a
                href={track.spotifyUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1DB954] px-4 py-3 font-semibold text-white transition hover:opacity-90"
              >
                Open in Spotify
                <FiExternalLink />
              </a>
            </div>
          )}

          {!track.previewUrl && !track.spotifyUrl && (
            <div className="mt-6">
              <a
                href={`https://open.spotify.com/track/${track.trackId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-surface2 px-4 py-3 font-semibold text-primary transition hover:text-white"
              >
                Full track on Spotify
                <FiExternalLink />
              </a>
            </div>
          )}
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