import re
from typing import Dict, List

from ai.utils.constants import STOPWORDS, CONTENT_TYPE_KEYWORDS

BLOCKED_QUERY_TOKENS = {
    "script",
    "alert",
    "ne",
    "gt",
    "lt",
    "regex",
    "function",
    "onclick",
    "html",
    "body",
    "iframe",
    "select",
    "drop",
    "insert",
    "update",
    "delete",
}


SINGULAR_MEDIA_TERMS = {
    "movie",
    "film",
    "book",
    "game",
    "song",
    "track",
    "music",
}

PLURAL_MEDIA_TERMS = {
    "movies",
    "films",
    "books",
    "games",
    "songs",
    "tracks",
}

CONNECTOR_WORDS = {
    "of",
    "the",
    "a",
    "an",
    "and",
    "to",
    "for",
    "in",
    "on",
    "with",
}

EXPLICIT_CONTEXT_WORDS = {
    "best",
    "top",
    "popular",
    "recommend",
    "recommended",
    "recommendation",
    "recommendations",
    "like",
    "similar",
    "similarity",
    "find",
    "search",
    "show",
    "by",
    "about",
}


def sanitize_query(text: str) -> str:
    """Remove unsafe HTML, operator tokens, regex noise, and blocked keywords."""
    if not text:
        return ""

    text = str(text)

    # Remove script tags and payload entirely.
    text = re.sub(r'(?is)<script.*?>.*?</script>', " ", text)
    # Remove remaining HTML tags.
    text = re.sub(r'(?is)<[^>]+>', " ", text)

    # Remove operator-like tokens and JSON-looking fragments.
    text = re.sub(r'\$[a-zA-Z_][a-zA-Z0-9_]*\b', " ", text)
    text = re.sub(r'\b(?:false|true|null)\b', " ", text, flags=re.IGNORECASE)

    # Remove blocked keywords and suspicious tokens.
    text = re.sub(
        r'(?i)\b(?:script|alert|ne|gt|lt|regex|function|onclick|html|body|iframe|select|drop|insert|update|delete)\b',
        " ",
        text,
    )

    # Remove commonly abused regex fragments and punctuation-only expressions.
    text = re.sub(r'\(\s*[a-z0-9]+\s*\+\s*\)\+', " ", text, flags=re.IGNORECASE)
    text = re.sub(r'\[\s*\]', " ", text)
    text = re.sub(r'\{\s*\}', " ", text)
    text = re.sub(r'\.\*', " ", text)
    text = re.sub(r'[\[\]\{\}\(\)\|\\/\^\$\*\+\?\.<>=:;"\'`~]', " ", text)

    text = re.sub(r"\s+", " ", text).strip()
    return text


def normalize_text(text: str) -> str:
    """
    Lowercase and clean the text.
    Keep letters, numbers, and spaces only.
    """
    text = sanitize_query(text)
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text


def tokenize(text: str) -> List[str]:
    """
    Split text into tokens.
    """
    return text.split()


def remove_stopwords(tokens: List[str]) -> List[str]:
    """
    Remove common words that do not add recommendation value.
    """
    return [
        token
        for token in tokens
        if token not in STOPWORDS
        and token not in BLOCKED_QUERY_TOKENS
        and len(token) > 1
    ]


def _normalized_keyword_map() -> Dict[str, set]:
    return {
        content_type: {str(keyword).lower() for keyword in keywords}
        for content_type, keywords in CONTENT_TYPE_KEYWORDS.items()
    }


def _score_token_for_content_type(
    token: str,
    prev_token: str,
    next_token: str,
    keyword_set: set,
) -> int:
    if token not in keyword_set:
        return 0

    if token in PLURAL_MEDIA_TERMS:
        return 3

    if token in SINGULAR_MEDIA_TERMS:
        if next_token in CONNECTOR_WORDS:
            return 0

        if prev_token in EXPLICIT_CONTEXT_WORDS or next_token in EXPLICIT_CONTEXT_WORDS:
            return 3

        if prev_token and prev_token not in STOPWORDS and prev_token not in CONNECTOR_WORDS:
            return 2

        if next_token and next_token not in STOPWORDS and next_token not in CONNECTOR_WORDS:
            return 2

        return 0

    return 3


def build_content_type_scores(tokens: List[str]) -> Dict[str, int]:
    """
    Build confidence scores for each content type instead of assigning a type
    too early from a single token.
    """
    keyword_map = _normalized_keyword_map()
    scores = {content_type: 0 for content_type in keyword_map.keys()}

    for index, token in enumerate(tokens):
        prev_token = tokens[index - 1] if index > 0 else ""
        next_token = tokens[index + 1] if index + 1 < len(tokens) else ""

        for content_type, keyword_set in keyword_map.items():
            scores[content_type] += _score_token_for_content_type(
                token=token,
                prev_token=prev_token,
                next_token=next_token,
                keyword_set=keyword_set,
            )

    return scores


def detect_content_types(content_type_scores: Dict[str, int], minimum_score: int = 2) -> List[str]:
    """
    Detect content types only when confidence is strong enough.
    """
    return [
        content_type
        for content_type, score in content_type_scores.items()
        if score >= minimum_score
    ]


def looks_like_ambiguous_media_phrase(tokens: List[str]) -> bool:
    """
    Detect phrases like 'game of thrones' where a singular media word is more
    likely part of a title/entity phrase than a real request for that domain.
    """
    if len(tokens) < 3:
        return False

    first = tokens[0]
    second = tokens[1]

    if first in SINGULAR_MEDIA_TERMS and second in CONNECTOR_WORDS:
        return True

    return False


def preprocess_query(query: str) -> Dict:
    """
    Main preprocessing function.
    Returns a structured dictionary for later pipeline steps.
    """
    display_query = sanitize_query(query)
    cleaned_query = normalize_text(query)
    tokens = tokenize(cleaned_query)
    keywords = remove_stopwords(tokens)
    content_type_scores = build_content_type_scores(tokens)
    content_types = detect_content_types(content_type_scores)
    ambiguous_entity_phrase = looks_like_ambiguous_media_phrase(tokens)

    return {
        "original_query": query,
        "display_query": display_query,
        "cleaned_query": cleaned_query,
        "tokens": tokens,
        "keywords": keywords,
        "content_type_scores": content_type_scores,
        "content_types": content_types,
        "ambiguous_entity_phrase": ambiguous_entity_phrase,
    }