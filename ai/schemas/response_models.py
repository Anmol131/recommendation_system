from pydantic import BaseModel


class RecommendationItem(BaseModel):
    item_id: str = ""
    title: str = ""
    score: float = 0.0
    explanations: list[str] = []


class RecommendationResponse(BaseModel):
    query: str
    intent: str
    count: int
    results: list[RecommendationItem]
