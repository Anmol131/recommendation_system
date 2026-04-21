from typing import Dict, List, Optional

from ai.core.intent_detector import detect_intent
from ai.core.preprocessing import preprocess_query
from ai.recommenders.book_recommender import BookRecommender
from ai.recommenders.game_recommender import GameRecommender
from ai.recommenders.movie_recommender import MovieRecommender
from ai.recommenders.music_recommender import MusicRecommender


def _pick_content_type(content_types: List[str]) -> Optional[str]:
    if not content_types:
        return None

    for preferred in ["movie", "game", "book", "music"]:
        if preferred in content_types:
            return preferred

    return content_types[0]


def _should_enforce_strict_relevance(query_data: dict) -> bool:
    generic_words = {
        "movie", "movies",
        "book", "books",
        "game", "games",
        "music", "song", "songs", "track", "tracks",
        "artist", "artists",
        "recommend", "best", "top", "like", "similar",
    }

    keywords = {str(k).lower() for k in query_data.get("keywords", [])}
    meaningful_keywords = {k for k in keywords if k not in generic_words}

    return len(meaningful_keywords) > 0


def _has_real_relevance(result: dict) -> bool:
    reasons = [str(reason).lower() for reason in result.get("reasons", [])]

    if not reasons:
        return False

    strong_markers = [
        "matched ",
        "same ",
        "shared ",
        "strong ",
        "partial ",
        "related ",
        "description similarity",
        "keyword similarity",
        "close publication year",
        "moderately close publication year",
        "platform as reference",
        "source as reference",
        "developer as reference",
        "artist as reference",
        "author as reference",
        "publisher as reference",
        "matched category",
        "matched artist",
        "matched author",
        "matched genre",
        "matched query genre",
        "matched requested platform",
        "matched multiple title words",
        "title phrase closely matched query",
    ]

    return any(
        any(marker in reason for marker in strong_markers)
        for reason in reasons
    )


def run_pipeline(query: str, top_n: int = 5) -> Dict:
    query_data = preprocess_query(query)
    intent = detect_intent(query)

    content_type = _pick_content_type(query_data.get("content_types", []))
    results = []

    if content_type == "movie":
        results = MovieRecommender().recommend(
            query_data=query_data,
            intent=intent,
            top_n=top_n,
        )
    elif content_type == "game":
        results = GameRecommender().recommend(
            query_data=query_data,
            intent=intent,
            top_n=top_n,
        )
    elif content_type == "book":
        results = BookRecommender().recommend(
            query_data=query_data,
            intent=intent,
            top_n=top_n,
        )
    elif content_type == "music":
        results = MusicRecommender().recommend(
            query_data=query_data,
            intent=intent,
            top_n=top_n,
        )

    if _should_enforce_strict_relevance(query_data):
        results = [item for item in results if _has_real_relevance(item)]

    return {
        "query": query,
        "cleaned_query": query_data.get("cleaned_query"),
        "tokens": query_data.get("tokens", []),
        "keywords": query_data.get("keywords", []),
        "content_types": query_data.get("content_types", []),
        "intent": intent,
        "age_group": query_data.get("age_group"),
        "interest_mode": query_data.get("interest_mode"),
        "top_n": top_n,
        "results": results,
    }