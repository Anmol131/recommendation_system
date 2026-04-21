import math
import re
from typing import Dict, List, Optional, Set

from ai.recommenders.base_recommender import BaseRecommender
from ai.utils.db import get_collection


STOPWORDS = {
    "a", "an", "the", "and", "or", "of", "in", "on", "at", "to", "for", "with",
    "by", "from", "is", "are", "was", "were", "be", "been", "being",
    "this", "that", "these", "those", "it", "its", "as", "into", "than",
    "me", "you", "your", "my", "our", "their", "like", "similar",
    "song", "songs", "music", "track", "tracks", "artist", "artists",
    "recommend", "best", "listen"
}

MUSIC_GENRE_TERMS = {
    "pop", "rock", "hip-hop", "hiphop", "rap", "dance", "edm", "electronic",
    "indie", "latin", "jazz", "classical", "country", "metal", "punk",
    "folk", "reggae", "blues", "rnb", "soul", "house", "techno", "trap",
    "k-pop", "kpop"
}


class MusicRecommender(BaseRecommender):
    def __init__(self):
        self.collection = get_collection("musics")

    def _safe_float(self, value, default: float = 0.0) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return default

    def _safe_int(self, value, default: int = 0) -> int:
        try:
            return int(float(value))
        except (TypeError, ValueError):
            return default

    def _safe_bool(self, value, default: bool = False) -> bool:
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            lower = value.strip().lower()
            if lower == "true":
                return True
            if lower == "false":
                return False
        return default

    def _title_words(self, text: str) -> Set[str]:
        cleaned = re.sub(r"[^a-z0-9\s]", " ", text.lower())
        return {word for word in cleaned.split() if word}

    def _text_words(self, text: str) -> Set[str]:
        if not text:
            return set()

        cleaned = re.sub(r"[^a-z0-9\s]", " ", text.lower())
        return {
            word for word in cleaned.split()
            if len(word) > 2 and word not in STOPWORDS
        }

    def _normalize_genre_token(self, token: str) -> str:
        token = token.strip().lower()
        if token in {"hip hop", "hiphop"}:
            return "hip-hop"
        if token in {"r&b", "rnb"}:
            return "rnb"
        if token in {"k pop", "kpop"}:
            return "k-pop"
        return token

    def _parse_genres(self, genre_value, genres_value) -> List[str]:
        collected = []

        if genre_value:
            if isinstance(genre_value, str):
                collected.extend(
                    [
                        self._normalize_genre_token(g)
                        for g in re.split(r"[|,;/]+", genre_value)
                        if g.strip()
                    ]
                )

        if genres_value:
            if isinstance(genres_value, list):
                collected.extend(
                    [
                        self._normalize_genre_token(str(g))
                        for g in genres_value
                        if str(g).strip()
                    ]
                )
            elif isinstance(genres_value, str):
                collected.extend(
                    [
                        self._normalize_genre_token(g)
                        for g in re.split(r"[|,;/]+", genres_value)
                        if g.strip()
                    ]
                )

        seen = set()
        final = []
        for genre in collected:
            if genre and genre not in seen:
                seen.add(genre)
                final.append(genre)

        return final

    def _extract_reference_title(self, cleaned_query: str) -> Optional[str]:
        patterns = [
            r"like\s+(.+)$",
            r"similar to\s+(.+)$",
            r"something like\s+(.+)$",
            r"related to\s+(.+)$",
        ]

        for pattern in patterns:
            match = re.search(pattern, cleaned_query)
            if match:
                return match.group(1).strip()

        return None

    def _find_reference_track(self, reference_title: str) -> Optional[Dict]:
        if not reference_title:
            return None

        reference_words = set(reference_title.split())

        musics = self.collection.find(
            {},
            {
                "_id": 0,
                "trackId": 1,
                "title": 1,
                "artist": 1,
                "album": 1,
                "genre": 1,
                "genres": 1,
                "explicit": 1,
            },
        )

        best_match = None
        best_score = 0

        for track in musics:
            title = track.get("title", "")
            title_words = self._title_words(title)
            overlap = len(title_words.intersection(reference_words))

            if overlap > best_score:
                best_score = overlap
                best_match = track

        return best_match if best_score > 0 else None

    def _extract_artist_name(self, cleaned_query: str) -> Optional[str]:
        patterns = [
            r"by\s+(.+)$",
            r"from\s+(.+)$",
        ]

        for pattern in patterns:
            match = re.search(pattern, cleaned_query)
            if match:
                return match.group(1).strip()

        return None

    def _extract_query_genres(self, keywords: Set[str]) -> Set[str]:
        normalized = {self._normalize_genre_token(k) for k in keywords}
        return {k for k in normalized if k in MUSIC_GENRE_TERMS}

    def _normalized_popularity(self, track: Dict) -> float:
        raw = self._safe_float(track.get("popularity"), 0.0)
        if raw <= 0:
            return 0.0

        # Spotify-like records usually have real trackId and 0-100 popularity
        if track.get("trackId"):
            return min(100.0, raw)

        # Last.fm-like records may have huge popularity values
        if raw > 100:
            return min(100.0, math.log10(raw + 1) * 18)

        return raw

    def _metadata_quality_bonus(self, track: Dict, genres: List[str]) -> int:
        bonus = 0

        if track.get("trackId"):
            bonus += 12
        if genres:
            bonus += 10
        if track.get("artist"):
            bonus += 4
        if track.get("album"):
            bonus += 3
        if track.get("spotifyUrl"):
            bonus += 4
        if track.get("previewUrl"):
            bonus += 3
        if track.get("cover") or track.get("albumArt"):
            bonus += 2
        if track.get("enriched"):
            bonus += 5

        return bonus

    def recommend(
        self,
        query_data: Dict,
        intent: str = "general_search",
        top_n: int = 5
    ) -> List[Dict]:
        keywords = {str(k).lower() for k in query_data.get("keywords", [])}
        cleaned_query = query_data.get("cleaned_query", "")
        query_words = set(cleaned_query.split())

        results = []

        reference_track = None
        reference_artist_words = set()
        reference_album_words = set()
        reference_genres = []
        reference_explicit = None

        explicit_artist_query = self._extract_artist_name(cleaned_query)
        explicit_artist_words = self._text_words(explicit_artist_query or "")
        query_genres = self._extract_query_genres(keywords)

        if intent == "similar_content":
            reference_title = self._extract_reference_title(cleaned_query)
            if reference_title:
                reference_track = self._find_reference_track(reference_title)
                if reference_track:
                    reference_artist_words = self._text_words(reference_track.get("artist", "") or "")
                    reference_album_words = self._text_words(reference_track.get("album", "") or "")
                    reference_genres = self._parse_genres(
                        reference_track.get("genre"),
                        reference_track.get("genres"),
                    )
                    reference_explicit = self._safe_bool(reference_track.get("explicit"), False)

        musics = list(
            self.collection.find(
                {},
                {
                    "_id": 0,
                    "trackId": 1,
                    "title": 1,
                    "artist": 1,
                    "album": 1,
                    "genre": 1,
                    "popularity": 1,
                    "explicit": 1,
                    "durationSec": 1,
                    "cover": 1,
                    "previewUrl": 1,
                    "spotifyUrl": 1,
                    "enriched": 1,
                    "lastfmId": 1,
                    "lastfmUrl": 1,
                    "albumArt": 1,
                    "genres": 1,
                },
            )
        )

        for track in musics:
            score = 0
            reasons = []

            title = track.get("title", "")
            title_lower = title.lower()
            artist = track.get("artist", "") or ""
            album = track.get("album", "") or ""

            title_words = self._title_words(title)
            artist_words = self._text_words(artist)
            album_words = self._text_words(album)
            genres = self._parse_genres(track.get("genre"), track.get("genres"))

            normalized_popularity = self._normalized_popularity(track)
            explicit = self._safe_bool(track.get("explicit"), False)
            duration_sec = self._safe_int(track.get("durationSec"), 0)

            # Strong query filtering for artist-based searches
            if explicit_artist_words:
                artist_overlap = explicit_artist_words.intersection(artist_words)
                if not artist_overlap:
                    continue

            # Strong query filtering for genre searches
            genre_matches = [genre for genre in genres if genre in query_genres]
            if query_genres and intent == "top_results":
                if not genre_matches:
                    continue

            if intent == "similar_content" and reference_track:
                reference_track_id = reference_track.get("trackId")
                current_track_id = track.get("trackId")

                if reference_track_id and current_track_id == reference_track_id:
                    continue

                if title_lower == str(reference_track.get("title", "")).lower():
                    continue

            title_matches = title_words.intersection(keywords)
            if len(title_matches) >= 2:
                score += 16 * len(title_matches)
                reasons.append(
                    f"Matched multiple title words: {', '.join(sorted(title_matches))}"
                )
            elif len(title_words) >= 2 and title_words.issubset(query_words):
                score += 20
                reasons.append("Title phrase closely matched query")

            if genre_matches:
                score += 35 * len(genre_matches)
                reasons.append(f"Matched genre: {', '.join(genre_matches)}")

            if explicit_artist_words:
                artist_overlap = explicit_artist_words.intersection(artist_words)
                if artist_overlap:
                    score += 50
                    reasons.append(f"Matched artist: {track.get('artist')}")

            if intent == "similar_content" and reference_track:
                artist_overlap = artist_words.intersection(reference_artist_words)
                album_overlap = album_words.intersection(reference_album_words)
                reference_genre_overlap = [genre for genre in genres if genre in reference_genres]

                # Require real similarity, not just popularity
                if not artist_overlap and not album_overlap and not reference_genre_overlap:
                    continue

                if artist_overlap:
                    score += 45
                    reasons.append("Same or similar artist as reference")

                if album_overlap:
                    score += 12
                    reasons.append("Related album wording to reference")

                if len(reference_genre_overlap) >= 2:
                    score += 30
                    reasons.append(
                        f"Strong genre overlap with reference: {', '.join(reference_genre_overlap)}"
                    )
                elif len(reference_genre_overlap) == 1:
                    score += 16
                    reasons.append(
                        f"Partial genre overlap with reference: {', '.join(reference_genre_overlap)}"
                    )

                if reference_explicit is not None and explicit == reference_explicit:
                    score += 6
                    reasons.append("Matched explicit style of reference")

            if intent == "top_results" and normalized_popularity >= 85:
                score += 18
                reasons.append("Boosted for high popularity")
            elif normalized_popularity >= 70:
                score += 10
                reasons.append("Boosted for good popularity")

            if normalized_popularity > 0:
                score += int(normalized_popularity / 4)
                reasons.append("Included normalized popularity bonus")

            if duration_sec >= 120 and duration_sec <= 360:
                score += 4
                reasons.append("Standard track length bonus")

            quality_bonus = self._metadata_quality_bonus(track, genres)
            if quality_bonus > 0:
                score += quality_bonus
                reasons.append("Metadata quality bonus applied")

            # Penalize weak records with almost no metadata
            if not track.get("trackId") and not genres:
                score -= 20
                reasons.append("Weak metadata penalty")

            if score > 0:
                results.append(
                    {
                        "trackId": track.get("trackId"),
                        "title": track.get("title"),
                        "type": "music",
                        "artist": track.get("artist"),
                        "album": track.get("album"),
                        "genre": track.get("genre"),
                        "genres": track.get("genres", []),
                        "popularity": track.get("popularity"),
                        "explicit": track.get("explicit"),
                        "durationSec": track.get("durationSec"),
                        "cover": track.get("cover"),
                        "previewUrl": track.get("previewUrl"),
                        "spotifyUrl": track.get("spotifyUrl"),
                        "enriched": track.get("enriched"),
                        "lastfmId": track.get("lastfmId"),
                        "lastfmUrl": track.get("lastfmUrl"),
                        "albumArt": track.get("albumArt"),
                        "score": score,
                        "reasons": reasons,
                    }
                )

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_n]