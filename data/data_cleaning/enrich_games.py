import pymongo
import requests
import time
import re
from concurrent.futures import ThreadPoolExecutor, as_completed

MONGO_URI = "mongodb://localhost:27017/recommendation_platform"
DB_NAME   = "recommendation_platform"
WORKERS   = 5  # Keep low to avoid Steam blocking again

client = pymongo.MongoClient(MONGO_URI)
db     = client[DB_NAME]
games  = db["games"]

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
})

def fetch_steam(game_id):
    try:
        res = session.get(
            "https://store.steampowered.com/api/appdetails",
            params={"appids": game_id, "l": "english"},
            timeout=10
        )
        if res.status_code == 403:
            time.sleep(5)
            return None
        if res.status_code == 429:
            time.sleep(10)
            return fetch_steam(game_id)
        if res.status_code != 200:
            return None

        data     = res.json()
        app_data = data.get(str(game_id), {})
        if not app_data.get("success"):
            return None

        info = app_data.get("data", {})
        if not info:
            return None

        description = (
            info.get("short_description") or
            info.get("detailed_description")
        )
        if description:
            description = re.sub(r'<[^>]+>', '', description).strip()

        year = None
        release = info.get("release_date", {}).get("date", "")
        if release:
            match = re.search(r'\d{4}', release)
            if match:
                year = int(match.group())

        image      = info.get("header_image")
        devs       = info.get("developers", [])
        developer  = devs[0] if devs else None
        genres     = [g["description"] for g in info.get("genres", []) if g.get("description")]
        metacritic = info.get("metacritic", {}).get("score")

        return {
            "description": description,
            "year":        year,
            "image":       image,
            "developer":   developer,
            "genres":      genres if genres else None,
            "metacritic":  metacritic,
        }
    except Exception:
        return None


def process_game(game):
    game_id = game.get("gameId")
    title   = game.get("title")
    data    = None

    if game_id:
        data = fetch_steam(game_id)
        time.sleep(0.5)  # small delay between requests

    return game["_id"], title, data


print("Resetting previously failed enrichments...")
reset = games.update_many(
    {"enriched": True, "description": None},
    {"$set": {"enriched": False}}
)
print(f"Reset {reset.modified_count} records\n")

total     = games.count_documents({"enriched": False})
processed = 0
updated   = 0
failed    = 0

print(f"Starting Steam enrichment — {total} games\n")

cursor = list(games.find(
    {"enriched": False},
    {"_id": 1, "gameId": 1, "title": 1, "platform": 1}
))

with ThreadPoolExecutor(max_workers=WORKERS) as executor:
    futures = {executor.submit(process_game, g): g for g in cursor}

    for future in as_completed(futures):
        processed += 1
        _id, title, data = future.result()

        if data:
            update = {"enriched": True}
            if data.get("description"):
                update["description"] = data["description"]
            if data.get("year"):
                update["releaseYear"] = data["year"]
            if data.get("image"):
                update["image"] = data["image"]
            if data.get("developer"):
                update["developer"] = data["developer"]
            if data.get("genres"):
                update["genres"] = data["genres"]
            if data.get("metacritic"):
                update["metacritic"] = data["metacritic"]

            games.update_one({"_id": _id}, {"$set": update})
            updated += 1
            status = "OK"
        else:
            games.update_one({"_id": _id}, {"$set": {"enriched": True}})
            failed += 1
            status = "Not found"

        print(f"[{processed}/{total}] {str(title or 'Unknown')[:50]}... {status}")

        if processed % 500 == 0:
            print(f"\n--- Progress: {processed}/{total} | Updated: {updated} | Not found: {failed} ---\n")

print(f"\nDone! Updated: {updated} | Not found: {failed}")
client.close()
