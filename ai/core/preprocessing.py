import re
from typing import Dict, List

from ai.utils.constants import STOPWORDS, CONTENT_TYPE_KEYWORDS


def normalize_text(text: str) -> str:
    """
    Lowercase and clean the text.
    Keep letters, numbers, and spaces only.
    """
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
    return [token for token in tokens if token not in STOPWORDS and len(token) > 1]


def detect_content_types(tokens: List[str]) -> List[str]:
    """
    Detect whether the query is asking for movies, books, music, or games.
    """
    detected = []

    for content_type, keywords in CONTENT_TYPE_KEYWORDS.items():
        if any(token in keywords for token in tokens):
            detected.append(content_type)

    return detected


def preprocess_query(query: str) -> Dict:
    """
    Main preprocessing function.
    Returns a structured dictionary for later pipeline steps.
    """
    cleaned_query = normalize_text(query)
    tokens = tokenize(cleaned_query)
    keywords = remove_stopwords(tokens)
    content_types = detect_content_types(tokens)

    return {
        "original_query": query,
        "cleaned_query": cleaned_query,
        "tokens": tokens,
        "keywords": keywords,
        "content_types": content_types
    }