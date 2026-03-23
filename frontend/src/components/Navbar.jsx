import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiLogOut, FiSettings, FiUser } from 'react-icons/fi';
import { Moon, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AvatarDisplay } from '../constants/avatars';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (location.pathname !== '/about') {
      if (location.pathname === '/') {
        setActiveSection('home');
      } else if (location.pathname === '/explore') {
        setActiveSection('explore');
      }
      return;
    }

    const handleScroll = () => {
      const contactSection = document.getElementById('contact');
      if (!contactSection) return;

      const contactTop = contactSection.getBoundingClientRect().top;
      if (contactTop <= 120) {
        setActiveSection('contact');
      } else {
        setActiveSection('about');
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Check hash on load
    if (location.hash === '#contact') {
      setActiveSection('contact');
    } else {
      setActiveSection('about');
    }

    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [location]);

  const handleLogout = () => {
    setIsMenuOpen(false);
    logout();
    navigate('/login');
  };

  const avatarId = user?.avatar || 'avatar-1';

  const activeLinkClass = 'text-purple-700 font-semibold border-b-2 border-purple-500 pb-1';
  const inactiveLinkClass = 'text-[#3e2548]/70 hover:text-purple-600 transition-colors';

  return (
    <nav className="sticky top-0 z-50 h-20 bg-white/60 backdrop-blur-md shadow-[0_20px_40px_-10px_rgba(62,37,72,0.08)]">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-8">
        <Link to="/" className="text-2xl font-bold tracking-tighter text-purple-900">Vibeify</Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link
            to="/"
            className={location.pathname === '/' ? activeLinkClass : inactiveLinkClass}
          >
            Home
          </Link>

          <Link
            to="/explore"
            className={location.pathname === '/explore' ? activeLinkClass : inactiveLinkClass}
          >
            Explore
          </Link>

          <Link
            to="/about"
            onClick={() => {
              setActiveSection('about');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={location.pathname === '/about' && activeSection === 'about' ? activeLinkClass : inactiveLinkClass}
          >
            About
          </Link>

          <Link
            to="/about#contact"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('contact');
              if (location.pathname === '/about') {
                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
              } else {
                navigate('/about');
                setTimeout(() => {
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                }, 300);
              }
            }}
            className={location.pathname === '/about' && activeSection === 'contact' ? activeLinkClass : inactiveLinkClass}
          >
            Contact
          </Link>
        </div>

        <div className="relative flex items-center gap-3" ref={menuRef}>
          <button
            type="button"
            onClick={() => navigate('/explore')}
            className="rounded-lg p-2 text-[#3e2548]/75 transition-colors hover:bg-white/70 hover:text-purple-700"
            aria-label="Explore search"
          >
            <Search size={18} />
          </button>
          <button
            type="button"
            onClick={() => setIsDarkMode((current) => !current)}
            className="rounded-lg p-2 text-[#3e2548]/75 transition-colors hover:bg-white/70 hover:text-purple-700"
            aria-label="Toggle dark mode"
          >
            <Moon size={18} />
          </button>

          {isAuthenticated ? (
            <>
              <button
                type="button"
                onClick={() => setIsMenuOpen((current) => !current)}
                className="rounded-2xl border border-white/40 bg-white/50 p-1 transition hover:border-purple-300"
                aria-label="Open profile menu"
              >
                <AvatarDisplay avatarId={avatarId} size={34} className="rounded-xl" />
              </button>

              {isMenuOpen ? (
                <div className="absolute right-0 top-14 z-50 min-w-[210px] rounded-2xl border border-outline-variant/20 bg-white p-3 shadow-xl">
                  <div className="flex items-center gap-3 px-2 pb-2">
                    <AvatarDisplay avatarId={avatarId} size={42} className="rounded-xl" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#3e2548]">{user?.name || 'User'}</p>
                      <p className="truncate text-xs text-[#3e2548]/60">{user?.email || 'No email'}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate('/profile');
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm text-[#3e2548]/85 transition hover:bg-surface-container-low"
                  >
                    <FiUser size={16} />
                    Profile
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate('/preferences');
                    }}
                    className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm text-[#3e2548]/85 transition hover:bg-surface-container-low"
                  >
                    <FiSettings size={16} />
                    Preferences
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm text-red-500 transition hover:bg-red-50"
                  >
                    <FiLogOut size={16} />
                    Logout
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="rounded-lg px-4 py-2 text-sm font-medium text-purple-700 transition-opacity hover:opacity-80"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="rounded-lg bg-gradient-to-br from-primary to-primary-container px-4 py-2 text-sm font-semibold text-on-primary transition-all active:scale-95"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
