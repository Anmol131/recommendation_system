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
    "recommend", "best", "listen", "top", "popular", "playlist",
}

MUSIC_GENRE_TERMS = {
    "pop", "rock", "hip-hop", "hiphop", "rap", "pop rap", "dance", "edm",
    "electronic", "indie", "latin", "jazz", "classical", "country", "metal",
    "punk", "folk", "reggae", "blues", "rnb", "r&b", "soul", "house",
    "techno", "trap", "k-pop", "kpop", "afrobeats", "alt-rock",
    "alternative", "dark pop", "electropop", "bollywood", "film music",
    "indian pop", "lo-fi", "lofi", "acoustic", "ambient", "synthpop",
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

    def _normalize_text(self, text: str) -> str:
        return re.sub(r"\s+", " ", str(text or "").strip().lower())

    def _title_words(self, text: str) -> Set[str]:
        cleaned = re.sub(r"[^a-z0-9\s]", " ", str(text or "").lower())
        return {word for word in cleaned.split() if word}

    def _text_words(self, text: str) -> Set[str]:
        if not text:
            return set()

        cleaned = re.sub(r"[^a-z0-9\s]", " ", str(text).lower())
        return {
            word for word in cleaned.split()
            if len(word) > 2 and word not in STOPWORDS
        }

    def _tokenize_values(self, values: List[str]) -> Set[str]:
        tokens: Set[str] = set()

        for value in values or []:
            cleaned = re.sub(r"[^a-z0-9\s]", " ", str(value).lower())
            for part in cleaned.split():
                part = part.strip()
                if len(part) > 2 and part not in STOPWORDS:
                    tokens.add(part)

        return tokens

    def _normalize_genre_token(self, token: str) -> str:
        token = self._normalize_text(token)

        replacements = {
            "hip hop": "hip-hop",
            "hiphop": "hip-hop",
            "r b": "rnb",
            "r&b": "rnb",
            "k pop": "k-pop",
            "kpop": "k-pop",
            "lo fi": "lo-fi",
            "lofi": "lo-fi",
        }

        return replacements.get(token, token)

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

    def _parse_artists(self, artist_value: Optional[str]) -> List[str]:
        if not artist_value:
            return []

        artists = [
            self._normalize_text(part)
            for part in re.split(r"[;,/&]+", str(artist_value))
            if part.strip()
        ]

        seen = set()
        final = []

        for artist in artists:
            if artist not in seen:
                seen.add(artist)
                final.append(artist)

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

        reference_words = set(reference_title.lower().split())

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

    def _extract_query_genres(self, keywords: Set[str], understanding: Dict) -> Set[str]:
        normalized = {self._normalize_genre_token(k) for k in keywords}
        query_genres = {k for k in normalized if k in MUSIC_GENRE_TERMS}

        for genre in understanding.get("genres", []) or []:
            normalized_genre = self._normalize_genre_token(str(genre))
            if normalized_genre:
                query_genres.add(normalized_genre)

        return query_genres

    def _extract_external_artist_hint_names(self, understanding: Dict) -> Set[str]:
        names = set()

        for artist in understanding.get("artist_hints", []) or []:
            cleaned = self._normalize_text(str(artist))
            if cleaned:
                names.add(cleaned)

        resolved_entity = self._normalize_text(understanding.get("resolved_entity", ""))
        resolved_type = self._normalize_text(understanding.get("resolved_entity_type", ""))

        if resolved_entity and resolved_type == "artist":
            names.add(resolved_entity)

        return names

    def _extract_external_hint_terms(self, understanding: Dict) -> Set[str]:
        hint_values = []

        for key in [
            "genres",
            "themes",
            "language_hints",
            "region_hints",
            "artist_hints",
        ]:
            values = understanding.get(key, []) or []
            if isinstance(values, list):
                hint_values.extend(values)

        return self._tokenize_values(hint_values)

    def _phrase_in_text(self, phrase: str, text: str) -> bool:
        phrase = self._normalize_text(phrase)
        text = self._normalize_text(text)

        if not phrase or not text:
            return False

        return phrase in text

    def _normalized_popularity(self, track: Dict) -> float:
        raw = self._safe_float(track.get("popularity"), 0.0)

        if raw <= 0:
            return 0.0

        if track.get("trackId"):
            return min(100.0, raw)

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
        top_n: int = 5,
    ) -> List[Dict]:
        keywords = {str(k).lower() for k in query_data.get("keywords", [])}
        cleaned_query = query_data.get("cleaned_query", "")
        query_words = set(cleaned_query.split())

        understanding = query_data.get("external_understanding", {}) or {}

        external_artist_hint_names = self._extract_external_artist_hint_names(understanding)
        external_artist_hint_words = self._tokenize_values(list(external_artist_hint_names))
        external_hint_terms = self._extract_external_hint_terms(understanding)

        results = []

        reference_track = None
        reference_artist_names = []
        reference_album_words = set()
        reference_genres = []
        reference_explicit = None

        explicit_artist_query = self._extract_artist_name(cleaned_query)
        explicit_artist_words = self._text_words(explicit_artist_query or "")

        query_genres = self._extract_query_genres(keywords, understanding)
        semantic_query_terms = {
            term for term in (keywords | external_hint_terms)
            if term not in STOPWORDS and len(term) > 2
        }

        if intent == "similar_content":
            reference_title = self._extract_reference_title(cleaned_query)

            if reference_title:
                reference_track = self._find_reference_track(reference_title)

                if reference_track:
                    reference_artist_names = self._parse_artists(reference_track.get("artist", ""))
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

            title = track.get("title", "") or ""
            artist = track.get("artist", "") or ""
            album = track.get("album", "") or ""

            title_lower = title.lower()

            title_words = self._title_words(title)
            artist_words = self._text_words(artist)
            album_words = self._text_words(album)

            artist_names = self._parse_artists(artist)
            genres = self._parse_genres(track.get("genre"), track.get("genres"))
            genre_words = self._tokenize_values(genres)

            searchable_text = " ".join(
                [
                    str(title),
                    str(artist),
                    str(album),
                    str(track.get("genre") or ""),
                    " ".join(genres),
                ]
            )

            normalized_popularity = self._normalized_popularity(track)
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
            artist_keyword_matches = artist_words.intersection(keywords)
            album_keyword_matches = album_words.intersection(keywords)

            genre_matches = [
                genre for genre in genres
                if self._normalize_genre_token(genre) in query_genres
            ]

            semantic_metadata_words = (
                title_words
                | artist_words
                | album_words
                | genre_words
                | set(genres)
            )

            semantic_hint_matches = semantic_metadata_words.intersection(semantic_query_terms)

            exact_artist_hint_matches = [
                artist_hint
                for artist_hint in external_artist_hint_names
                if self._phrase_in_text(artist_hint, artist)
            ]

            artist_hint_word_matches = artist_words.intersection(external_artist_hint_words)

            explicit_artist_overlap = (
                explicit_artist_words.intersection(artist_words)
                if explicit_artist_words
                else set()
            )

            if query_genres and intent == "top_results":
                if not genre_matches and not exact_artist_hint_matches and not semantic_hint_matches:
                    continue

            if len(title_matches) >= 2:
                score += 16 * len(title_matches)
                reasons.append(
                    f"Matched multiple title words: {', '.join(sorted(title_matches))}"
                )
            elif len(title_words) >= 2 and title_words.issubset(query_words):
                score += 20
                reasons.append("Title phrase closely matched query")

            if artist_keyword_matches:
                score += 18 * len(artist_keyword_matches)
                reasons.append(
                    f"Matched artist keyword: {', '.join(sorted(artist_keyword_matches))}"
                )

            if album_keyword_matches:
                score += 8 * len(album_keyword_matches)
                reasons.append(
                    f"Matched album keyword: {', '.join(sorted(album_keyword_matches))}"
                )

            if genre_matches:
                score += 35 * len(genre_matches)
                reasons.append(f"Matched genre: {', '.join(genre_matches)}")

            if exact_artist_hint_matches:
                score += 55 * len(exact_artist_hint_matches)
                reasons.append(
                    f"Matched artist hint: {', '.join(sorted(exact_artist_hint_matches))}"
                )

            elif artist_hint_word_matches:
                score += 20 * len(artist_hint_word_matches)
                reasons.append(
                    f"Matched artist hint words: {', '.join(sorted(artist_hint_word_matches))}"
                )

            if semantic_hint_matches:
                score += 10 * len(semantic_hint_matches)
                reasons.append(
                    f"Matched semantic hint: {', '.join(sorted(semantic_hint_matches))}"
                )

            if explicit_artist_words:
                if explicit_artist_overlap:
                    score += 50
                    reasons.append(f"Matched artist: {track.get('artist')}")
                elif query_genres or external_hint_terms or external_artist_hint_names:
                    score += 4
                    reasons.append(
                        "Related music fallback used because exact artist match was limited locally"
                    )

            if intent == "similar_content" and reference_track:
                exact_artist_overlap = set(artist_names).intersection(set(reference_artist_names))
                album_overlap = album_words.intersection(reference_album_words)
                reference_genre_overlap = [genre for genre in genres if genre in reference_genres]

                if not exact_artist_overlap and not reference_genre_overlap:
                    continue

                if exact_artist_overlap:
                    score += 55
                    reasons.append("Same artist as reference")

                if album_overlap:
                    score += 8
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