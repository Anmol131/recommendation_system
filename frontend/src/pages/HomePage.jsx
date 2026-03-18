import { useEffect, useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import HorizontalScroll from '../components/HorizontalScroll';
import * as endpoints from '../api/endpoints';

const initialLoading = {
  movies: true,
  books: true,
  games: true,
  music: true,
};

function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [books, setBooks] = useState([]);
  const [games, setGames] = useState([]);
  const [music, setMusic] = useState([]);
  const [loading, setLoading] = useState(initialLoading);

  useEffect(() => {
    const loadSections = async () => {
      const requests = [
        endpoints.getMovies({ limit: 20, sort: 'rating' }),
        endpoints.getBooks({ limit: 20, sort: 'rating' }),
        endpoints.getGames({ limit: 20, sort: 'totalReviews' }),
        endpoints.getMusic({ limit: 20, sort: 'popularity' }),
      ];

      const [moviesResponse, booksResponse, gamesResponse, musicResponse] = await Promise.allSettled(requests);

      if (moviesResponse.status === 'fulfilled') {
        setMovies(moviesResponse.value.data.items || []);
      }
      if (booksResponse.status === 'fulfilled') {
        setBooks(booksResponse.value.data.items || []);
      }
      if (gamesResponse.status === 'fulfilled') {
        setGames(gamesResponse.value.data.items || []);
      }
      if (musicResponse.status === 'fulfilled') {
        setMusic(musicResponse.value.data.items || []);
      }

      setLoading({ movies: false, books: false, games: false, music: false });
    };

    loadSections();
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return;
    }
    navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
  };

  return (
    <div className="pb-12">
      <section className="bg-gradient-to-b from-surface to-bg px-6 py-16 sm:px-10 lg:px-14">
        <div className="mx-auto max-w-5xl text-center">
          <span className="inline-flex rounded-full border border-primary/30 bg-surface2 px-4 py-1 text-sm text-muted">
            Personalized discovery across every format
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-primary sm:text-6xl">
            Discover Your Next Favorite
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted sm:text-lg">
            Movies, Books, Games & Music — all in one place
          </p>
          <form onSubmit={handleSearch} className="mx-auto mt-10 flex max-w-3xl gap-3 rounded-2xl border border-surface2 bg-surface p-3 shadow-2xl shadow-black/20">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search titles, authors, artists, and more"
              className="h-14 flex-1 rounded-xl bg-surface2 px-5 text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="inline-flex h-14 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primaryDark px-6 font-semibold text-bg transition hover:opacity-90"
            >
              <FiSearch size={18} />
              Search
            </button>
          </form>
        </div>
      </section>

      <HorizontalScroll
        title="🎬 Trending Movies"
        items={movies}
        type="movie"
        loading={loading.movies}
        viewAllHref="/browse?type=movies"
      />
      <HorizontalScroll
        title="📚 Popular Books"
        items={books}
        type="book"
        loading={loading.books}
        viewAllHref="/browse?type=books"
      />
      <HorizontalScroll
        title="🎮 Top Games"
        items={games}
        type="game"
        loading={loading.games}
        viewAllHref="/browse?type=games"
      />
      <HorizontalScroll
        title="🎵 Hot Music"
        items={music}
        type="music"
        loading={loading.music}
        viewAllHref="/browse?type=music"
      />
    </div>
  );
}

export default HomePage;