import json
import os
from typing import Dict

from openai import OpenAI


def _empty_understanding(query: str, error: str = "") -> Dict:
    return {
        "query": query,
        "intent": "general_search",
        "resolved_entity": "",
        "resolved_entity_type": "unknown",
        "mapped_domain": "unknown",
        "supported": False,
        "genres": [],
        "themes": [],
        "language_hints": [],
        "region_hints": [],
        "artist_hints": [],
        "author_hints": [],
        "director_hints": [],
        "confidence": 0.0,
        "explanation": error or "External understanding not available.",
        "used_external": False,
        "provider": "openai",
        "error": error,
    }


def _get_client() -> OpenAI | None:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    return OpenAI(api_key=api_key)


def _get_schema() -> Dict:
    return {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "query": {"type": "string"},
            "intent": {
                "type": "string",
                "enum": [
                    "similar_content",
                    "top_results",
                    "learning_content",
                    "general_search",
                ],
            },
            "resolved_entity": {"type": "string"},
            "resolved_entity_type": {
                "type": "string",
                "enum": [
                    "movie",
                    "tv_series",
                    "book",
                    "game",
                    "artist",
                    "author",
                    "song",
                    "album",
                    "franchise",
                    "person",
                    "unknown",
                ],
            },
            "mapped_domain": {
                "type": "string",
                "enum": ["movie", "book", "game", "music", "unknown"],
            },
            "supported": {"type": "boolean"},
            "genres": {
                "type": "array",
                "items": {"type": "string"},
            },
            "themes": {
                "type": "array",
                "items": {"type": "string"},
            },
            "language_hints": {
                "type": "array",
                "items": {"type": "string"},
            },
            "region_hints": {
                "type": "array",
                "items": {"type": "string"},
            },
            "artist_hints": {
                "type": "array",
                "items": {"type": "string"},
            },
            "author_hints": {
                "type": "array",
                "items": {"type": "string"},
            },
            "director_hints": {
                "type": "array",
                "items": {"type": "string"},
            },
            "confidence": {"type": "number"},
            "explanation": {"type": "string"},
        },
        "required": [
            "query",
            "intent",
            "resolved_entity",
            "resolved_entity_type",
            "mapped_domain",
            "supported",
            "genres",
            "themes",
            "language_hints",
            "region_hints",
            "artist_hints",
            "author_hints",
            "director_hints",
            "confidence",
            "explanation",
        ],
    }


def understand_query_externally(query: str) -> Dict:
    client = _get_client()
    if client is None:
        return _empty_understanding(query, "OPENAI_API_KEY is missing.")

    model = os.getenv("OPENAI_MODEL", "gpt-5.4")

    instructions = """
You are a query-understanding engine for a multimedia recommendation platform.

Supported recommendation domains are:
- movie  -> includes both movies and TV series
- book
- game
- music

Your job is NOT to recommend items.
Your job is to understand the user's query and return structured JSON only.

Rules:
1. If the query refers to a TV series, map it to "movie" domain.
2. If the query refers to an artist or singer, map it to "music".
3. If the query refers to an author or writer, map it to "book".
4. If the query refers to a specific title, franchise, item, or person and the user likely wants similar things, use "similar_content".
5. If the user is asking for best/top items, use "top_results".
6. If the user is asking to learn, use "learning_content".
7. Otherwise use "general_search".
8. Return useful genres, themes, language hints, region hints, and person hints that can help a local recommender.
9. Be concise, practical, and structured.
10. Output only valid JSON matching the schema.
"""

    try:
        response = client.responses.create(
            model=model,
            instructions=instructions,
            input=f"User query: {query}",
            text={
                "format": {
                    "type": "json_schema",
                    "name": "query_understanding",
                    "schema": _get_schema(),
                    "strict": True,
                }
            },
        )

        data = json.loads(response.output_text)
        data["used_external"] = True
        data["provider"] = "openai"
        data["error"] = ""
        return data

    except Exception as exc:
        return _empty_understanding(query, str(exc))