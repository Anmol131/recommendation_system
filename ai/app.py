from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from ai.core.preprocessing import preprocess_query
from ai.services.recommendation_pipeline import run_pipeline
from ai.core.personalizer import apply_personalization

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "AI Recommendation Service is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/analyze")
def analyze(query: str, top_n: int = 5, age_group: str | None = None, interest_mode: str | None = None):
    cleaned_query_data = preprocess_query(query)
    if not cleaned_query_data.get("cleaned_query") or not cleaned_query_data.get("keywords"):
        raise HTTPException(status_code=400, detail="Please enter a valid recommendation query.")

    result = run_pipeline(query, top_n)

    try:
        results = result.get('results') if isinstance(result, dict) else None
        if results is not None:
            personalized = apply_personalization(results, age_group=age_group, interest_mode=interest_mode)
            result['results'] = personalized
            result['age_group'] = age_group
            result['interest_mode'] = interest_mode
    except Exception:
        # Personalization must not break the pipeline — fallback to original
        pass

    return result