import logging
from contextlib import asynccontextmanager
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from recommenders.book_recommender import get_book_recommender
from recommenders.game_recommender import get_game_recommender
from recommenders.movie_recommender import get_movie_recommender
from recommenders.music_recommender import get_music_recommender

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("ai-service")

movie_recommender = None
book_recommender = None
game_recommender = None
music_recommender = None


class MovieRecommendationRequest(BaseModel):
    genres: Optional[List[str]] = None
    top_n: int = 20


class BookRecommendationRequest(BaseModel):
    categories: Optional[List[str]] = None
    top_n: int = 20


class GameRecommendationRequest(BaseModel):
    genres: Optional[List[str]] = None
    platform: str = ""
    top_n: int = 20


class MusicRecommendationRequest(BaseModel):
    tags: Optional[List[str]] = None
    top_n: int = 20


def _validate_top_n(top_n: int) -> None:
    if top_n <= 0:
        raise HTTPException(status_code=400, detail="top_n must be greater than 0")


def _has_text_match(field_value, expected_text: str) -> bool:
    if not expected_text:
        return True

    expected_text = expected_text.strip().lower()
    if not expected_text:
        return True

    if field_value is None:
        return False

    if isinstance(field_value, list):
        return any(expected_text in str(value).lower() for value in field_value)

    return expected_text in str(field_value).lower()


@asynccontextmanager
async def lifespan(_: FastAPI):
    global movie_recommender, book_recommender, game_recommender, music_recommender

    logger.info("Initializing all recommender engines")
    movie_recommender = get_movie_recommender()
    book_recommender = get_book_recommender()
    game_recommender = get_game_recommender()
    music_recommender = get_music_recommender()
    logger.info("All recommender engines initialized")
    yield
    logger.info("AI recommendation service shutting down")


app = FastAPI(title="AI Recommendation Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {
        "movies": {"loaded": bool(movie_recommender and movie_recommender.loaded), "count": len(movie_recommender.items) if movie_recommender else 0},
        "books": {"loaded": bool(book_recommender and book_recommender.loaded), "count": len(book_recommender.items) if book_recommender else 0},
        "games": {"loaded": bool(game_recommender and game_recommender.loaded), "count": len(game_recommender.items) if game_recommender else 0},
        "music": {"loaded": bool(music_recommender and music_recommender.loaded), "count": len(music_recommender.items) if music_recommender else 0},
    }


@app.post("/recommend/movies")
def recommend_movies(payload: MovieRecommendationRequest):
    if payload.genres is None:
        raise HTTPException(status_code=400, detail="genres is required")
    _validate_top_n(payload.top_n)

    results = movie_recommender.recommend_by_preferences(payload.genres, payload.top_n)
    return {"type": "movies", "count": len(results), "results": results}


@app.post("/recommend/books")
def recommend_books(payload: BookRecommendationRequest):
    if payload.categories is None:
        raise HTTPException(status_code=400, detail="categories is required")
    _validate_top_n(payload.top_n)

    results = book_recommender.recommend_by_preferences(payload.categories, payload.top_n)
    return {"type": "books", "count": len(results), "results": results}


@app.post("/recommend/games")
def recommend_games(payload: GameRecommendationRequest):
    if payload.genres is None:
        raise HTTPException(status_code=400, detail="genres is required")
    _validate_top_n(payload.top_n)

    fetch_count = max(payload.top_n, payload.top_n * 5)
    candidate_results = game_recommender.recommend_by_preferences(payload.genres, fetch_count)
    filtered_results = [
        item
        for item in candidate_results
        if _has_text_match(item.get("platform"), payload.platform)
    ]
    results = filtered_results[: payload.top_n]
    return {"type": "games", "count": len(results), "results": results}


@app.post("/recommend/music")
def recommend_music(payload: MusicRecommendationRequest):
    if payload.tags is None:
        raise HTTPException(status_code=400, detail="tags is required")
    _validate_top_n(payload.top_n)

    results = music_recommender.recommend_by_preferences(payload.tags, payload.top_n)
    return {"type": "music", "count": len(results), "results": results}


@app.get("/similar/movies/{item_id}")
def similar_movies(item_id: str, top_n: int = 10):
    _validate_top_n(top_n)
    if item_id not in movie_recommender.id_to_index:
        raise HTTPException(status_code=404, detail="Movie not found")

    results = movie_recommender.get_similar(item_id, top_n)
    return {"type": "movies", "count": len(results), "results": results}


@app.get("/similar/books/{item_id}")
def similar_books(item_id: str, top_n: int = 10):
    _validate_top_n(top_n)
    if item_id not in book_recommender.id_to_index:
        raise HTTPException(status_code=404, detail="Book not found")

    results = book_recommender.get_similar(item_id, top_n)
    return {"type": "books", "count": len(results), "results": results}


@app.get("/similar/games/{item_id}")
def similar_games(item_id: str, top_n: int = 10):
    _validate_top_n(top_n)
    if item_id not in game_recommender.id_to_index:
        raise HTTPException(status_code=404, detail="Game not found")

    results = game_recommender.get_similar(item_id, top_n)
    return {"type": "games", "count": len(results), "results": results}


@app.get("/similar/music/{item_id}")
def similar_music(item_id: str, top_n: int = 10):
    _validate_top_n(top_n)
    if item_id not in music_recommender.id_to_index:
        raise HTTPException(status_code=404, detail="Music track not found")

    results = music_recommender.get_similar(item_id, top_n)
    return {"type": "music", "count": len(results), "results": results}