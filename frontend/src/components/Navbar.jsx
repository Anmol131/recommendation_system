import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiLogOut, FiSettings, FiUser } from 'react-icons/fi';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AvatarDisplay } from '../constants/avatars';

const Navbar = () => {
  const CONTACT_SCROLL_OFFSET = 112;
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    if (location.pathname !== '/about') {
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
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [location]);

  const handleLogout = () => {
    setIsMenuOpen(false);
    logout();
    navigate('/login');
  };

  const scrollToContactSection = (behavior = 'smooth') => {
    const contactSection = document.getElementById('contact');
    if (!contactSection) return;

    const top = contactSection.getBoundingClientRect().top + window.scrollY - CONTACT_SCROLL_OFFSET;
    window.scrollTo({ top: Math.max(top, 0), behavior });
  };

  useEffect(() => {
    if (location.pathname === '/about' && location.hash === '#contact') {
      window.requestAnimationFrame(() => {
        scrollToContactSection('smooth');
      });
    }
  }, [location.pathname, location.hash]);

  const avatarId = user?.avatar || 'avatar-1';
  const brandLogoSrc = location.pathname === '/' && isDarkMode ? '/logo1.png' : '/logo2.png';

  const currentSection =
    location.pathname === '/'
      ? 'home'
      : location.pathname === '/explore'
        ? 'explore'
        : location.pathname === '/recommend'
          ? 'recommend'
          : activeSection;

  const activeLinkClass =
    'text-primary font-semibold text-sm tracking-wide border-b-2 border-primary pb-1 transition-colors duration-200';

  const inactiveLinkClass =
    'text-light-text-secondary dark:text-dark-text-secondary hover:text-primary transition-colors duration-200 text-sm tracking-wide';

  return (
    <nav className="sticky top-0 z-50 h-20 bg-light-surface dark:bg-dark-surface shadow-lg transition-all duration-300 border-b border-light-surface-alt dark:border-dark-surface-alt">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-8">
        <Link
          to="/"
          className="inline-flex items-center hover:opacity-80 transition-opacity"
          aria-label="Vibefy home"
        >
          <img src={brandLogoSrc} alt="Vibefy" className="h-23 w-[145px] object-contain object-left" />
        </Link>

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
            to="/recommend"
            className={location.pathname === '/recommend' ? activeLinkClass : inactiveLinkClass}
          >
            Recommend
          </Link>

          <Link
            to="/about"
            onClick={() => {
              setActiveSection('about');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={
              location.pathname === '/about' && currentSection === 'about'
                ? activeLinkClass
                : inactiveLinkClass
            }
          >
            About
          </Link>

          <Link
            to="/about#contact"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('contact');
              if (location.pathname === '/about') {
                scrollToContactSection('smooth');
              } else {
                navigate('/about#contact');
              }
            }}
            className={
              location.pathname === '/about' && currentSection === 'contact'
                ? activeLinkClass
                : inactiveLinkClass
            }
          >
            Contact
          </Link>
        </div>

        <div className="relative flex items-center gap-3" ref={menuRef}>
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg p-2.5 text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-surface-alt dark:hover:bg-dark-surface-alt hover:text-primary transition-all duration-200"
            aria-label="Toggle dark mode"
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {isAuthenticated ? (
            <>
              <button
                type="button"
                onClick={() => setIsMenuOpen((current) => !current)}
                className="rounded-lg border border-light-surface-alt dark:border-dark-surface-alt bg-light-surface-alt dark:bg-dark-surface hover:bg-light-bg dark:hover:bg-dark-bg p-1.5 transition-all duration-200 shadow-sm"
                aria-label="Open profile menu"
              >
                <AvatarDisplay avatarId={avatarId} size={36} className="rounded-md" />
              </button>

              {isMenuOpen ? (
                <div className="absolute right-0 top-16 z-50 min-w-[260px] rounded-xl border border-light-surface-alt dark:border-dark-surface-alt bg-light-surface dark:bg-dark-surface shadow-xl dark:shadow-2xl p-4">
                  <div className="flex items-center gap-3 px-2 pb-4 border-b border-light-surface-alt dark:border-dark-surface-alt">
                    <AvatarDisplay avatarId={avatarId} size={44} className="rounded-lg" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-light-text dark:text-dark-text">
                        {user?.name || 'User'}
                      </p>
                      <p className="truncate text-xs text-light-text-secondary dark:text-dark-text-secondary">
                        {user?.email || 'No email'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate('/profile');
                    }}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-light-text dark:text-dark-text transition-colors duration-150 hover:bg-light-surface-alt dark:hover:bg-dark-surface-alt"
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
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-light-text dark:text-dark-text transition-colors duration-150 hover:bg-light-surface-alt dark:hover:bg-dark-surface-alt"
                  >
                    <FiSettings size={16} />
                    Preferences
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 transition-colors duration-150 hover:bg-red-100 dark:hover:bg-red-950/40"
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
                className="rounded-md px-4 py-2 text-sm font-medium text-primary transition-all duration-200 hover:bg-primary/10 dark:hover:bg-primary/20 active:scale-95"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="rounded-lg bg-gradient-to-r from-primary to-secondary px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 active:scale-95"
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