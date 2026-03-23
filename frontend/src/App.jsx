import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import { useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
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
import MoviesPage from './pages/MoviesPage';

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="px-6 py-24 text-center text-muted">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <div className="min-h-screen bg-bg text-white">
      <Navbar />
      <main className="pt-2">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/browse" element={<Navigate to="/explore" replace />} />
          <Route path="/search" element={<Navigate to="/explore" replace />} />
          <Route path="/movies" element={<MoviesPage />} />
          <Route path="/movies/:id" element={<MovieDetailPage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/books/:isbn" element={<BookDetailPage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/games/:id" element={<GameDetailPage />} />
          <Route path="/music" element={<MusicPage />} />
          <Route path="/music/:trackId" element={<MusicDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/explore" element={<ExplorePage />} />
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
