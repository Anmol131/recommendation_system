from typing import Dict, List


class BaseRecommender:
    def recommend(self, query_data: Dict, intent: str = "general_search", top_n: int = 5) -> List[Dict]:
        return []