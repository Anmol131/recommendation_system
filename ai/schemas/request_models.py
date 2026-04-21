from pydantic import BaseModel, Field


class RecommendationRequest(BaseModel):
    query: str
    age_group: str | None = None
    interest_mode: str | None = None
    top_n: int = Field(default=5, ge=1, le=50)
