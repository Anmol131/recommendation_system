from typing import Dict, List, Optional

from ai.core.intent_detector import detect_intent
from ai.core.preprocessing import preprocess_query
from ai.recommenders.book_recommender import BookRecommender
from ai.recommenders.game_recommender import GameRecommender
from ai.recommenders.movie_recommender import MovieRecommender
from ai.recommenders.music_recommender import MusicRecommender
from ai.services.external_understanding_service import understand_query_externally


def _pick_content_type(query_data: Dict) -> Optional[str]:
    scores = query_data.get("content_type_scores", {})

    if scores:
        ranked_scores = sorted(
            [(content_type, score) for content_type, score in scores.items() if score > 0],
            key=lambda item: item[1],
            reverse=True,
        )

        if not ranked_scores:
            return None

        top_type, top_score = ranked_scores[0]
        second_score = ranked_scores[1][1] if len(ranked_scores) > 1 else 0

        if top_score < 2:
            return None

        if second_score == top_score:
            return None

        return top_type

    content_types = query_data.get("content_types", [])
    if len(content_types) == 1:
        return content_types[0]

    return None


def _should_enforce_strict_relevance(query_data: dict) -> bool:
    generic_words = {
        "movie", "movies",
        "book", "books",
        "game", "games",
        "music", "song", "songs", "track", "tracks",
        "artist", "artists",
        "recommend", "best", "top", "like", "similar",
        "listen", "playlist",
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
        "matched artist hint",
        "matched genre",
        "matched query genre",
        "matched semantic hint",
        "matched external hint",
        "matched requested platform",
        "matched multiple title words",
        "title phrase closely matched query",
        "matched tv/series intent",
        "same visual media type as reference",
        "related music fallback",
    ]

    return any(
        any(marker in reason for marker in strong_markers)
        for reason in reasons
    )


def _run_movie(query_data: Dict, intent: str, top_n: int) -> List[Dict]:
    return MovieRecommender().recommend(
        query_data=query_data,
        intent=intent,
        top_n=top_n,
    )


def _run_game(query_data: Dict, intent: str, top_n: int) -> List[Dict]:
    return GameRecommender().recommend(
        query_data=query_data,
        intent=intent,
        top_n=top_n,
    )


def _run_book(query_data: Dict, intent: str, top_n: int) -> List[Dict]:
    return BookRecommender().recommend(
        query_data=query_data,
        intent=intent,
        top_n=top_n,
    )


def _run_music(query_data: Dict, intent: str, top_n: int) -> List[Dict]:
    return MusicRecommender().recommend(
        query_data=query_data,
        intent=intent,
        top_n=top_n,
    )


def _result_identity(item: Dict) -> str:
    return str(
        item.get("movieId")
        or item.get("gameId")
        or item.get("isbn")
        or item.get("trackId")
        or item.get("title")
        or id(item)
    )


def _dedupe_and_sort(results: List[Dict], top_n: int) -> List[Dict]:
    unique = {}

    for item in results:
        key = f'{item.get("type", "unknown")}::{_result_identity(item)}'
        existing = unique.get(key)

        if existing is None or item.get("score", 0) > existing.get("score", 0):
            unique[key] = item

    final_items = list(unique.values())
    final_items.sort(key=lambda entry: entry.get("score", 0), reverse=True)
    return final_items[:top_n]


def _run_cross_domain_general_search(query_data: Dict, intent: str, top_n: int) -> List[Dict]:
    candidate_results: List[Dict] = []

    runners = [
        _run_movie,
        _run_book,
        _run_game,
        _run_music,
    ]

    for runner in runners:
        try:
            candidate_results.extend(runner(query_data, intent, top_n))
        except Exception:
            continue

    return _dedupe_and_sort(candidate_results, top_n)


def _tokenize_hint_values(values: List[str]) -> List[str]:
    words = []

    for value in values:
        if not value:
            continue

        normalized = (
            str(value)
            .replace("/", " ")
            .replace("-", " ")
            .replace(",", " ")
            .replace(";", " ")
            .replace("&", " ")
        )

        for part in normalized.split():
            cleaned = part.strip().lower()
            if cleaned:
                words.append(cleaned)

    return words


def _apply_external_understanding(
    original_query: str,
    local_query_data: Dict,
    local_intent: str,
    understanding: Dict,
) -> tuple[Dict, str]:
    if not understanding.get("used_external"):
        merged = dict(local_query_data)
        merged["external_understanding"] = understanding
        return merged, local_intent

    mapped_domain = str(understanding.get("mapped_domain", "unknown")).lower()
    resolved_entity = str(understanding.get("resolved_entity", "")).strip()
    resolved_entity_type = str(understanding.get("resolved_entity_type", "unknown")).lower()

    external_intent = str(understanding.get("intent") or "").strip() or local_intent

    # Do not allow weak external "general_search" to overwrite a useful local intent.
    if external_intent == "general_search" and local_intent != "general_search":
        effective_intent = local_intent
    else:
        effective_intent = external_intent

    effective_query = original_query

    if mapped_domain == "music" and resolved_entity_type == "artist" and resolved_entity:
        effective_query = f"best songs by {resolved_entity}"
        effective_intent = "top_results"

    elif mapped_domain == "book" and resolved_entity_type == "author" and resolved_entity:
        effective_query = f"best books by {resolved_entity}"
        effective_intent = "top_results"

    elif mapped_domain == "movie" and resolved_entity and resolved_entity_type in {
        "movie", "tv_series", "franchise"
    }:
        effective_query = f"recommend me movies like {resolved_entity}"
        effective_intent = "similar_content"

    elif mapped_domain == "book" and resolved_entity and resolved_entity_type in {
        "book", "franchise"
    }:
        effective_query = f"recommend me books like {resolved_entity}"
        effective_intent = "similar_content"

    elif mapped_domain == "game" and resolved_entity and resolved_entity_type in {
        "game", "franchise"
    }:
        effective_query = f"recommend me games like {resolved_entity}"
        effective_intent = "similar_content"

    elif mapped_domain == "music" and resolved_entity and resolved_entity_type in {
        "song", "album", "franchise"
    }:
        effective_query = f"recommend me songs like {resolved_entity}"
        effective_intent = "similar_content"

    merged_query_data = preprocess_query(effective_query)
    merged_query_data["external_understanding"] = understanding

    if mapped_domain in {"movie", "book", "game", "music"}:
        merged_query_data["content_types"] = [mapped_domain]
        scores = dict(merged_query_data.get("content_type_scores", {}))
        scores[mapped_domain] = max(int(scores.get(mapped_domain, 0)), 10)
        merged_query_data["content_type_scores"] = scores

    extra_keywords = set(str(k).lower() for k in merged_query_data.get("keywords", []))

    extra_keywords.update(_tokenize_hint_values(understanding.get("genres", [])))
    extra_keywords.update(_tokenize_hint_values(understanding.get("themes", [])))
    extra_keywords.update(_tokenize_hint_values(understanding.get("language_hints", [])))
    extra_keywords.update(_tokenize_hint_values(understanding.get("region_hints", [])))
    extra_keywords.update(_tokenize_hint_values(understanding.get("artist_hints", [])))
    extra_keywords.update(_tokenize_hint_values(understanding.get("author_hints", [])))
    extra_keywords.update(_tokenize_hint_values(understanding.get("director_hints", [])))

    if mapped_domain == "movie" and resolved_entity_type == "tv_series":
        extra_keywords.update({"tv", "series", "show"})

    if mapped_domain == "music":
        extra_keywords.update({"songs", "music"})

    if mapped_domain == "music" and resolved_entity_type == "artist":
        extra_keywords.update({"artist"})

    if mapped_domain == "book" and resolved_entity_type == "author":
        extra_keywords.update({"books", "author"})

    merged_query_data["keywords"] = sorted(extra_keywords)

    return merged_query_data, effective_intent


def _normalize_intent_after_understanding(
    query: str,
    query_data: Dict,
    intent: str,
) -> str:
    if intent != "general_search":
        return intent

    content_types = {
        str(content_type).lower()
        for content_type in query_data.get("content_types", [])
    }

    keywords = {
        str(keyword).lower()
        for keyword in query_data.get("keywords", [])
    }

    tokens = {
        str(token).lower()
        for token in query_data.get("tokens", [])
    }

    query_words = set(query.lower().replace("-", " ").split())
    all_terms = keywords | tokens | query_words

    broad_music_terms = {
        "song", "songs", "music", "track", "tracks", "playlist", "listen",
        "artist", "singer", "band",
    }

    broad_media_terms = {
        "movie", "movies", "film", "films",
        "book", "books",
        "game", "games",
    }

    if "music" in content_types and all_terms.intersection(broad_music_terms):
        understanding = query_data.get("external_understanding")
        if isinstance(understanding, dict):
            understanding["intent"] = "top_results"
        return "top_results"

    if content_types.intersection({"movie", "book", "game"}) and all_terms.intersection(broad_media_terms):
        understanding = query_data.get("external_understanding")
        if isinstance(understanding, dict):
            understanding["intent"] = "top_results"
        return "top_results"

    return intent


def run_pipeline(query: str, top_n: int = 5) -> Dict:
    local_query_data = preprocess_query(query)
    local_intent = detect_intent(query)

    external_understanding = understand_query_externally(query)
    query_data, intent = _apply_external_understanding(
        original_query=query,
        local_query_data=local_query_data,
        local_intent=local_intent,
        understanding=external_understanding,
    )

    intent = _normalize_intent_after_understanding(query, query_data, intent)

    content_type = _pick_content_type(query_data)
    results: List[Dict] = []

    if content_type == "movie":
        results = _run_movie(query_data, intent, top_n)
    elif content_type == "game":
        results = _run_game(query_data, intent, top_n)
    elif content_type == "book":
        results = _run_book(query_data, intent, top_n)
    elif content_type == "music":
        results = _run_music(query_data, intent, top_n)
    else:
        results = _run_cross_domain_general_search(query_data, intent, top_n)

    if _should_enforce_strict_relevance(query_data):
        results = [item for item in results if _has_real_relevance(item)]

    results = _dedupe_and_sort(results, top_n)

    return {
        "query": query,
        "original_query": query_data.get("original_query"),
        "display_query": query_data.get("display_query"),
        "cleaned_query": query_data.get("cleaned_query"),
        "tokens": query_data.get("tokens", []),
        "keywords": query_data.get("keywords", []),
        "content_type_scores": query_data.get("content_type_scores", {}),
        "content_types": query_data.get("content_types", []),
        "ambiguous_entity_phrase": query_data.get("ambiguous_entity_phrase", False),
        "intent": intent,
        "age_group": query_data.get("age_group"),
        "interest_mode": query_data.get("interest_mode"),
        "top_n": top_n,
        "understanding": query_data.get("external_understanding", external_understanding),
        "results": results,
    }