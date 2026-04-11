import logging
from typing import Any, Dict, List

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from utils.db import get_collection

logger = logging.getLogger(__name__)


class MovieRecommender:
    def __init__(self) -> None:
        self.loaded = False
        self.items: List[Dict[str, Any]] = []
        self.id_to_index: Dict[str, int] = {}
        self.vectorizer = TfidfVectorizer(max_features=10000, stop_words="english")
        self.tfidf_matrix = None
        self._load_documents()

    def _as_text(self, value: Any) -> str:
        if value is None:
            return ""
        if isinstance(value, list):
            return " ".join(self._as_text(v) for v in value)
        if isinstance(value, dict):
            return " ".join(self._as_text(v) for v in value.values())
        return str(value)

    def _build_soup(self, doc: Dict[str, Any]) -> str:
        fields = [
            doc.get("title"),
            doc.get("genres"),
            doc.get("overview"),
            doc.get("cast"),
            doc.get("director"),
            doc.get("keywords"),
        ]
        return " ".join(self._as_text(value) for value in fields).strip().lower()

    def _sanitize_item(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        item = dict(doc)
        if "_id" in item:
            item["_id"] = str(item["_id"])
        return item

    def _load_documents(self) -> None:
        logger.info("Loading movie documents")
        collection = get_collection("movies")
        raw_docs = list(collection.find({}))

        if not raw_docs:
            logger.warning("No movie documents found")
            self.loaded = True
            return

        self.items = [self._sanitize_item(doc) for doc in raw_docs]
        soups = [self._build_soup(item) for item in self.items]
        self.tfidf_matrix = self.vectorizer.fit_transform(soups)
        self.id_to_index = {item["_id"]: idx for idx, item in enumerate(self.items)}
        self.loaded = True
        logger.info("Movie recommender loaded with %s items", len(self.items))

    def get_similar(self, item_id: str, top_n: int = 10) -> List[Dict[str, Any]]:
        if not self.loaded or self.tfidf_matrix is None:
            return []

        index = self.id_to_index.get(str(item_id))
        if index is None:
            return []

        similarity_scores = cosine_similarity(self.tfidf_matrix[index], self.tfidf_matrix).flatten()
        ranked_indices = np.argsort(similarity_scores)[::-1]
        filtered_indices = [i for i in ranked_indices if i != index][:top_n]
        return [self.items[i] for i in filtered_indices]

    def recommend_by_preferences(self, preferences_list: List[str], top_n: int = 20) -> List[Dict[str, Any]]:
        if not self.loaded or self.tfidf_matrix is None or not preferences_list:
            return []

        query = " ".join(str(value) for value in preferences_list)
        query_vector = self.vectorizer.transform([query])
        similarity_scores = cosine_similarity(query_vector, self.tfidf_matrix).flatten()
        ranked_indices = np.argsort(similarity_scores)[::-1][:top_n]
        return [self.items[i] for i in ranked_indices]


_movie_recommender_instance = None


def get_movie_recommender() -> MovieRecommender:
    global _movie_recommender_instance

    if _movie_recommender_instance is None:
        _movie_recommender_instance = MovieRecommender()

    return _movie_recommender_instance