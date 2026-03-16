import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiLogOut, FiUser } from 'react-icons/fi';
import { MdClose } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const tabs = [
    { id: 'all', label: 'All', type: null },
    { id: 'movies', label: 'Movies', type: 'movies' },
    { id: 'books', label: 'Books', type: 'books' },
    { id: 'games', label: 'Games', type: 'games' },
    { id: 'music', label: 'Music', type: 'music' },
  ];

  const handleTabClick = (tabId, type) => {
    setActiveTab(tabId);
    if (type) {
      navigate(`/browse?type=${type}`);
    } else {
      navigate('/');
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-surface border-b border-surface2">
      {/* Top bar */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between gap-8">
          {/* Logo */}
          <div
            onClick={() => navigate('/')}
            className="text-2xl font-bold bg-gradient-to-r from-primary to-primaryDark bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition whitespace-nowrap glow-purple"
          >
            AI Recommender
          </div>

          {/* Search */}
          <form
            onSubmit={handleSearch}
            className="flex-1 max-w-2xl relative hidden sm:flex"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies, books, games, music..."
              className="w-full px-4 py-3 pr-20 rounded-lg bg-surface2 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-10 top-1/2 -translate-y-1/2 text-muted hover:text-white transition"
                aria-label="Clear search"
              >
                <MdClose size={18} />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition"
            >
              <FiSearch size={20} />
            </button>
          </form>

          {/* Right section */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-surface2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-bg font-bold">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium hidden sm:block">
                    {user?.name?.split(' ')[0] || 'User'}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-lg hover:bg-surface2 text-muted hover:text-primary transition"
                  title="Logout"
                >
                  <FiLogOut size={20} />
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2 rounded-lg bg-primary text-bg font-semibold hover:bg-primaryDark transition"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="px-6 py-4 border-t border-surface2 flex gap-8 overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id, tab.type)}
            className={`whitespace-nowrap text-sm font-medium pb-2 transition ${
              activeTab === tab.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted hover:text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mobile search bar */}
      <form
        onSubmit={handleSearch}
        className="px-6 py-3 sm:hidden border-t border-surface2"
      >
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-2 pr-10 rounded-lg bg-surface2 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-white transition"
                aria-label="Clear search"
              >
                <MdClose size={18} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="p-2 rounded-lg bg-primary text-bg font-semibold hover:bg-primaryDark transition"
          >
            <FiSearch size={20} />
          </button>
        </div>
      </form>
    </nav>
  );
};

export default Navbar;
