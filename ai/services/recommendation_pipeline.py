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