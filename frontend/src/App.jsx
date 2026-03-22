import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import { useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import BrowsePage from './pages/BrowsePage';
import SearchPage from './pages/SearchPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import PreferencesPage from './pages/PreferencesPage';
import MovieDetailPage from './pages/MovieDetailPage';
import BooksPage from './pages/BooksPage';
import BookDetailPage from './pages/BookDetailPage';
import GameDetailPage from './pages/GameDetailPage';
import GamesPage from './pages/GamesPage';
import MusicPage from './pages/MusicPage';
import MusicDetailPage from './pages/MusicDetailPage';
import ExplorePage from './pages/ExplorePage';
import AboutPage from './pages/AboutPage';
import ChangePasswordPage from './pages/ChangePasswordPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="px-6 py-24 text-center text-muted">Loading profile...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-bg text-white">
      {location.pathname !== '/' ? <Navbar /> : null}
      <main className="pt-2">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/movies" element={<MovieDetailPage />} />
          <Route path="/movies/:id" element={<MovieDetailPage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/books/:isbn" element={<BookDetailPage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/games/:gameId" element={<GameDetailPage />} />
          <Route path="/music" element={<MusicPage />} />
          <Route path="/music/:trackId" element={<MusicDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/explore"
            element={(
              <ProtectedRoute>
                <ExplorePage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/profile"
            element={(
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/preferences"
            element={(
              <ProtectedRoute>
                <PreferencesPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/change-password"
            element={(
              <ProtectedRoute>
                <ChangePasswordPage />
              </ProtectedRoute>
            )}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
