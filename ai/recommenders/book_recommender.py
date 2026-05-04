import re
import time
from typing import Dict, List, Optional, Set

from ai.recommenders.base_recommender import BaseRecommender
from ai.utils.db import get_collection


STOPWORDS = {
    "a", "an", "the", "and", "or", "of", "in", "on", "at", "to", "for", "with",
    "by", "from", "is", "are", "was", "were", "be", "been", "being",
    "this", "that", "these", "those", "it", "its", "as", "into", "than",
    "me", "you", "your", "my", "our", "their", "like", "similar", "book",
    "books", "something", "related", "recommend", "best", "novel", "novels",
    "read"
}


class BookRecommender(BaseRecommender):
    CACHE_TTL_SECONDS = 600
    _docs_cache: Optional[List[Dict]] = None
    _cache_expiry: float = 0.0

    def __init__(self):
        self.collection = get_collection("books")

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
            "isbn": 1,
            "title": 1,
            "author": 1,
            "year": 1,
            "publisher": 1,
            "cover": 1,
            "avgRating": 1,
            "ratingCount": 1,
            "description": 1,
            "pageCount": 1,
            "lang": 1,
            "categories": 1,
            "enriched": 1,
        }

        try:
            docs = list(self.collection.find({}, projection))
        except Exception:
            docs = []

        self.__class__._docs_cache = docs
        self.__class__._cache_expiry = time.time() + self.CACHE_TTL_SECONDS
        return docs

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

    def _text_words(self, text: str) -> Set[str]:
        if not text:
            return set()

        cleaned = re.sub(r"[^a-z0-9\s]", " ", text.lower())
        return {
            word for word in cleaned.split()
            if len(word) > 2 and word not in STOPWORDS
        }

    def _parse_categories(self, categories_value) -> List[str]:
        if not categories_value:
            return []

        if isinstance(categories_value, list):
            return [
                str(category).strip().lower()
                for category in categories_value
                if str(category).strip()
            ]

        if isinstance(categories_value, str):
            return [
                category.strip().lower()
                for category in re.split(r"[|,;/]+", categories_value)
                if category.strip()
            ]

        return []

    def _category_words(self, categories_list: List[str]) -> Set[str]:
        words = set()
        for category in categories_list:
            words.update(self._text_words(category))
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

    def _find_reference_book(self, reference_title: str) -> Optional[Dict]:
        if not reference_title:
            return None

        reference_words = set(reference_title.split())

        books = self.get_cached_docs()

        best_match = None
        best_score = 0

        for book in books:
            title = book.get("title", "")
            title_words = self._title_words(title)
            overlap = len(title_words.intersection(reference_words))

            if overlap > best_score:
                best_score = overlap
                best_match = book

        return best_match if best_score > 0 else None

    def _extract_author_name(self, cleaned_query: str) -> Optional[str]:
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
        exact_match_result = None  # Will hold the exact matched book if found

        reference_book = None
        reference_author = None
        reference_publisher = None
        reference_year = None
        reference_categories = []
        reference_category_words = set()
        reference_description_words = set()

        explicit_author_query = self._extract_author_name(cleaned_query)

        if intent == "similar_content":
            reference_title = self._extract_reference_title(cleaned_query)
            if reference_title:
                reference_book = self._find_reference_book(reference_title)
                if reference_book:
                    reference_author = (
                        str(reference_book.get("author")).strip().lower()
                        if reference_book.get("author")
                        else None
                    )
                    reference_publisher = (
                        str(reference_book.get("publisher")).strip().lower()
                        if reference_book.get("publisher")
                        else None
                    )
                    reference_year = reference_book.get("year")
                    reference_categories = self._parse_categories(reference_book.get("categories", []))
                    reference_category_words = self._category_words(reference_categories)
                    reference_description_words = self._text_words(
                        reference_book.get("description", "") or ""
                    )

        books = self.get_cached_docs()

        for book in books:
            score = 0
            reasons = []

            title = book.get("title", "")
            title_lower = title.lower()
            author = str(book.get("author")).strip().lower() if book.get("author") else None
            publisher = str(book.get("publisher")).strip().lower() if book.get("publisher") else None
            year = book.get("year")
            description = book.get("description", "") or ""
            categories = self._parse_categories(book.get("categories", []))
            category_words = self._category_words(categories)
            description_words = self._text_words(description)

            avg_rating = self._safe_float(book.get("avgRating"), 0.0)
            rating_count = self._safe_int(book.get("ratingCount"), 0)

            if intent == "similar_content" and reference_book:
                reference_isbn = reference_book.get("isbn")
                current_isbn = book.get("isbn")

                # Include exact match as first result
                if reference_isbn and current_isbn == reference_isbn:
                    exact_match_result = {
                        "isbn": reference_book.get("isbn"),
                        "title": reference_book.get("title", ""),
                        "type": "book",
                        "author": reference_book.get("author"),
                        "year": reference_book.get("year"),
                        "publisher": reference_book.get("publisher"),
                        "cover": reference_book.get("cover"),
                        "avgRating": reference_book.get("avgRating"),
                        "ratingCount": reference_book.get("ratingCount"),
                        "description": reference_book.get("description"),
                        "pageCount": reference_book.get("pageCount"),
                        "lang": reference_book.get("lang"),
                        "categories": reference_book.get("categories", []),
                        "enriched": reference_book.get("enriched"),
                        "score": 10000,  # Very high score to put it first
                        "reasons": ["Exact title match for your query"],
                        "matchType": "exact",
                    }
                    continue

                if title_lower == str(reference_book.get("title", "")).lower():
                    continue

            normalized_title_words = self._title_words(title)

            title_matches = normalized_title_words.intersection(keywords)
            if len(title_matches) >= 2:
                score += 18 * len(title_matches)
                reasons.append(
                    f"Matched multiple title words: {', '.join(sorted(title_matches))}"
                )
            elif len(normalized_title_words) >= 2 and normalized_title_words.issubset(query_words):
                score += 20
                reasons.append("Title phrase closely matched query")

            query_category_overlap = category_words.intersection(keywords)
            if len(query_category_overlap) >= 1:
                score += 35 * len(query_category_overlap)
                reasons.append(
                    f"Matched category: {', '.join(sorted(query_category_overlap))}"
                )

            if explicit_author_query and author:
                explicit_author_words = self._text_words(explicit_author_query)
                author_words = self._text_words(author)
                overlap = explicit_author_words.intersection(author_words)

                if overlap:
                    score += 35
                    reasons.append(f"Matched author: {book.get('author')}")

            if intent == "similar_content" and reference_book:
                if reference_author and author and author == reference_author:
                    score += 40
                    reasons.append(f"Same author as reference: {book.get('author')}")

                if reference_publisher and publisher and publisher == reference_publisher:
                    score += 10
                    reasons.append(f"Same publisher as reference: {book.get('publisher')}")

                ref_cat_overlap = category_words.intersection(reference_category_words)
                if len(ref_cat_overlap) >= 2:
                    score += 35
                    reasons.append("Strong category overlap with reference")
                elif len(ref_cat_overlap) == 1:
                    score += 18
                    reasons.append("Partial category overlap with reference")

                desc_overlap = description_words.intersection(reference_description_words)
                if len(desc_overlap) >= 5:
                    score += 20
                    reasons.append("Strong description similarity to reference")
                elif len(desc_overlap) >= 3:
                    score += 10
                    reasons.append("Moderate description similarity to reference")

                if (
                    reference_year is not None
                    and year is not None
                    and isinstance(reference_year, int)
                    and isinstance(year, int)
                ):
                    year_diff = abs(year - reference_year)
                    if year_diff <= 5:
                        score += 8
                        reasons.append("Close publication year to reference")
                    elif year_diff <= 15:
                        score += 4
                        reasons.append("Moderately close publication year to reference")

            if intent == "top_results" and avg_rating >= 8.0:
                score += 10
                reasons.append("Boosted for high rating")

            if avg_rating > 0:
                rating_bonus = int(avg_rating * 3) if intent != "similar_content" else int(avg_rating * 2)
                score += rating_bonus
                reasons.append("Included rating-based bonus")

            if rating_count >= 10000:
                score += 20 if intent != "similar_content" else 10
                reasons.append("Very popular based on rating count")
            elif rating_count >= 1000:
                score += 12 if intent != "similar_content" else 6
                reasons.append("Popular based on rating count")
            elif rating_count >= 100:
                score += 6
                reasons.append("Known based on rating count")
            elif rating_count < 10:
                score -= 8
                reasons.append("Small rating sample penalty")

            if book.get("enriched"):
                score += 5
                reasons.append("Boosted for enriched metadata")

            if score > 0:
                results.append(
                    {
                        "isbn": book.get("isbn"),
                        "title": title,
                        "type": "book",
                        "author": book.get("author"),
                        "year": book.get("year"),
                        "publisher": book.get("publisher"),
                        "cover": book.get("cover"),
                        "avgRating": book.get("avgRating"),
                        "ratingCount": book.get("ratingCount"),
                        "description": book.get("description"),
                        "pageCount": book.get("pageCount"),
                        "lang": book.get("lang"),
                        "categories": book.get("categories", []),
                        "enriched": book.get("enriched"),
                        "score": score,
                        "reasons": reasons,
                    }
                )

        results.sort(key=lambda x: x["score"], reverse=True)
        
        # Add exact match at the beginning if found
        if exact_match_result:
            # Remove any duplicate of the exact match from results
            results = [r for r in results if r.get("isbn") != exact_match_result.get("isbn")]
            results = [exact_match_result] + results
        
        return results[:top_n]