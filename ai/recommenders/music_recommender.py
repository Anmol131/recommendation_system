from ai.recommenders.base_recommender import BaseRecommender


class MusicRecommender(BaseRecommender):
    def recommend(self, query_data: dict, top_n: int = 5) -> list:
        return super().recommend(query_data=query_data, top_n=top_n)
