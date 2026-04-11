from .book_recommender import get_book_recommender
from .game_recommender import get_game_recommender
from .movie_recommender import get_movie_recommender
from .music_recommender import get_music_recommender

__all__ = [
    "get_movie_recommender",
    "get_book_recommender",
    "get_game_recommender",
    "get_music_recommender",
]