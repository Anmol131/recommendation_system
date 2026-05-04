import re
import time
from typing import Dict, List, Optional, Set

from ai.recommenders.base_recommender import BaseRecommender
from ai.utils.db import get_collection


STOPWORDS = {
    "a", "an", "the", "and", "or", "of", "in", "on", "at", "to", "for", "with",
    "by", "from", "is", "are", "was", "were", "be", "been", "being",
    "this", "that", "these", "those", "it", "its", "as", "into", "than",
    "me", "you", "your", "my", "our", "their", "like", "similar", "game",
    "games", "something", "related", "recommend", "best"
}


class GameRecommender(BaseRecommender):
    CACHE_TTL_SECONDS = 600
    _docs_cache: Optional[List[Dict]] = None
    _cache_expiry: float = 0.0

    def __init__(self):
        self.collection = get_collection("games")

    def get_cached_docs(self) -> List[Dict]:
        return self._load_docs()

    def clear_cache(self) -> None:
        self.__class__._docs_cache = None
        self.__class__._cache_expiry = 0.0

    def _is_cache_valid(self) -> bool:
        return (
            self.__class__._docs_cache is not None
            and self.__class__._cache_expiry > time.time()
        )

    def _load_docs(self) -> List[Dict]:
        if self._is_cache_valid():
            return self.__class__._docs_cache or []

        projection = {
            "_id": 0,
            "gameId": 1,
            "title": 1,
            "genres": 1,
            "platform": 1,
            "pcPlatform": 1,
            "releaseYear": 1,
            "image": 1,
            "developer": 1,
            "rating": 1,
            "totalReviews": 1,
            "recommendations": 1,
            "installs": 1,
            "source": 1,
            "description": 1,
            "enriched": 1,
        }

        try:
            docs = list(self.collection.find({}, projection))
        except Exception:
            docs = []

        self.__class__._docs_cache = docs
        self.__class__._cache_expiry = time.time() + self.CACHE_TTL_SECONDS
        return docs

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
            return [
                genre.strip().lower()
                for genre in re.split(r"[|,;/]+", genres_value)
                if genre.strip()
            ]

        return []

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

    def _title_words(self, title: str) -> Set[str]:
        cleaned = re.sub(r"[^a-z0-9\s]", " ", title.lower())
        return {word for word in cleaned.split() if word}

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

    def _find_reference_game(self, reference_title: str) -> Optional[Dict]:
        if not reference_title:
            return None

        reference_words = set(reference_title.split())

        games = self.get_cached_docs()

        best_match = None
        best_score = 0

        for game in games:
            title = game.get("title", "")
            title_words = self._title_words(title)
            overlap = len(title_words.intersection(reference_words))

            if overlap > best_score:
                best_score = overlap
                best_match = game

        return best_match if best_score > 0 else None

    def _detect_platform_preference(self, cleaned_query: str) -> Optional[str]:
        query = cleaned_query.lower()

        if "mobile" in query or "android" in query or "ios" in query:
            return "mobile"

        if "pc" in query or "computer" in query or "steam" in query:
            return "pc"

        return None

    def _normalized_rating(self, rating: float, source: Optional[str]) -> float:
        """
        Put ratings onto a roughly common 0-5 scale.
        - Google Play style ratings are already ~0-5
        - Steam ratings in this dataset are ~0-100 percentages
        """
        if rating <= 0:
            return 0.0

        if source == "steam" and rating > 5:
            return rating / 20.0

        return rating

    def recommend(
        self,
        query_data: Dict,
        intent: str = "general_search",
        top_n: int = 5
    ) -> List[Dict]:
        keywords = {str(k).lower() for k in query_data.get("keywords", [])}
        cleaned_query = query_data.get("cleaned_query", "")
        query_words = set(cleaned_query.split())
        platform_preference = self._detect_platform_preference(cleaned_query)

        results = []
        exact_match_result = None  # Will hold the exact matched game if found

        reference_game = None
        reference_genres = []
        reference_platform = None
        reference_source = None
        reference_developer = None
        reference_year = None

        if intent == "similar_content":
            reference_title = self._extract_reference_title(cleaned_query)
            if reference_title:
                reference_game = self._find_reference_game(reference_title)
                if reference_game:
                    reference_genres = self._parse_genres(reference_game.get("genres", []))
                    reference_platform = (
                        str(reference_game.get("platform")).strip().lower()
                        if reference_game.get("platform")
                        else None
                    )
                    reference_source = (
                        str(reference_game.get("source")).strip().lower()
                        if reference_game.get("source")
                        else None
                    )
                    reference_developer = (
                        str(reference_game.get("developer")).strip().lower()
                        if reference_game.get("developer")
                        else None
                    )
                    reference_year = reference_game.get("releaseYear")

        games = self.get_cached_docs()

        for game in games:
            score = 0
            reasons = []

            title = game.get("title", "")
            title_lower = title.lower()
            genres = self._parse_genres(game.get("genres", []))
            platform = (
                str(game.get("platform")).strip().lower()
                if game.get("platform")
                else None
            )
            source = (
                str(game.get("source")).strip().lower()
                if game.get("source")
                else None
            )
            developer = (
                str(game.get("developer")).strip().lower()
                if game.get("developer")
                else None
            )
            release_year = game.get("releaseYear")

            raw_rating = self._safe_float(game.get("rating"), 0.0)
            normalized_rating = self._normalized_rating(raw_rating, source)
            total_reviews = self._safe_int(game.get("totalReviews"), 0)
            recommendations = self._safe_int(game.get("recommendations"), 0)

            if platform_preference and platform != platform_preference:
                continue

            if intent == "similar_content" and reference_game:
                reference_game_id = reference_game.get("gameId")
                current_game_id = game.get("gameId")

                # Include exact match as first result
                if reference_game_id and current_game_id == reference_game_id:
                    exact_match_result = {
                        "gameId": reference_game.get("gameId"),
                        "title": reference_game.get("title", ""),
                        "type": "game",
                        "genres": self._parse_genres(reference_game.get("genres", [])),
                        "platform": reference_game.get("platform"),
                        "pcPlatform": reference_game.get("pcPlatform"),
                        "releaseYear": reference_game.get("releaseYear"),
                        "image": reference_game.get("image"),
                        "developer": reference_game.get("developer"),
                        "rating": reference_game.get("rating"),
                        "totalReviews": reference_game.get("totalReviews"),
                        "recommendations": reference_game.get("recommendations"),
                        "installs": reference_game.get("installs"),
                        "source": reference_game.get("source"),
                        "description": reference_game.get("description"),
                        "enriched": reference_game.get("enriched"),
                        "score": 10000,  # Very high score to put it first
                        "reasons": ["Exact title match for your query"],
                        "matchType": "exact",
                    }
                    continue

                if title_lower == str(reference_game.get("title", "")).lower():
                    continue

                if reference_platform and platform and platform != reference_platform:
                    continue

            query_genre_matches = [genre for genre in genres if genre in keywords]
            if query_genre_matches:
                score += 18 * len(query_genre_matches)
                reasons.append(f"Matched query genre: {', '.join(query_genre_matches)}")

            if platform_preference and platform == platform_preference:
                score += 25
                reasons.append(f"Matched requested platform: {platform}")

            if intent == "similar_content" and reference_game:
                overlapping_reference_genres = [
                    genre for genre in genres if genre in reference_genres
                ]
                overlap_count = len(overlapping_reference_genres)

                if overlap_count >= 2:
                    score += 50
                    reasons.append(
                        f"Strong genre overlap with reference: {', '.join(overlapping_reference_genres)}"
                    )
                elif overlap_count == 1:
                    score += 24
                    reasons.append(
                        f"Partial genre overlap with reference: {', '.join(overlapping_reference_genres)}"
                    )

                if reference_platform and platform and platform == reference_platform:
                    score += 35
                    reasons.append(f"Same platform as reference: {platform}")

                if reference_source and source and source == reference_source:
                    score += 20
                    reasons.append(f"Same source as reference: {source}")

                if reference_developer and developer and developer == reference_developer:
                    score += 20
                    reasons.append(f"Same developer as reference: {game.get('developer')}")

                if (
                    reference_year is not None
                    and release_year is not None
                    and isinstance(reference_year, int)
                    and isinstance(release_year, int)
                ):
                    year_diff = abs(release_year - reference_year)
                    if year_diff <= 2:
                        score += 8
                        reasons.append("Close release year to reference")
                    elif year_diff <= 5:
                        score += 4
                        reasons.append("Moderately close release year to reference")

            else:
                normalized_title_words = self._title_words(title)

                if len(normalized_title_words) >= 2 and normalized_title_words.issubset(query_words):
                    score += 20
                    reasons.append("Title phrase closely matched query")
                else:
                    title_matches = normalized_title_words.intersection(keywords)
                    if len(title_matches) >= 2:
                        score += 12 * len(title_matches)
                        reasons.append(
                            f"Matched multiple title words: {', '.join(sorted(title_matches))}"
                        )

            if intent == "top_results" and normalized_rating >= 4.0:
                score += 15
                reasons.append("Boosted for high rating")

            if normalized_rating > 0:
                rating_bonus = int(normalized_rating * 20) if intent != "similar_content" else int(normalized_rating * 10)
                score += rating_bonus
                reasons.append("Included normalized rating bonus")

            if total_reviews >= 1_000_000:
                score += 10 if intent != "similar_content" else 5
                reasons.append("Very popular based on review count")
            elif total_reviews >= 100_000:
                score += 6 if intent != "similar_content" else 3
                reasons.append("Popular based on review count")
            elif total_reviews >= 10_000:
                score += 3
                reasons.append("Known based on review count")

            if recommendations >= 100_000:
                score += 8
                reasons.append("Boosted by recommendation count")
            elif recommendations >= 10_000:
                score += 4
                reasons.append("Some recommendation traction")

            if score > 0:
                results.append(
                    {
                        "gameId": game.get("gameId"),
                        "title": title,
                        "type": "game",
                        "genres": genres,
                        "platform": game.get("platform"),
                        "pcPlatform": game.get("pcPlatform"),
                        "releaseYear": game.get("releaseYear"),
                        "image": game.get("image"),
                        "developer": game.get("developer"),
                        "rating": game.get("rating"),
                        "totalReviews": game.get("totalReviews"),
                        "recommendations": game.get("recommendations"),
                        "installs": game.get("installs"),
                        "source": game.get("source"),
                        "description": game.get("description"),
                        "enriched": game.get("enriched"),
                        "score": score,
                        "reasons": reasons,
                    }
                )

        results.sort(key=lambda x: x["score"], reverse=True)
        
        # Add exact match at the beginning if found
        if exact_match_result:
            # Remove any duplicate of the exact match from results
            results = [r for r in results if r.get("gameId") != exact_match_result.get("gameId")]
            results = [exact_match_result] + results
        
        return results[:top_n]