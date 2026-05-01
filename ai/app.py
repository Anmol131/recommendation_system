from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

from ai.services.recommendation_pipeline import run_pipeline

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
def analyze(query: str, top_n: int = 5):
    return run_pipeline(query, top_n)