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

    def _parse_genres(self, genre_value, genres_value) -> List[str]:
        collected = []

        if genre_value:
            if isinstance(genre_value, str):
                collected.extend(
                    [g.strip().lower() for g in re.split(r"[|,;/]+", genre_value) if g.strip()]
                )

        if genres_value:
            if isinstance(genres_value, list):
                collected.extend(
                    [str(g).strip().lower() for g in genres_value if str(g).strip()]
                )
            elif isinstance(genres_value, str):
                collected.extend(
                    [g.strip().lower() for g in re.split(r"[|,;/]+", genres_value) if g.strip()]
                )

        # preserve order, remove duplicates
        seen = set()
        final = []
        for g in collected:
            if g not in seen:
                seen.add(g)
                final.append(g)

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

            popularity = self._safe_int(track.get("popularity"), 0)
            explicit = self._safe_bool(track.get("explicit"), False)
            duration_sec = self._safe_int(track.get("durationSec"), 0)

            if intent == "similar_content" and reference_track:
                reference_track_id = reference_track.get("trackId")
                current_track_id = track.get("trackId")

                if reference_track_id and current_track_id == reference_track_id:
                    continue

                if title_lower == str(reference_track.get("title", "")).lower():
                    continue

            title_matches = title_words.intersection(keywords)
            if len(title_matches) >= 2:
                score += 18 * len(title_matches)
                reasons.append(
                    f"Matched multiple title words: {', '.join(sorted(title_matches))}"
                )
            elif len(title_words) >= 2 and title_words.issubset(query_words):
                score += 20
                reasons.append("Title phrase closely matched query")

            genre_matches = [genre for genre in genres if genre in keywords]
            if genre_matches:
                score += 25 * len(genre_matches)
                reasons.append(f"Matched genre: {', '.join(genre_matches)}")

            if explicit_artist_query:
                explicit_artist_words = self._text_words(explicit_artist_query)
                overlap = explicit_artist_words.intersection(artist_words)
                if overlap:
                    score += 35
                    reasons.append(f"Matched artist: {track.get('artist')}")

            if intent == "similar_content" and reference_track:
                artist_overlap = artist_words.intersection(reference_artist_words)
                if artist_overlap:
                    score += 35
                    reasons.append("Same or similar artist as reference")

                album_overlap = album_words.intersection(reference_album_words)
                if album_overlap:
                    score += 10
                    reasons.append("Related album wording to reference")

                genre_overlap = [genre for genre in genres if genre in reference_genres]
                if len(genre_overlap) >= 2:
                    score += 30
                    reasons.append(
                        f"Strong genre overlap with reference: {', '.join(genre_overlap)}"
                    )
                elif len(genre_overlap) == 1:
                    score += 15
                    reasons.append(
                        f"Partial genre overlap with reference: {', '.join(genre_overlap)}"
                    )

                if reference_explicit is not None and explicit == reference_explicit:
                    score += 6
                    reasons.append("Matched explicit style of reference")

            if intent == "top_results" and popularity >= 85:
                score += 18
                reasons.append("Boosted for high popularity")
            elif popularity >= 70:
                score += 10
                reasons.append("Boosted for good popularity")

            if popularity > 0:
                score += int(popularity / 5)
                reasons.append("Included popularity-based bonus")

            if duration_sec >= 120 and duration_sec <= 360:
                score += 4
                reasons.append("Standard track length bonus")

            if track.get("enriched"):
                score += 5
                reasons.append("Boosted for enriched metadata")

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