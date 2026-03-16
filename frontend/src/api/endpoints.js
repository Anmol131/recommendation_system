import instance from './axios';

// ─────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────
export const register = async (name, email, password) => {
  const { data } = await instance.post('/auth/register', { name, email, password });
  return data;
};

export const login = async (email, password) => {
  const { data } = await instance.post('/auth/login', { email, password });
  return data;
};

export const getMe = async () => {
  const { data } = await instance.get('/auth/me');
  return data;
};

// ─────────────────────────────────────────
// MOVIES
// ─────────────────────────────────────────
export const getMovies = async (params = {}) => {
  const { data } = await instance.get('/movies', { params });
  return data;
};

export const searchMovies = async (q) => {
  const { data } = await instance.get('/movies/search', { params: { q } });
  return data;
};

export const getMovieById = async (id) => {
  const { data } = await instance.get(`/movies/${id}`);
  return data;
};

// ─────────────────────────────────────────
// BOOKS
// ─────────────────────────────────────────
export const getBooks = async (params = {}) => {
  const { data } = await instance.get('/books', { params });
  return data;
};

export const searchBooks = async (q) => {
  const { data } = await instance.get('/books/search', { params: { q } });
  return data;
};

export const getBookByIsbn = async (isbn) => {
  const { data } = await instance.get(`/books/${isbn}`);
  return data;
};

// ─────────────────────────────────────────
// GAMES
// ─────────────────────────────────────────
export const getGames = async (params = {}) => {
  const { data } = await instance.get('/games', { params });
  return data;
};

export const searchGames = async (q) => {
  const { data } = await instance.get('/games/search', { params: { q } });
  return data;
};

export const getGameById = async (gameId) => {
  const { data } = await instance.get(`/games/${gameId}`);
  return data;
};

// ─────────────────────────────────────────
// MUSIC
// ─────────────────────────────────────────
export const getMusic = async (params = {}) => {
  const { data } = await instance.get('/music', { params });
  return data;
};

export const searchMusic = async (q) => {
  const { data } = await instance.get('/music/search', { params: { q } });
  return data;
};

export const getMusicByTrackId = async (trackId) => {
  const { data } = await instance.get(`/music/${trackId}`);
  return data;
};

// ─────────────────────────────────────────
// USER
// ─────────────────────────────────────────
export const getProfile = async () => {
  const { data } = await instance.get('/user/profile');
  return data;
};

export const updatePreferences = async (preferences) => {
  const { data } = await instance.put('/user/preferences', preferences);
  return data;
};

export const addHistory = async (type, itemId, action, rating = null) => {
  const { data } = await instance.post('/user/history', { type, itemId, action, rating });
  return data;
};

export const getHistory = async () => {
  const { data } = await instance.get('/user/history');
  return data;
};
