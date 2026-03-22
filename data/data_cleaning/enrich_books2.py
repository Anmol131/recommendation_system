import pymongo
import requests
import time
import re
from concurrent.futures import ThreadPoolExecutor, as_completed

MONGO_URI        = "mongodb://localhost:27017/recommendation_platform"
DB_NAME          = "recommendation_platform"
GOOGLE_BOOKS_KEY = "AIzaSyBaDBRon4Ji8nfI1QNDS-CYinPFXkF1F1k"
WORKERS          = 10

client = pymongo.MongoClient(MONGO_URI)
db     = client[DB_NAME]
books  = db["books"]

session = requests.Session()

def clean_title(title):
    if not title:
        return ""
    title = re.sub(r'&amp;', '&', title)
    title = re.sub(r'&[a-z]+;', '', title)
    title = re.sub(r'\(.*?\)', '', title)
    title = re.sub(r'\[.*?\]', '', title)
    title = re.sub(r':.*$', '', title)
    return title.strip()

# ── Strategy 1: Open Library Works API (different from before) ──
def fetch_open_library_works(isbn=None, title=None, author=None):
    try:
        # Try ISBN via works endpoint
        if isbn:
            res = session.get(
                f"https://openlibrary.org/isbn/{isbn}.json",
                timeout=10
            )
            if res.status_code == 200:
                data = res.json()
                works = data.get("works", [])
                if works:
                    work_key = works[0].get("key")
                    if work_key:
                        work_res = session.get(
                            f"https://openlibrary.org{work_key}.json",
                            timeout=10
                        )
                        if work_res.status_code == 200:
                            work = work_res.json()
                            desc = work.get("description")
                            if isinstance(desc, dict):
                                desc = desc.get("value")
                            if desc:
                                return {"description": desc}

        # Try title search
        if title:
            clean = clean_title(title)
            res = session.get(
                "https://openlibrary.org/search.json",
                params={
                    "q": f"{clean} {author or ''}".strip(),
                    "limit": 3,
                    "fields": "key,title,author_name,first_publish_year"
                },
                timeout=10
            )
            docs = res.json().get("docs", [])
            for doc in docs:
                work_key = doc.get("key")
                if work_key:
                    work_res = session.get(
                        f"https://openlibrary.org{work_key}.json",
                        timeout=10
                    )
                    if work_res.status_code == 200:
                        work = work_res.json()
                        desc = work.get("description")
                        if isinstance(desc, dict):
                            desc = desc.get("value")
                        if desc and len(desc) > 20:
                            return {"description": desc}
    except Exception:
        pass
    return None

# ── Strategy 2: Wikipedia API ──
def fetch_wikipedia(title=None, author=None):
    try:
        query = clean_title(title or "")
        if author and author not in ["Not Applicable (Na )", "N/A"]:
            query += f" {author} book"
        else:
            query += " book"

        res = session.get(
            "https://en.wikipedia.org/api/rest_v1/page/summary/" +
            requests.utils.quote(query.replace(" ", "_")),
            timeout=10
        )
        if res.status_code == 200:
            data = res.json()
            extract = data.get("extract", "")
            if extract and len(extract) > 50 and data.get("type") != "disambiguation":
                return {"description": extract}

        # fallback: Wikipedia search
        search_res = session.get(
            "https://en.wikipedia.org/w/api.php",
            params={
                "action": "query",
                "list":   "search",
                "srsearch": f"{clean_title(title)} novel",
                "format": "json",
                "srlimit": 1,
            },
            timeout=10
        )
        results = search_res.json().get("query", {}).get("search", [])
        if results:
            page_title = results[0].get("title", "")
            page_res = session.get(
                "https://en.wikipedia.org/api/rest_v1/page/summary/" +
                requests.utils.quote(page_title.replace(" ", "_")),
                timeout=10
            )
            if page_res.status_code == 200:
                data = page_res.json()
                extract = data.get("extract", "")
                if extract and len(extract) > 50:
                    return {"description": extract}
    except Exception:
        pass
    return None

# ── Strategy 3: Google Books (use sparingly — 1000/day limit) ──
def fetch_google_books(isbn=None, title=None, author=None):
    try:
        if isbn:
            query = f"isbn:{isbn}"
        elif title and author:
            query = f"intitle:{clean_title(title)}+inauthor:{author}"
        elif title:
            query = f"intitle:{clean_title(title)}"
        else:
            return None

        res = session.get(
            "https://www.googleapis.com/books/v1/volumes",
            params={"q": query, "key": GOOGLE_BOOKS_KEY, "maxResults": 1},
            timeout=10
        )
        if res.status_code == 429:
            return None  # quota hit — skip

        data  = res.json()
        if data.get("error"):
            return None  # quota exceeded

        items = data.get("items", [])
        if not items:
            return None

        info = items[0]["volumeInfo"]
        desc = info.get("description")
        if desc:
            return {"description": desc}
    except Exception:
        pass
    return None

def process_book(book):
    isbn   = book.get("isbn")
    title  = book.get("title")
    author = book.get("author")
    data   = None

    # Try Open Library Works first
    data = fetch_open_library_works(isbn=isbn, title=title, author=author)

    # Try Wikipedia next
    if not data or not data.get("description"):
        data = fetch_wikipedia(title=title, author=author)

    # Use Google Books last (quota limited)
    if not data or not data.get("description"):
        data = fetch_google_books(isbn=isbn, title=title, author=author)

    return book["_id"], title, data

total     = books.count_documents({"enriched": True, "description": None})
processed = 0
updated   = 0
failed    = 0

print(f"Starting multi-API book enrichment — {total} books missing description\n")
print("Strategy: Open Library Works → Wikipedia → Google Books\n")

cursor = list(books.find(
    {"enriched": True, "description": None},
    {"_id": 1, "isbn": 1, "title": 1, "author": 1}
))

with ThreadPoolExecutor(max_workers=WORKERS) as executor:
    futures = {executor.submit(process_book, b): b for b in cursor}

    for future in as_completed(futures):
        processed += 1
        _id, title, data = future.result()

        if data and data.get("description"):
            books.update_one(
                {"_id": _id},
                {"$set": {"description": data["description"]}}
            )
            updated += 1
            status = "OK"
        else:
            failed += 1
            status = "Not found"

        print(f"[{processed}/{total}] {str(title or 'Unknown')[:50]}... {status}")

        if processed % 200 == 0:
            print(f"\n--- Progress: {processed}/{total} | Updated: {updated} | Not found: {failed} ---\n")

print(f"\nDone! Updated: {updated} | Not found: {failed}")
client.close()
  