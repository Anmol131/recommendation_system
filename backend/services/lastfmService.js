const axios = require('axios');
const Music = require('../models/Music');

const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const LASTFM_BASE_URL = process.env.LASTFM_BASE_URL || 'https://ws.audioscrobbler.com/2.0';

const isPlaceholderImage = (url) => {
  if (!url) return true;
  return url.includes('2a96cbd8b46e442fc41c2b86b821562f');
};

const getImage = (images) => {
  if (!Array.isArray(images)) return null;
  const preferred = ['extralarge', 'large', 'medium', 'small'];
  for (const size of preferred) {
    const found = images.find((i) => i.size === size);
    const url = found?.['#text'];
    if (url && url.trim() !== '' && !isPlaceholderImage(url)) {
      return url;
    }
  }
  return null;
};

const mapTrack = (track, topTags = []) => ({
  title:      track.name,
  artist:     typeof track.artist === 'string' ? track.artist : track.artist?.name,
  album:      track.album?.title || null,
  albumArt:   getImage(track.image) || getImage(track.album?.image) || null,
  genres:     topTags.map(t => t.name),
  popularity: parseInt(track.listeners || track.playcount || 0),
  lastfmUrl:  track.url || null,
  lastfmId:   track.mbid ||
              (track.name && track.artist
                ? `${track.name}-${typeof track.artist === 'string'
                    ? track.artist
                    : track.artist?.name}`.toLowerCase().replace(/\s+/g, '-')
                : null),
});

const upsertTrack = async (mapped) => {
  if (!mapped.lastfmId) {
    return null;
  }
  return Music.findOneAndUpdate(
    { lastfmId: mapped.lastfmId },
    { $set: mapped },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
};

async function searchTracks(query, limit = 20) {
  const response = await axios.get(LASTFM_BASE_URL, {
    params: { method: 'track.search', track: query, api_key: LASTFM_API_KEY, format: 'json', limit },
  });

  const tracks = response.data?.results?.trackmatches?.track;
  const total = parseInt(response.data?.results?.['opensearch:totalResults'] || 0);

  if (!tracks || tracks.length === 0) {
    return { results: [], total: 0 };
  }

  const enrichWithArt = async (track) => {
    try {
      const artist = typeof track.artist === 'string'
        ? track.artist
        : track.artist?.name;
      const { data } = await axios.get(LASTFM_BASE_URL, {
        params: {
          method: 'track.getInfo',
          track: track.name,
          artist,
          api_key: LASTFM_API_KEY,
          format: 'json',
        },
      });
      const realImage = getImage(data?.track?.album?.image);
      return {
        ...track,
        image: realImage
          ? [{ '#text': realImage, size: 'extralarge' }]
          : track.image,
      };
    } catch {
      return track;
    }
  };

  const tracksToEnrich = tracks.slice(0, 10);
  const enriched = await Promise.all(tracksToEnrich.map(enrichWithArt));
  const finalTracks = [...enriched, ...tracks.slice(10)];

  const mapped = finalTracks.map((t) => mapTrack(t));
  const savedTracks = await Promise.all(mapped.map(upsertTrack));
  return { results: savedTracks, total };
}

async function getTrackDetails(artist, track) {
  const [trackRes, tagsRes] = await Promise.all([
    axios.get(LASTFM_BASE_URL, {
      params: { method: 'track.getInfo', artist, track, api_key: LASTFM_API_KEY, format: 'json' },
    }),
    axios.get(LASTFM_BASE_URL, {
      params: { method: 'track.getTopTags', artist, track, api_key: LASTFM_API_KEY, format: 'json' },
    }),
  ]);

  const trackData = trackRes.data.track;
  const tags = (tagsRes.data.toptags?.tag || []).slice(0, 5);

  const mapped = mapTrack(trackData, tags);
  return upsertTrack(mapped);
}

async function getTracksByGenre(genre, limit = 20) {
  const response = await axios.get(LASTFM_BASE_URL, {
    params: { method: 'tag.getTopTracks', tag: genre, api_key: LASTFM_API_KEY, format: 'json', limit },
  });

  const tracks = response.data?.tracks?.track || [];
  const mapped = tracks.map(t => mapTrack(t));
  return Promise.all(mapped.map(upsertTrack));
}

async function getSimilarTracks(artist, track, limit = 10) {
  try {
    const response = await axios.get(LASTFM_BASE_URL, {
      params: { method: 'track.getSimilar', artist, track, api_key: LASTFM_API_KEY, format: 'json', limit },
    });

    const tracks = response.data?.similartracks?.track || [];
    const mapped = tracks.map(t => mapTrack(t));
    return Promise.all(mapped.map(upsertTrack));
  } catch (err) {
    console.error('[LastFM] getSimilarTracks error:', err.message);
    return [];
  }
}

async function testConnection() {
  const { results } = await searchTracks('coldplay', 2);
  return results.length > 0;
}

module.exports = { searchTracks, getTrackDetails, getTracksByGenre, getSimilarTracks, testConnection };
