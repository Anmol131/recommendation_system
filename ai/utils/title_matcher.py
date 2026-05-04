"""
Title matching utility for finding exact items referenced in queries.

Supports:
- Exact title matching
- Fuzzy matching with similarity threshold
- Common title aliases (e.g., "COC" -> "Clash of Clans")
"""

import re
from difflib import get_close_matches
from typing import Dict, List, Optional, Set


# Common short names and aliases for titles
TITLE_ALIASES = {
    "coc": "clash of clans",
    "pubg": "pubg",
    "got": "game of thrones",
    "tlou": "the last of us",
    "gow": "god of war",
    "rdr": "red dead",
    "gta": "grand theft auto",
}

# Words to remove from queries for title extraction
QUERY_IGNORE_WORDS = {
    "recommend", "me", "movies", "books", "games", "music", "songs", "like",
    "similar", "best", "top", "action", "drama", "comedy", "thriller", "sci-fi",
    "science fiction", "fantasy", "horror", "animation", "adventure", "romance",
    "something", "the", "a", "an", "or", "and", "that", "this", "with", "from"
}


def normalize_title(title: str) -> str:
    """
    Normalize title for comparison:
    - lowercase
    - remove leading "The", "A", "An"
    - remove punctuation (keep alphanumerics and spaces)
    - trim extra spaces
    """
    if not title:
        return ""
    
    normalized = title.strip().lower()
    
    # Move leading articles to end (e.g., "The Godfather" -> "Godfather The")
    for article in ["the ", "a ", "an "]:
        if normalized.startswith(article):
            normalized = normalized[len(article):].strip() + " " + article.strip()
            break
    
    # Remove punctuation, keep only alphanumerics and spaces
    normalized = re.sub(r"[^\w\s]", " ", normalized, flags=re.UNICODE)
    
    # Collapse multiple spaces
    normalized = re.sub(r"\s+", " ", normalized).strip()
    
    return normalized


def extract_potential_title(cleaned_query: str) -> Optional[str]:
    """
    Extract potential title from query.
    
    Examples:
    - "games like Clash of Clans" -> "Clash of Clans"
    - "recommend me action movies like John Wick" -> "John Wick"
    - "similar to PUBG" -> "PUBG"
    """
    patterns = [
        r"like\s+([^,\.!?]*?)(?:\s+(?:and|or|in|for|on|with)|\s*$)",
        r"similar to\s+([^,\.!?]*?)(?:\s*$)",
        r"something like\s+([^,\.!?]*?)(?:\s*$)",
        r"related to\s+([^,\.!?]*?)(?:\s*$)",
    ]
    
    for pattern in patterns:
        match = re.search(pattern, cleaned_query, re.IGNORECASE)
        if match:
            potential_title = match.group(1).strip()
            # Remove trailing generic words
            words = potential_title.split()
            while words and words[-1].lower() in QUERY_IGNORE_WORDS:
                words.pop()
            
            if words:
                return " ".join(words)
    
    return None


def find_exact_match(
    query: str,
    titles_in_db: List[str],
    threshold: float = 0.85
) -> Optional[str]:
    """
    Find exact or close match for a title in the database.
    
    Steps:
    1. Check for exact normalized match
    2. Check for exact substring match
    3. Use fuzzy matching with get_close_matches
    
    Returns:
    - The matched title from database if found
    - None if no match
    """
    if not query or not titles_in_db:
        return None
    
    query_normalized = normalize_title(query)
    
    # Step 1: Check for exact normalized match
    for db_title in titles_in_db:
        if normalize_title(db_title) == query_normalized:
            return db_title
    
    # Step 2: Check for substring matches
    query_lower = query.lower()
    for db_title in titles_in_db:
        db_lower = db_title.lower()
        if query_lower in db_lower or db_lower in query_lower:
            return db_title
    
    # Step 3: Fuzzy matching
    close_matches = get_close_matches(
        query_normalized,
        [normalize_title(t) for t in titles_in_db],
        n=1,
        cutoff=threshold
    )
    
    if close_matches:
        matched_normalized = close_matches[0]
        for i, db_title in enumerate(titles_in_db):
            if normalize_title(db_title) == matched_normalized:
                return db_title
    
    return None


def resolve_alias(title: str) -> str:
    """
    Resolve common aliases to full titles.
    
    Examples:
    - "COC" -> "Clash of Clans"
    - "PUBG" -> "PUBG"
    """
    title_lower = title.lower().strip()
    return TITLE_ALIASES.get(title_lower, title)


def find_title_in_database(
    query: str,
    collection,
    title_field: str = "title"
) -> Optional[Dict]:
    """
    Find a title in the database matching the query.
    
    Process:
    1. Extract potential title from query
    2. Resolve aliases
    3. Find exact/fuzzy match in database
    4. Return the document if found
    """
    if not query:
        return None
    
    # Extract potential title from query
    potential_title = extract_potential_title(query)
    
    if not potential_title:
        return None
    
    # Resolve aliases
    potential_title = resolve_alias(potential_title)
    
    # Get all titles from database
    try:
        docs = list(collection.find({}, {title_field: 1}))
        db_titles = [doc.get(title_field, "") for doc in docs if doc.get(title_field)]
        
        # Find match
        matched_title = find_exact_match(potential_title, db_titles)
        
        if matched_title:
            # Return the document with this title
            return collection.find_one({title_field: matched_title})
    except Exception:
        return None
    
    return None
