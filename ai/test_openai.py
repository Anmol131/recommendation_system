import os
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

api_key = os.getenv("OPENAI_API_KEY")
model = os.getenv("OPENAI_MODEL", "gpt-5.4")

if not api_key:
    raise ValueError("OPENAI_API_KEY is missing in ai/.env")

client = OpenAI(api_key=api_key)

response = client.responses.create(
    model=model,
    input="Reply with exactly: OpenAI key working",
)

print(response.output_text)