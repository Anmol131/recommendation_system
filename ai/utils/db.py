import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient

logger = logging.getLogger(__name__)

_client = None
_database = None


def _load_environment() -> None:
    env_path = Path(__file__).resolve().parents[1] / ".env"
    load_dotenv(dotenv_path=env_path)


def get_client() -> MongoClient:
    global _client

    if _client is None:
        _load_environment()
        mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/recommendation_platform")
        logger.info("Creating MongoDB client")
        _client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        _client.admin.command("ping")
        logger.info("MongoDB client connected")

    return _client


def _get_database_name() -> str:
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/recommendation_platform")
    db_name = mongo_uri.rsplit("/", 1)[-1].split("?")[0]

    if not db_name:
        raise ValueError("Database name is missing in MONGO_URI")

    return db_name


def get_database():
    global _database

    if _database is None:
        client = get_client()
        db_name = _get_database_name()
        _database = client[db_name]
        logger.info("Using MongoDB database: %s", db_name)

    return _database


def get_collection(name: str):
    if not name:
        raise ValueError("Collection name is required")

    return get_database()[name]