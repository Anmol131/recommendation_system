import { useEffect, useMemo, useState } from 'react';
import { FiExternalLink, FiStar } from 'react-icons/fi';
import { useParams } from 'react-router-dom';
import HorizontalScroll from '../components/HorizontalScroll';
import * as endpoints from '../api/endpoints';

const TMDB_GENRES = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

function getInitials(value) {
  return (value || 'Movie')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function normalizeGenres(genres) {
  const mapTokenToGenre = (token) => {
    const cleaned = String(token).trim();
    if (!cleaned) {
      return null;
    }

    if (/^\d+$/.test(cleaned)) {
      return TMDB_GENRES[Number(cleaned)] || null;
    }

    return cleaned;
  };

  if (Array.isArray(genres)) {
    return genres
      .flatMap((genre) => String(genre).split(/[|,]/))
      .map(mapTokenToGenre)
      .filter(Boolean);
  }

  if (typeof genres === 'string') {
    return genres
      .split(/[|,]/)
      .map(mapTokenToGenre)
      .filter(Boolean);
  }

  return [];
}

function StarRating({ ratingOutOf10 }) {
  const stars = Math.round((Number(ratingOutOf10 || 0) / 10) * 5);
  return (
    <div className="inline-flex items-center gap-1 text-gold">
      {Array.from({ length: 5 }).map((_, index) => (
        <FiStar key={index} fill={index < stars ? 'currentColor' : 'none'} />
      ))}
    </div>
  );
}

function MovieDetailPage() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [similarLoading, setSimilarLoading] = useState(true);
  const genrePills = normalizeGenres(movie?.genres);

  useEffect(() => {
    const loadMovie = async () => {
      setLoading(true);
      try {
        const response = await endpoints.getMovieById(id);
        setMovie(response.data || null);
      } catch (error) {
        setMovie(null);
      } finally {
        setLoading(false);
      }
    };

    loadMovie();
  }, [id]);

  useEffect(() => {
    const loadSimilar = async () => {
      if (!movie) {
        setSimilarMovies([]);
        setSimilarLoading(false);
        return;
      }

      setSimilarLoading(true);
      try {
        const primaryGenre = normalizeGenres(movie.genres)[0] || '';
        const response = await endpoints.getMovies({
          limit: 8,
          genre: primaryGenre,
          sortBy: 'rating',
        });

        const filtered = (response.data.items || []).filter(
          (item) => String(item.movieId) !== String(movie.movieId)
        );
        setSimilarMovies(filtered.slice(0, 8));
      } catch (error) {
        setSimilarMovies([]);
      } finally {
        setSimilarLoading(false);
      }
    };

    loadSimilar();
  }, [movie]);

  const castText = useMemo(() => {
    if (!movie?.cast || movie.cast.length === 0) {
      return 'Not available';
    }
    return movie.cast.join(', ');
  }, [movie?.cast]);

  if (loading) {
    return <div className="px-6 py-24 text-center text-muted">Loading movie details...</div>;
  }

  if (!movie) {
    return <div className="px-6 py-24 text-center text-muted">Movie not found.</div>;
  }

  return (
    <div className="px-6 py-8 sm:px-8 lg:px-10">
      <section className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          {movie.poster ? (
            <img
              src={movie.poster}
              alt={movie.title}
              className="h-full w-full rounded-xl border border-surface2 object-cover"
            />
          ) : (
            <div className="flex min-h-[420px] w-full items-center justify-center rounded-xl bg-gradient-to-br from-primaryDark to-primary text-6xl font-bold text-bg">
              {getInitials(movie.title)}
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          <h1 className="text-4xl font-bold text-white">{movie.title}</h1>

          {movie.year && (
            <div className="mt-3 inline-flex rounded-xl bg-primary/20 px-4 py-2 text-lg font-semibold text-primary">
              {movie.year}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            {genrePills.map((genre) => (
              <span key={genre} className="rounded-full bg-primary/25 px-3 py-1 text-primary">
                {genre}
              </span>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-3 text-gold">
            <StarRating ratingOutOf10={movie.avgRating} />
            <span className="font-semibold text-white">{Number(movie.avgRating || 0).toFixed(1)}</span>
            <span className="text-muted">({movie.ratingCount || 0} ratings)</span>
          </div>

          <p className="mt-6 text-base leading-relaxed text-muted">{movie.description || 'No description available.'}</p>

          <p className="mt-6 text-sm text-white">
            <span className="font-semibold">Starring:</span> {castText}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {movie.trailer && (
              <a
                href={movie.trailer}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-bg transition hover:bg-primaryDark"
              >
                ▶ Watch Trailer
                <FiExternalLink />
              </a>
            )}
            {movie.tmdbId && (
              <a
                href={`https://www.themoviedb.org/movie/${movie.tmdbId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-surface2 px-3 py-2 text-xs font-semibold text-muted hover:text-white"
              >
                TMDB
                <FiExternalLink size={14} />
              </a>
            )}
            {movie.imdbId && (
              <a
                href={`https://www.imdb.com/title/${movie.imdbId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-surface2 px-3 py-2 text-xs font-semibold text-muted hover:text-white"
              >
                IMDb
                <FiExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <HorizontalScroll
          title="Similar Movies"
          items={similarMovies}
          type="movie"
          loading={similarLoading}
        />
      </section>
    </div>
  );
}

export default MovieDetailPage;