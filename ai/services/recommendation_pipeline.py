from typing import Any, Dict, Optional

from ai.core.intent_detector import detect_intent
from ai.core.preprocessing import preprocess_query
from ai.recommenders.movie_recommender import MovieRecommender


def run_pipeline(
    query: str,
    age_group: Optional[str] = None,
    interest_mode: Optional[str] = None,
    top_n: int = 5
) -> Dict[str, Any]:
    query_data = preprocess_query(query)
    intent = detect_intent(query)

    results = []

    if "movie" in query_data["content_types"]:
        recommender = MovieRecommender()
        results = recommender.recommend(query_data, intent=intent, top_n=top_n)

    return {
        "query": query,
        "cleaned_query": query_data["cleaned_query"],
        "tokens": query_data["tokens"],
        "keywords": query_data["keywords"],
        "content_types": query_data["content_types"],
        "intent": intent,
        "age_group": age_group,
        "interest_mode": interest_mode,
        "top_n": top_n,
        "results": results
    }