SIMILAR_PATTERNS = [
    "like",
    "similar to",
    "something like",
    "related to",
]

TOP_PATTERNS = [
    "best",
    "top",
    "highest rated",
    "popular",
    "recommend",
    "suggest",
]

LEARNING_PATTERNS = [
    "learn",
    "study",
    "educational",
    "for beginners",
    "tutorial",
]

BROAD_MEDIA_TERMS = {
    "movie", "movies", "film", "films",
    "book", "books", "novel", "novels",
    "game", "games",
    "music", "song", "songs", "track", "tracks",
    "artist", "artists", "singer", "singers",
    "playlist", "listen",
}


def detect_intent(query: str) -> str:
    """
    Detect user intent using simple rule-based pattern matching.

    Broad media queries such as:
    - Nepali songs
    - Korean movies
    - fantasy books
    - horror games
    should be treated as top_results because the user expects recommendations.
    """
    q = query.lower().strip()
    words = set(q.replace("-", " ").split())

    for pattern in SIMILAR_PATTERNS:
        if pattern in q:
            return "similar_content"

    for pattern in TOP_PATTERNS:
        if pattern in q:
            return "top_results"

    for pattern in LEARNING_PATTERNS:
        if pattern in q:
            return "learning_content"

    if words.intersection(BROAD_MEDIA_TERMS):
        return "top_results"

    return "general_search"