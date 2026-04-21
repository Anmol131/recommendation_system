import re
from typing import Dict, List, Optional, Set

from ai.recommenders.base_recommender import BaseRecommender
from ai.utils.db import get_collection


STOPWORDS = {
    "a", "an", "the", "and", "or", "of", "in", "on", "at", "to", "for", "with",
    "by", "from", "is", "are", "was", "were", "be", "been", "being",
    "this", "that", "these", "those", "it", "its", "as", "into", "than",
    "me", "you", "your", "my", "our", "their", "like", "similar", "movie",
    "movies", "film", "films", "something", "related", "recommend"
}


class MovieRecommender(BaseRecommender):
    def __init__(self):
        self.collection = get_collection("movies")

    def _parse_genres(self, genres_value) -> List[str]:
        if not genres_value:
            return []

        if isinstance(genres_value, list):
            return [
                str(genre).strip().lower()
                for genre in genres_value
                if str(genre).strip()
            ]

        if isinstance(genres_value, str):
            if genres_value.strip() == "(no genres listed)":
                return []
            return [
                genre.strip().lower()
                for genre in genres_value.split("|")
                if genre.strip()
            ]

        return []

    def _parse_cast(self, cast_value) -> List[str]:
        if not cast_value:
            return []

        if isinstance(cast_value, list):
            return [
                str(person).strip().lower()
                for person in cast_value
                if str(person).strip()
            ]

        if isinstance(cast_value, str):
            return [
                person.strip().lower()
                for person in re.split(r"[|,;]+", cast_value)
                if person.strip()
            ]

        return []

    def _safe_float(self, value, default: float = 0.0) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return default

    def _title_words(self, title: str) -> Set[str]:
        cleaned = re.sub(r"[^a-z0-9\s]", " ", title.lower())
        return {word for word in cleaned.split() if word}

    def _text_words(self, text: str) -> Set[str]:
        if not text:
            return set()

        cleaned = re.sub(r"[^a-z0-9\s]", " ", text.lower())
        words = {
            word for word in cleaned.split()
            if len(word) > 2 and word not in STOPWORDS
        }
        return words

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

    def _find_reference_movie(self, reference_title: str) -> Optional[Dict]:
        if not reference_title:
            return None

        reference_words = set(reference_title.split())

        movies = self.collection.find(
            {},
            {
                "_id": 0,
                "movieId": 1,
                "title": 1,
                "genres": 1,
                "description": 1,
                "cast": 1,
            },
        )

        best_match = None
        best_score = 0

        for movie in movies:
            title = movie.get("title", "")
            title_words = self._title_words(title)
            overlap = len(title_words.intersection(reference_words))

            if overlap > best_score:
                best_score = overlap
                best_match = movie

        return best_match if best_score > 0 else None

    def recommend(
        self,
        query_data: Dict,
        intent: str = "general_search",
        top_n: int = 5
    ) -> List[Dict]:
        keywords = {str(k).lower() for k in query_data.get("keywords", [])}
        cleaned_query = query_data.get("cleaned_query", "")
        results = []

        reference_movie = None
        reference_genres = []
        reference_cast = []
        reference_desc_words = set()

        if intent == "similar_content":
            reference_title = self._extract_reference_title(cleaned_query)
            if reference_title:
                reference_movie = self._find_reference_movie(reference_title)
                if reference_movie:
                    reference_genres = self._parse_genres(reference_movie.get("genres", []))
                    reference_cast = self._parse_cast(reference_movie.get("cast", []))
                    reference_desc_words = self._text_words(reference_movie.get("description", ""))

        movies = list(
            self.collection.find(
                {},
                {
                    "_id": 0,
                    "movieId": 1,
                    "title": 1,
                    "year": 1,
                    "genres": 1,
                    "avgRating": 1,
                    "ratingCount": 1,
                    "tmdbId": 1,
                    "imdbId": 1,
                    "description": 1,
                    "cast": 1,
                    "poster": 1,
                    "trailer": 1,
                },
            )
        )

        for movie in movies:
            score = 0
            reasons = []

            title = movie.get("title", "")
            title_lower = title.lower()
            genres = self._parse_genres(movie.get("genres", []))
            cast = self._parse_cast(movie.get("cast", []))
            description = movie.get("description", "") or ""
            description_words = self._text_words(description)

            avg_rating = self._safe_float(movie.get("avgRating"), 0.0)
            rating_count = self._safe_float(movie.get("ratingCount"), 0.0)

            if intent == "similar_content" and reference_movie:
                reference_movie_id = reference_movie.get("movieId")
                current_movie_id = movie.get("movieId")

                if reference_movie_id and current_movie_id == reference_movie_id:
                    continue

                if title_lower == str(reference_movie.get("title", "")).lower():
                    continue

            # Query genre match
            query_genre_matches = [genre for genre in genres if genre in keywords]
            if query_genre_matches:
                score += 15 * len(query_genre_matches)
                reasons.append(f"Matched query genre: {', '.join(query_genre_matches)}")

            # Similar-content scoring
            if intent == "similar_content" and reference_movie:
                # Genre overlap with reference
                overlapping_reference_genres = [
                    genre for genre in genres if genre in reference_genres
                ]
                overlap_count = len(overlapping_reference_genres)

                if overlap_count >= 2:
                    score += 55
                    reasons.append(
                        f"Strong genre overlap with reference: {', '.join(overlapping_reference_genres)}"
                    )
                elif overlap_count == 1:
                    score += 20
                    reasons.append(
                        f"Partial genre overlap with reference: {', '.join(overlapping_reference_genres)}"
                    )

                # Description overlap with reference movie
                desc_overlap = description_words.intersection(reference_desc_words)
                desc_overlap_count = len(desc_overlap)

                if desc_overlap_count >= 5:
                    score += 25
                    reasons.append("Strong description similarity to reference")
                elif desc_overlap_count >= 3:
                    score += 15
                    reasons.append("Moderate description similarity to reference")
                elif desc_overlap_count >= 2:
                    score += 8
                    reasons.append("Light description similarity to reference")

                # Cast overlap with reference movie
                cast_overlap = [person for person in cast if person in reference_cast]
                if cast_overlap:
                    score += 20
                    reasons.append(f"Shared cast with reference: {', '.join(cast_overlap[:2])}")

            else:
                # Only use title matching strongly for non-similar searches
                if title_lower in cleaned_query:
                    score += 40
                    reasons.append("Exact title phrase matched")
                else:
                    title_matches = self._title_words(title).intersection(keywords)
                    if len(title_matches) >= 2:
                        score += 20 * len(title_matches)
                        reasons.append(
                            f"Matched multiple title words: {', '.join(sorted(title_matches))}"
                        )

            # Rating bonus
            if intent == "top_results" and avg_rating >= 4.0:
                score += 15
                reasons.append("Boosted for high average rating")

            if avg_rating > 0:
                if intent == "similar_content":
                    rating_bonus = int(avg_rating * 2)
                else:
                    rating_bonus = int(avg_rating * 5)

                score += rating_bonus
                reasons.append("Included rating-based bonus")

            if rating_count >= 1000:
                score += 3 if intent == "similar_content" else 5
                reasons.append("Popular based on rating count")

            if score > 0:
                results.append(
                    {
                        "movieId": movie.get("movieId"),
                        "title": title,
                        "type": "movie",
                        "year": movie.get("year"),
                        "genres": genres,
                        "avgRating": movie.get("avgRating"),
                        "ratingCount": movie.get("ratingCount"),
                        "tmdbId": movie.get("tmdbId"),
                        "imdbId": movie.get("imdbId"),
                        "description": movie.get("description"),
                        "cast": movie.get("cast"),
                        "poster": movie.get("poster"),
                        "trailer": movie.get("trailer"),
                        "score": score,
                        "reasons": reasons,
                    }
                )

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_n]