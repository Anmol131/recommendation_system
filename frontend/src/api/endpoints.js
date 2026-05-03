import instance from './axios';

// ─────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────
export const register = async (nameOrPayload, emailArg, passwordArg) => {
  const payload =
    typeof nameOrPayload === 'object' && nameOrPayload !== null
      ? {
          name: nameOrPayload.name,
          email: nameOrPayload.email,
          password: nameOrPayload.password,
        }
      : {
          name: nameOrPayload,
          email: emailArg,
          password: passwordArg,
        };

  const { data } = await instance.post('/auth/register', payload);
  return data;
};

export const login = async (emailOrPayload, passwordArg) => {
  const payload =
    typeof emailOrPayload === 'object' && emailOrPayload !== null
      ? {
          email: emailOrPayload.email,
          password: emailOrPayload.password,
        }
      : {
          email: emailOrPayload,
          password: passwordArg,
        };

  const { data } = await instance.post('/auth/login', payload);
  return data;
};

export const getMe = async () => {
  const { data } = await instance.get('/auth/me');
  return data;
};

// NEW: OTP FEATURE
export const verifyOtp = async (payload) => instance.post('/auth/verify-otp', payload).then((r) => r.data);

// NEW: OTP FEATURE
export const resendOtp = async (payload) => instance.post('/auth/resend-otp', payload).then((r) => r.data);

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

export const getContentDetails = async (type, id) => {
  const { data } = await instance.get(`/content/${type}/${id}`);
  return data;
};

export const getSimilarContent = async (type, id) => {
  const { data } = await instance.get(`/content/${type}/${id}/similar`);
  return data;
};

export const getSimilarTracks = async (trackId) => {
  const { data } = await instance.get(`/music/${trackId}/similar`);
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

export const updateAvatar = (avatar) => instance.put('/user/avatar', { avatar }).then((r) => r.data);

export const updateBio = (bio) => instance.put('/user/bio', { bio }).then((r) => r.data);

export const updatePassword = (payload) => instance.put('/user/change-password', payload).then((r) => r.data);

export const changePassword = updatePassword;

export const addHistory = async (type, itemId, action, rating = null) => {
  const { data } = await instance.post('/user/history', { type, itemId, action, rating });
  return data;
};

export const getHistory = async () => {
  const { data } = await instance.get('/user/history');
  return data;
};
export const analyzeQuery = async (query, topN = 5) => {
  const { data } = await instance.get('/ai/analyze', {
    params: { query, top_n: topN },
  });
  return data;
};

// ─────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────
export const adminLogin = async (email, password) => {
  const { data } = await instance.post('/admin/login', { email, password });
  return data;
};

export const getAdminMe = async () => {
  const { data } = await instance.get('/admin/me');
  return data;
};

export const getAdminDashboard = async () => {
  const { data } = await instance.get('/admin/dashboard');
  return data;
};

export const getAdminContent = async (params = {}) => {
  const { data } = await instance.get('/admin/content', { params });
  return data;
};

export const getAdminContentById = async (id) => {
  const { data } = await instance.get(`/admin/content/${id}`);
  return data;
};

export const createAdminContent = async (payload) => {
  const { data } = await instance.post('/admin/content', payload);
  return data;
};

export const updateAdminContent = async (id, payload) => {
  const type = payload && payload.type;
  if (!type) throw new Error('Payload must include `type` for admin content update');
  const { data } = await instance.put(`/admin/content/${type}/${id}`, payload);
  return data;
};

export const deleteAdminContent = async (type, id) => {
  if (!type) throw new Error('Type is required to delete admin content');
  const { data } = await instance.delete(`/admin/content/${type}/${id}`);
  return data;
};

export const getAdminSearchLogs = async (params = {}) => {
  const { data } = await instance.get('/admin/search-logs', { params });
  return data;
};

export const logSearch = async (payload) => {
  const { data } = await instance.post('/admin/search-logs', payload);
  return data;
};

export const deleteAdminSearchLog = async (id) => {
  const { data } = await instance.delete(`/admin/search-logs/${id}`);
  return data;
};