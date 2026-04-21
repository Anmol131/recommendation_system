import os
from functools import lru_cache

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URI = (
    os.getenv("MONGO_URI")
    or os.getenv("MONGODB_URI")
    or "mongodb://localhost:27017"
)

MONGO_DB_NAME = (
    os.getenv("MONGO_DB_NAME")
    or os.getenv("DB_NAME")
    or "recommendation_platform"
)

@lru_cache(maxsize=1)
def get_client():
    return MongoClient(MONGO_URI)

def get_database():
    return get_client()[MONGO_DB_NAME]

def get_collection(collection_name: str):
    return get_database()[collection_name]