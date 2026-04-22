STOPWORDS = {
    "a", "an", "the", "is", "are", "am", "was", "were", "be", "been",
    "to", "of", "for", "in", "on", "at", "by", "with", "about",
    "and", "or", "but", "if", "then", "so", "than",
    "i", "me", "my", "you", "your", "we", "our", "they", "their",
    "this", "that", "these", "those",
    "please", "show", "give", "find", "recommend", "suggest", "want",
    "some", "any", "all", "from", "as", "it", "into",
    "like", "best", "top", "similar", "something", "related"
}

CONTENT_TYPE_KEYWORDS = {
    "movie": {
        "movie", "movies", "film", "films", "cinema",
        "tv", "television", "series", "show", "shows",
        "anime", "episode", "episodes", "season", "seasons",
        "webseries", "web-series"
    },
    "book": {"book", "books", "novel", "novels", "read", "reading", "author", "authors"},
    "music": {"music", "song", "songs", "album", "albums", "track", "tracks", "singer", "singers", "artist", "artists"},
    "game": {"game", "games", "gaming", "play", "played", "gamer", "gamers"}
}