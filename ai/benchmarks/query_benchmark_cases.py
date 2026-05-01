BENCHMARK_CASES = [
    # ---------------------------------------------------------
    # MOVIES / TV -> movie domain
    # ---------------------------------------------------------
    {
        "query": "game of thrones",
        "expected_domain": "movie",
        "expected_intent": "similar_content",
        "must_not_be_empty": True,
    },
    {
        "query": "tv shows like dark",
        "expected_domain": "movie",
        "expected_intent": "similar_content",
        "must_not_be_empty": True,
    },
    {
        "query": "recommend me action movies like john wick",
        "expected_domain": "movie",
        "expected_intent": "similar_content",
        "must_not_be_empty": True,
    },
    {
        "query": "best sci fi movies",
        "expected_domain": "movie",
        "expected_intent": "top_results",
        "must_not_be_empty": True,
    },
    {
        "query": "best korean thriller movies",
        "expected_domain": "movie",
        "expected_intent": "top_results",
        "must_not_be_empty": True,
    },
    {
        "query": "movies like interstellar",
        "expected_domain": "movie",
        "expected_intent": "similar_content",
        "must_not_be_empty": True,
    },

    # ---------------------------------------------------------
    # BOOKS
    # ---------------------------------------------------------
    {
        "query": "best fantasy books",
        "expected_domain": "book",
        "expected_intent": "top_results",
        "must_not_be_empty": True,
    },
    {
        "query": "recommend me books like lord of the rings",
        "expected_domain": "book",
        "expected_intent": "similar_content",
        "must_not_be_empty": True,
    },
    {
        "query": "best books by agatha christie",
        "expected_domain": "book",
        "expected_intent": "top_results",
        "must_not_be_empty": True,
    },
    {
        "query": "books like harry potter",
        "expected_domain": "book",
        "expected_intent": "similar_content",
        "must_not_be_empty": True,
    },
    {
        "query": "best self help books",
        "expected_domain": "book",
        "expected_intent": "top_results",
        "must_not_be_empty": True,
    },
    {
        "query": "books by murakami",
        "expected_domain": "book",
        "expected_intent": "top_results",
        "must_not_be_empty": True,
    },

    # ---------------------------------------------------------
    # MUSIC
    # ---------------------------------------------------------
    {
        "query": "purna rai",
        "expected_domain": "music",
        "expected_intent": "top_results",
        "must_not_be_empty": True,
    },
    {
        "query": "best songs by drake",
        "expected_domain": "music",
        "expected_intent": "top_results",
        "must_not_be_empty": True,
    },
    {
        "query": "best pop songs",
        "expected_domain": "music",
        "expected_intent": "top_results",
        "must_not_be_empty": True,
    },
    {
        "query": "recommend me songs like unholy",
        "expected_domain": "music",
        "expected_intent": "similar_content",
        "must_not_be_empty": True,
    },
    {
        "query": "nepali songs",
        "expected_domain": "music",
        "expected_intent": "top_results",
        "must_not_be_empty": True,
    },
    {
        "query": "best hindi songs",
        "expected_domain": "music",
        "expected_intent": "top_results",
        "must_not_be_empty": True,
    },

    # ---------------------------------------------------------
    # GAMES
    # ---------------------------------------------------------
    {
        "query": "best mobile strategy games",
        "expected_domain": "game",
        "expected_intent": "top_results",
        "must_not_be_empty": True,
    },
    {
        "query": "recommend me games like clash of clans",
        "expected_domain": "game",
        "expected_intent": "similar_content",
        "must_not_be_empty": True,
    },
    {
        "query": "best pc shooting games",
        "expected_domain": "game",
        "expected_intent": "top_results",
        "must_not_be_empty": True,
    },
    {
        "query": "games like gta",
        "expected_domain": "game",
        "expected_intent": "similar_content",
        "must_not_be_empty": True,
    },
    {
        "query": "best horror games",
        "expected_domain": "game",
        "expected_intent": "top_results",
        "must_not_be_empty": True,
    },
    {
        "query": "best open world games",
        "expected_domain": "game",
        "expected_intent": "top_results",
        "must_not_be_empty": True,
    },

    # ---------------------------------------------------------
    # MIXED / AMBIGUOUS sanity tests
    # ---------------------------------------------------------
    {
        "query": "dark",
        "expected_domain": "movie",
        "expected_intent": "similar_content",
        "must_not_be_empty": True,
    },
    {
        "query": "harry potter",
        "expected_domain": "book",
        "expected_intent": "similar_content",
        "must_not_be_empty": True,
    },
    {
        "query": "justin bieber",
        "expected_domain": "music",
        "expected_intent": "top_results",
        "must_not_be_empty": True,
    },
    {
        "query": "elden ring",
        "expected_domain": "game",
        "expected_intent": "similar_content",
        "must_not_be_empty": True,
    },
]