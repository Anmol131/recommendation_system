const axios = require('axios');
const Music = require('../models/Music');

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_BASE_URL = process.env.SPOTIFY_BASE_URL || 'https://api.spotify.com/v1';

// In-memory token cache
let cachedToken = null;
let tokenExpiry = 0;

async function getSpotifyToken() {
  if (cachedToken && Date.now() < tokenExpiry - 60000) {
    return cachedToken;
  }

  try {
    const credentials = Buffer.from(
      `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
    ).toString('base64');

    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    cachedToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000);
    return cachedToken;
  } catch (err) {
    console.error('[Spotify] Token error body:', err.response?.data);
    throw err;
  }
}

function mapTrack(track) {
  return {
    trackId: track.id,
    title: track.name,
    artist:
      track.artists && track.artists.length > 0 ? track.artists[0].name : null,
    album: track.album ? track.album.name : null,
    cover:
      track.album && track.album.images && track.album.images.length > 0
        ? track.album.images[0].url
        : null,
    previewUrl: track.preview_url || null,
    spotifyUrl: track.external_urls ? track.external_urls.spotify : null,
    popularity: track.popularity ?? null,
    explicit: track.explicit || false,
    enriched: true,
  };
}

async function searchTracks(query) {
  try {
    const token = await getSpotifyToken();

    const response = await axios.get(`${SPOTIFY_BASE_URL}/search`, {
      params: { q: query, type: 'track', limit: 20 },
      headers: { Authorization: `Bearer ${token}` },
    });

    const items = response.data.tracks?.items || [];
    const mapped = items.map(mapTrack);

    await Promise.all(
      mapped.map((track) =>
        Music.findOneAndUpdate(
          { trackId: track.trackId },
          { $set: track },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        )
      )
    );

    return mapped;
  } catch (err) {
    console.error('spotifyService.searchTracks error:', err.message);
    throw err;
  }
}

async function getTrackDetails(trackId) {
  try {
    const token = await getSpotifyToken();

    const response = await axios.get(`${SPOTIFY_BASE_URL}/tracks/${trackId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const mapped = mapTrack(response.data);

    const track = await Music.findOneAndUpdate(
      { trackId: mapped.trackId },
      { $set: mapped },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    return track;
  } catch (err) {
    console.error('spotifyService.getTrackDetails error:', err.message);
    throw err;
  }
}

async function searchTracksWithFallback(query) {
  try {
    const results = await searchTracks(query);
    if (results && results.length > 0) return results;
    throw new Error('Empty results from Spotify');
  } catch (err) {
    console.error('Spotify searchTracks failed, falling back to MongoDB:', err.message);
    const fallback = await Music.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } });
    return fallback;
  }
}

module.exports = { getSpotifyToken, searchTracks, getTrackDetails, searchTracksWithFallback };
