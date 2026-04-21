from typing import Dict


SIMILAR_PATTERNS = [
    "like",
    "similar to",
    "something like",
    "related to"
]

TOP_PATTERNS = [
    "best",
    "top",
    "highest rated",
    "popular"
]

LEARNING_PATTERNS = [
    "learn",
    "study",
    "educational",
    "for beginners",
    "tutorial"
]


def detect_intent(query: str) -> str:
    """
    Detect user intent using simple rule-based pattern matching.
    """
    q = query.lower().strip()

    for pattern in SIMILAR_PATTERNS:
        if pattern in q:
            return "similar_content"

    for pattern in TOP_PATTERNS:
        if pattern in q:
            return "top_results"

    for pattern in LEARNING_PATTERNS:
        if pattern in q:
            return "learning_content"

    return "general_search"