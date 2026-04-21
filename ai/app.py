from typing import Optional

from fastapi import FastAPI

from ai.services.recommendation_pipeline import run_pipeline

app = FastAPI(title="AI Recommendation Service")


@app.get("/")
def root():
    return {"message": "AI Recommendation Service is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/analyze")
def analyze(query: str, top_n: int = 5):
    return run_pipeline(query, top_n)
    return run_pipeline(
        query=query,
        age_group=age_group,
        interest_mode=interest_mode,
        top_n=top_n
    )