from ai.recommenders.base_recommender import BaseRecommender
from ai.recommenders.book_recommender import BookRecommender
from ai.recommenders.game_recommender import GameRecommender
from ai.recommenders.movie_recommender import MovieRecommender
from ai.recommenders.music_recommender import MusicRecommender

__all__ = [
    "BaseRecommender",
    "MovieRecommender",
    "BookRecommender",
    "GameRecommender",
    "MusicRecommender",
]
