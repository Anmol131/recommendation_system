import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import SiteFooter from './components/SiteFooter';
import { useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import ProfilePage from './pages/ProfilePage';
import PreferencesPage from './pages/PreferencesPage';
import ExplorePage from './pages/ExplorePage';
import AboutPage from './pages/AboutPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import RecommendationPage from './pages/RecommendationPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminContentListPage from './pages/admin/AdminContentListPage';
import AdminContentFormPage from './pages/admin/AdminContentFormPage';
import AdminSearchLogsPage from './pages/admin/AdminSearchLogsPage';
import AdminProtectedRoute from './components/admin/AdminProtectedRoute';

function ScrollToTopOnRouteChange() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.search, location.hash]);

  return null;
}

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
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text transition-colors duration-300">
      <ScrollToTopOnRouteChange />
      <Navbar />
      <main className="pt-0">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<Navigate to="/explore" replace />} />
          <Route path="/movies" element={<Navigate to="/explore?type=movies" replace />} />
          <Route path="/movies/:id" element={<Navigate to="/explore?type=movies" replace />} />
          <Route path="/books" element={<Navigate to="/explore?type=books" replace />} />
          <Route path="/books/:isbn" element={<Navigate to="/explore?type=books" replace />} />
          <Route path="/games" element={<Navigate to="/explore?type=games" replace />} />
          <Route path="/games/:id" element={<Navigate to="/explore?type=games" replace />} />
          <Route path="/music" element={<Navigate to="/explore?type=music" replace />} />
          <Route path="/music/:trackId" element={<Navigate to="/explore?type=music" replace />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/termsofservice" element={<TermsOfServicePage />} />
          <Route path="/terms" element={<Navigate to="/termsofservice" replace />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/admin" element={<Navigate to="/admin/login" replace />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/recommend" element={<RecommendationPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin/dashboard"
            element={(
              <AdminProtectedRoute>
                <AdminDashboardPage />
              </AdminProtectedRoute>
            )}
          />
          <Route
            path="/admin/content"
            element={(
              <AdminProtectedRoute>
                <AdminContentListPage />
              </AdminProtectedRoute>
            )}
          />
          <Route
            path="/admin/content/add"
            element={(
              <AdminProtectedRoute>
                <AdminContentFormPage />
              </AdminProtectedRoute>
            )}
          />
          <Route
            path="/admin/content/edit/:id"
            element={(
              <AdminProtectedRoute>
                <AdminContentFormPage />
              </AdminProtectedRoute>
            )}
          />
          <Route
            path="/admin/search-logs"
            element={(
              <AdminProtectedRoute>
                <AdminSearchLogsPage />
              </AdminProtectedRoute>
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
      <SiteFooter />
    </div>
  );
}

export default App;
