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

Your job is NOT to recommend final database items.
Your job is to understand the user's query and return structured JSON only.

Rules:
1. If the query refers to a TV series, map it to "movie" domain.
2. If the query refers to an artist, singer, band, song, album, or music style, map it to "music".
3. If the query refers to an author or writer, map it to "book".
4. If the query refers to a game title, game franchise, platform, or gameplay style, map it to "game".
5. If the query refers to a movie, film, TV series, actor/director context, or visual story style, map it to "movie".
6. If the query refers to a specific title, franchise, item, song, game, movie, book, artist, or author and the user likely wants related items, use "similar_content".
7. If the user asks for best, top, popular, recommended, or broadly asks for media items in a genre, language, country, region, mood, platform, or category, use "top_results".
8. If the user asks to learn, study, practice, or find tutorials, use "learning_content".
9. Only use "general_search" when the query clearly does not ask for recommendations, rankings, similar items, or learning content.
10. For broad music queries involving any language, country, region, scene, culture, or style, fill language_hints and region_hints when possible.
11. For broad music queries, include useful artist_hints when reasonably known. Do not hard-code one language or one country; adapt to the query.
12. For artist queries, include artist_hints with the resolved artist and include genres/themes that can help fallback matching.
13. Be concise, practical, and structured.
14. Output only valid JSON matching the schema.
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