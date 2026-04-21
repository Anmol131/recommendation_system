import re
from typing import Dict, List

from ai.recommenders.base_recommender import BaseRecommender
from ai.utils.db import get_collection


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

    def _safe_float(self, value, default: float = 0.0) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return default

    def _title_words(self, title: str) -> set:
        cleaned = re.sub(r"[^a-z0-9\s]", " ", title.lower())
        return set(cleaned.split())

    def recommend(
        self,
        query_data: Dict,
        intent: str = "general_search",
        top_n: int = 5
    ) -> List[Dict]:
        keywords = set(query_data.get("keywords", []))
        cleaned_query = query_data.get("cleaned_query", "")
        results = []

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
                },
            )
        )

        for movie in movies:
            score = 0
            reasons = []

            title = movie.get("title", "")
            title_lower = title.lower()
            genres_raw = movie.get("genres", "")
            genres = self._parse_genres(genres_raw)
            avg_rating = self._safe_float(movie.get("avgRating"), 0.0)
            rating_count = self._safe_float(movie.get("ratingCount"), 0.0)

            genre_matches = [genre for genre in genres if genre in keywords]
            if genre_matches:
                score += 30 * len(genre_matches)
                reasons.append(f"Matched genre: {', '.join(genre_matches)}")

            # Strong bonus for exact title phrase match
            if title_lower in cleaned_query:
                score += 40
                reasons.append("Exact title phrase matched")
            else:
                title_matches = self._title_words(title).intersection(keywords)
                if len(title_matches) >= 2:
                    score += 25 * len(title_matches)
                    reasons.append(
                        f"Matched multiple title words: {', '.join(sorted(title_matches))}"
                    )

            if intent == "top_results" and avg_rating >= 4.0:
                score += 15
                reasons.append("Boosted for high average rating")

            if avg_rating > 0:
                rating_bonus = int(avg_rating * 5)
                score += rating_bonus
                reasons.append("Included rating-based bonus")

            if rating_count >= 1000:
                score += 5
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
                        "score": score,
                        "reasons": reasons,
                    }
                )

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_n]