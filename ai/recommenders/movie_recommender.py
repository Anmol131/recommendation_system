import math
import os
import re
from typing import Dict, List, Optional, Set, Tuple

from pymongo import MongoClient


class MovieRecommender:
    """
    Movie recommender used by the AI pipeline.

    Main improvement in this version:
    - Uses external understanding more strongly for similar_content queries
    - Reduces false matches caused by literal title words like "Dark"
    - Prefers theme/tone/genre similarity over naive keyword overlap
    """

    GENERIC_QUERY_WORDS = {
        "movie",
        "movies",
        "film",
        "films",
        "tv",
        "show",
        "shows",
        "series",
        "best",
        "top",
        "recommend",
        "recommended",
        "like",
        "similar",
        "me",
    }

    ENTITY_STOPWORDS = {
        "the",
        "a",
        "an",
        "of",
        "and",
        "for",
        "to",
        "in",
        "on",
        "at",
        "with",
        "from",
        "part",
        "episode",
        "season",
    }

    GENRE_CANONICAL_MAP = {
        "sci fi": "science fiction",
        "sci-fi": "science fiction",
        "science fiction": "science fiction",
        "scifi": "science fiction",
        "mystery": "mystery",
        "thriller": "thriller",
        "drama": "drama",
        "fantasy": "fantasy",
        "adventure": "adventure",
        "action": "action",
        "crime": "crime",
        "romance": "romance",
        "war": "war",
        "animation": "animation",
        "comedy": "comedy",
        "horror": "horror",
    }

    # Stronger weights for specific genre identity, lower for generic genres.
    GENRE_WEIGHTS = {
        "science fiction": 14,
        "fantasy": 13,
        "mystery": 11,
        "thriller": 10,
        "crime": 6,
        "drama": 4,
        "adventure": 3,
        "action": 3,
        "war": 2,
        "romance": 2,
        "animation": 2,
        "comedy": 1,
        "horror": 6,
    }

    # Theme alias map used for strong semantic matching.
    THEME_ALIASES = {
        "political intrigue": {
            "political intrigue",
            "political",
            "intrigue",
            "betrayal",
            "alliance",
            "court",
            "ruler",
            "kingdom",
            "throne",
            "succession",
            "dynasty",
        },
        "power struggle": {
            "power struggle",
            "power",
            "struggle",
            "control",
            "dominance",
            "leadership",
            "factions",
            "civil war",
        },
        "war": {
            "war",
            "battle",
            "armies",
            "army",
            "siege",
            "rebellion",
            "conflict",
        },
        "dragons": {
            "dragon",
            "dragons",
            "mythical creature",
            "mythical creatures",
        },
        "medieval world": {
            "medieval",
            "castle",
            "kingdom",
            "sword",
            "sorcery",
            "knight",
            "throne",
            "fantasy world",
            "royal",
        },
        "ensemble cast": {
            "ensemble",
            "ensemble cast",
            "multiple protagonists",
            "many characters",
            "families",
            "factions",
        },
        "time travel": {
            "time travel",
            "time loop",
            "time machine",
            "temporal",
            "travel through time",
            "wormhole",
            "paradox",
        },
        "parallel timelines": {
            "parallel timelines",
            "parallel timeline",
            "timeline",
            "timelines",
            "alternate timeline",
            "alternate reality",
            "loop",
            "nonlinear",
        },
        "family secrets": {
            "family secret",
            "family secrets",
            "secret",
            "secrets",
            "generations",
            "parents",
            "children",
            "ancestry",
        },
        "missing persons": {
            "missing persons",
            "missing person",
            "disappearance",
            "vanished",
            "kidnapping",
            "lost child",
            "missing",
        },
        "small town mystery": {
            "small town",
            "town mystery",
            "local mystery",
            "investigation",
            "disappearance",
            "close-knit town",
        },
        "mind-bending narrative": {
            "mind bending",
            "mind-bending",
            "twist",
            "paradox",
            "complex narrative",
            "nonlinear",
            "layered mystery",
        },
        "dark atmosphere": {
            "bleak",
            "grim",
            "gloomy",
            "moody",
            "ominous",
            "brooding",
            "haunting",
            "atmospheric",
        },
    }

    def __init__(self):
        mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
        db_name = os.getenv("MONGO_DB_NAME", "recommendation_platform")

        self.client = MongoClient(mongo_uri)
        self.collection = self.client[db_name]["movies"]
        self._docs_cache: Optional[List[Dict]] = None

    # ---------------------------------------------------------------------
    # public API
    # ---------------------------------------------------------------------
    def recommend(self, query_data: Dict, intent: str, top_n: int = 5) -> List[Dict]:
        docs = self._load_docs()
        if not docs:
            return []

        understanding = query_data.get("external_understanding", {}) or {}

        scored_results = []
        for doc in docs:
            score, reasons = self._score_document(
                doc=doc,
                query_data=query_data,
                intent=intent,
                understanding=understanding,
            )

            if score <= 0:
                continue

            result = self._format_result(doc, score, reasons)
            scored_results.append(result)

        scored_results.sort(key=lambda item: item.get("score", 0), reverse=True)
        return scored_results[:top_n]

    # ---------------------------------------------------------------------
    # loading
    # ---------------------------------------------------------------------
    def _load_docs(self) -> List[Dict]:
        if self._docs_cache is not None:
            return self._docs_cache

        projection = {
            "_id": 0,
            "movieId": 1,
            "title": 1,
            "type": 1,
            "mediaType": 1,
            "displayType": 1,
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
            "director": 1,
            "keywords": 1,
        }

        try:
            self._docs_cache = list(self.collection.find({}, projection))
        except Exception:
            self._docs_cache = []

        return self._docs_cache

    # ---------------------------------------------------------------------
    # main scoring router
    # ---------------------------------------------------------------------
    def _score_document(
        self,
        doc: Dict,
        query_data: Dict,
        intent: str,
        understanding: Dict,
    ) -> Tuple[int, List[str]]:
        if intent == "similar_content":
            return self._score_similar_content(doc, query_data, understanding)

        if intent == "top_results":
            return self._score_top_results(doc, query_data)

        return self._score_general_search(doc, query_data)

    # ---------------------------------------------------------------------
    # helpers
    # ---------------------------------------------------------------------
    def _normalize_text(self, value: str) -> str:
        if not value:
            return ""
        value = value.lower().strip()
        value = value.replace("&", " and ")
        value = re.sub(r"[^a-z0-9\s\-]", " ", value)
        value = re.sub(r"\s+", " ", value)
        return value.strip()

    def _tokenize(self, value: str) -> List[str]:
        normalized = self._normalize_text(value)
        return [token for token in normalized.split() if token]

    def _canonical_genre(self, genre: str) -> str:
        normalized = self._normalize_text(genre)
        return self.GENRE_CANONICAL_MAP.get(normalized, normalized)

    def _canonical_genres(self, genres: List[str]) -> Set[str]:
        return {self._canonical_genre(genre) for genre in (genres or []) if genre}

    def _meaningful_entity_tokens(self, entity: str) -> Set[str]:
        tokens = set(self._tokenize(entity))
        return {
            token
            for token in tokens
            if token not in self.ENTITY_STOPWORDS
            and token not in self.GENERIC_QUERY_WORDS
            and len(token) > 1
        }

    def _rating_bonus(self, doc: Dict) -> Tuple[int, List[str]]:
        reasons = []

        raw_rating = doc.get("avgRating") or 0
        raw_count = doc.get("ratingCount") or 0

        try:
            rating = float(raw_rating)
        except Exception:
            rating = 0.0

        try:
            rating_count = int(raw_count)
        except Exception:
            rating_count = 0

        if rating <= 0:
            return 0, reasons

        # Handle both /5 and /10 datasets.
        rating_scale = 10.0 if rating > 5 else 5.0
        rating_norm = max(0.0, min(rating / rating_scale, 1.0))

        score = int(round(rating_norm * 18))
        if rating_norm >= 0.75:
            reasons.append("Boosted for high rating")

        if rating_count > 0:
            popularity_bonus = min(12, int(math.log10(rating_count + 1) * 4))
            score += popularity_bonus

            if rating_count >= 1000:
                reasons.append("Popular based on rating count")
            elif rating_count >= 100:
                reasons.append("Known based on rating count")

        return score, reasons

    def _base_movie_tokens(self, doc: Dict) -> Dict[str, Set[str]]:
        title = doc.get("title") or ""
        description = doc.get("description") or ""
        genres = doc.get("genres") or []
        keywords = doc.get("keywords") or []
        cast = doc.get("cast") or []
        director = doc.get("director") or ""

        title_tokens = set(self._tokenize(title))
        description_tokens = set(self._tokenize(description))
        genre_tokens = set()
        for genre in genres:
            genre_tokens.update(self._tokenize(str(genre)))

        keyword_tokens = set()
        for keyword in keywords:
            keyword_tokens.update(self._tokenize(str(keyword)))

        cast_tokens = set()
        for person in cast:
            cast_tokens.update(self._tokenize(str(person)))

        director_tokens = set(self._tokenize(director))

        all_tokens = (
            title_tokens
            | description_tokens
            | genre_tokens
            | keyword_tokens
            | cast_tokens
            | director_tokens
        )

        all_text = " ".join(
            [
                self._normalize_text(title),
                self._normalize_text(description),
                self._normalize_text(" ".join(genres)),
                self._normalize_text(" ".join(keywords)),
                self._normalize_text(" ".join(cast)),
                self._normalize_text(director),
            ]
        )

        return {
            "title_tokens": title_tokens,
            "description_tokens": description_tokens,
            "genre_tokens": genre_tokens,
            "keyword_tokens": keyword_tokens,
            "cast_tokens": cast_tokens,
            "director_tokens": director_tokens,
            "all_tokens": all_tokens,
            "all_text": all_text,
        }

    def _theme_terms(self, theme: str) -> Set[str]:
        normalized_theme = self._normalize_text(theme)
        aliases = self.THEME_ALIASES.get(normalized_theme, set())
        if aliases:
            return {self._normalize_text(alias) for alias in aliases if alias}
        return {normalized_theme}

    def _semantic_query_tokens(
        self,
        query_data: Dict,
        understanding: Dict,
    ) -> Set[str]:
        raw_keywords = {self._normalize_text(str(k)) for k in query_data.get("keywords", []) if k}
        resolved_entity = understanding.get("resolved_entity", "")
        entity_tokens = self._meaningful_entity_tokens(resolved_entity)

        cleaned = set()
        for token in raw_keywords:
            if not token:
                continue
            if token in self.GENERIC_QUERY_WORDS:
                continue
            if token in entity_tokens:
                continue
            if len(token) <= 1:
                continue
            cleaned.add(token)

        return cleaned

    # ---------------------------------------------------------------------
    # similar content scoring
    # ---------------------------------------------------------------------
    def _score_similar_content(
        self,
        doc: Dict,
        query_data: Dict,
        understanding: Dict,
    ) -> Tuple[int, List[str]]:
        reasons: List[str] = []
        score = 0

        movie_tokens = self._base_movie_tokens(doc)
        candidate_genres = self._canonical_genres(doc.get("genres") or [])

        resolved_entity = str(understanding.get("resolved_entity", "")).strip()
        resolved_entity_type = str(understanding.get("resolved_entity_type", "")).strip().lower()
        target_genres = {
            self._canonical_genre(genre)
            for genre in (understanding.get("genres") or [])
            if genre
        }
        target_themes = [theme for theme in (understanding.get("themes") or []) if theme]

        entity_tokens = self._meaningful_entity_tokens(resolved_entity)
        semantic_query_tokens = self._semantic_query_tokens(query_data, understanding)

        normalized_title = self._normalize_text(doc.get("title") or "")
        normalized_entity = self._normalize_text(resolved_entity)

        # Exclude exact same title when the resolved entity itself is in the movie DB.
        if normalized_entity and normalized_title == normalized_entity:
            return 0, []

        # --------------------------------------------------------------
        # 1. genre similarity (stronger than before)
        # --------------------------------------------------------------
        specific_genre_hits = 0
        generic_genre_hits = 0

        for genre in sorted(target_genres):
            if genre in candidate_genres:
                weight = self.GENRE_WEIGHTS.get(genre, 4)
                score += weight
                reasons.append(f"Matched target genre: {genre}")

                if weight >= 6:
                    specific_genre_hits += 1
                else:
                    generic_genre_hits += 1

        # --------------------------------------------------------------
        # 2. theme/tone similarity
        # --------------------------------------------------------------
        theme_hits = 0
        for theme in target_themes:
            theme_terms = self._theme_terms(theme)
            theme_matched = False

            for term in theme_terms:
                if not term:
                    continue

                # phrase match first
                if len(term.split()) > 1 and term in movie_tokens["all_text"]:
                    theme_matched = True
                    break

                # token match fallback
                term_tokens = set(self._tokenize(term))
                if term_tokens and term_tokens.issubset(movie_tokens["all_tokens"]):
                    theme_matched = True
                    break

            if theme_matched:
                theme_hits += 1
                score += 11
                reasons.append(f"Matched theme: {theme}")

        # --------------------------------------------------------------
        # 3. semantic keyword similarity (without entity-title pollution)
        # --------------------------------------------------------------
        semantic_hits = sorted(
            token for token in semantic_query_tokens if token in movie_tokens["all_tokens"]
        )
        if semantic_hits:
            semantic_bonus = min(18, len(semantic_hits) * 3)
            score += semantic_bonus
            reasons.append(
                f"Matched semantic keywords: {', '.join(semantic_hits[:4])}"
            )

        # --------------------------------------------------------------
        # 4. cast/director exact hint only if query explicitly contains them
        # --------------------------------------------------------------
        query_tokens_lower = {self._normalize_text(str(k)) for k in query_data.get("keywords", []) if k}
        cast_match_names = []
        for person in doc.get("cast") or []:
            person_norm = self._normalize_text(person)
            person_tokens = set(self._tokenize(person_norm))
            if person_tokens and person_tokens.issubset(query_tokens_lower):
                cast_match_names.append(person)

        if cast_match_names:
            score += 6
            reasons.append(f"Matched cast/person hint: {', '.join(cast_match_names[:2])}")

        director = doc.get("director") or ""
        director_tokens = set(self._tokenize(director))
        if director_tokens and director_tokens.issubset(query_tokens_lower):
            score += 5
            reasons.append(f"Matched director hint: {director}")

        # --------------------------------------------------------------
        # 5. literal title overlap penalty
        # --------------------------------------------------------------
        title_overlap = entity_tokens & movie_tokens["title_tokens"]
        has_real_semantic_match = (
            specific_genre_hits > 0
            or theme_hits > 0
            or len(semantic_hits) >= 2
        )

        if title_overlap and not has_real_semantic_match:
            score -= 26
            reasons.append("Penalized literal title-word overlap without thematic match")

        # Strong extra penalty for the classic Dark -> Dark Knight problem.
        if (
            resolved_entity_type in {"tv_series", "movie", "franchise"}
            and normalized_entity
            and title_overlap
            and specific_genre_hits == 0
            and theme_hits == 0
            and len(semantic_hits) == 0
        ):
            score -= 20
            reasons.append("Rejected title-only similarity")

        # --------------------------------------------------------------
        # 6. base rating/popularity bonus
        # --------------------------------------------------------------
        rating_bonus, rating_reasons = self._rating_bonus(doc)
        score += rating_bonus
        reasons.extend(rating_reasons)

        # --------------------------------------------------------------
        # 7. semantic quality gate
        # --------------------------------------------------------------
        # For externally resolved similar-content requests, require at least one
        # meaningful signal, not only generic overlap.
        used_external = bool(understanding.get("used_external"))
        if used_external:
            if specific_genre_hits == 0 and theme_hits == 0 and len(semantic_hits) < 2:
                return 0, []

        # Very low score => ignore
        if score < 12:
            return 0, []

        return int(score), self._unique_reasons(reasons)

    # ---------------------------------------------------------------------
    # top results scoring
    # ---------------------------------------------------------------------
    def _score_top_results(self, doc: Dict, query_data: Dict) -> Tuple[int, List[str]]:
        reasons: List[str] = []
        score = 0

        movie_tokens = self._base_movie_tokens(doc)
        candidate_genres = self._canonical_genres(doc.get("genres") or [])
        query_keywords = {
            self._normalize_text(str(k))
            for k in query_data.get("keywords", [])
            if k
        }

        genre_hits = sorted(
            keyword for keyword in query_keywords
            if self._canonical_genre(keyword) in candidate_genres
        )
        if genre_hits:
            score += len(genre_hits) * 8
            reasons.append(f"Matched query genre: {', '.join(genre_hits[:3])}")

        semantic_hits = sorted(
            token for token in query_keywords
            if token in movie_tokens["title_tokens"] or token in movie_tokens["keyword_tokens"]
        )
        if semantic_hits:
            score += min(12, len(semantic_hits) * 3)
            reasons.append(f"Matched title/keyword terms: {', '.join(semantic_hits[:4])}")

        rating_bonus, rating_reasons = self._rating_bonus(doc)
        score += rating_bonus
        reasons.extend(rating_reasons)

        if score < 8:
            return 0, []

        return int(score), self._unique_reasons(reasons)

    # ---------------------------------------------------------------------
    # general search scoring
    # ---------------------------------------------------------------------
    def _score_general_search(self, doc: Dict, query_data: Dict) -> Tuple[int, List[str]]:
        reasons: List[str] = []
        score = 0

        movie_tokens = self._base_movie_tokens(doc)
        query_keywords = {
            self._normalize_text(str(k))
            for k in query_data.get("keywords", [])
            if k
        }

        title_hits = sorted(token for token in query_keywords if token in movie_tokens["title_tokens"])
        if title_hits:
            score += min(18, len(title_hits) * 6)
            reasons.append(f"Matched title words: {', '.join(title_hits[:4])}")

        other_hits = sorted(
            token
            for token in query_keywords
            if token in movie_tokens["keyword_tokens"]
            or token in movie_tokens["description_tokens"]
            or token in movie_tokens["genre_tokens"]
        )
        if other_hits:
            score += min(14, len(other_hits) * 3)
            reasons.append(f"Matched search terms: {', '.join(other_hits[:4])}")

        rating_bonus, rating_reasons = self._rating_bonus(doc)
        score += rating_bonus
        reasons.extend(rating_reasons)

        if score < 8:
            return 0, []

        return int(score), self._unique_reasons(reasons)

    # ---------------------------------------------------------------------
    # format
    # ---------------------------------------------------------------------
    def _format_result(self, doc: Dict, score: int, reasons: List[str]) -> Dict:
        return {
            "movieId": doc.get("movieId"),
            "title": doc.get("title"),
            "type": "movie",
            "mediaType": doc.get("mediaType", "movie"),
            "displayType": doc.get("displayType", "Movie"),
            "year": doc.get("year"),
            "genres": doc.get("genres") or [],
            "avgRating": doc.get("avgRating"),
            "ratingCount": doc.get("ratingCount"),
            "tmdbId": doc.get("tmdbId"),
            "imdbId": doc.get("imdbId"),
            "description": doc.get("description"),
            "cast": doc.get("cast") or [],
            "poster": doc.get("poster"),
            "trailer": doc.get("trailer"),
            "director": doc.get("director"),
            "keywords": doc.get("keywords") or [],
            "score": int(score),
            "reasons": reasons,
        }

    def _unique_reasons(self, reasons: List[str]) -> List[str]:
        seen = set()
        unique = []
        for reason in reasons:
            if reason and reason not in seen:
                seen.add(reason)
                unique.append(reason)
        return unique[:8]