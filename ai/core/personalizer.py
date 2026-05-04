from datetime import datetime
from typing import List


def _is_age_restricted(item: dict) -> bool:
    # Heuristics to detect adult/restricted content
    orig = item.get('originalData', {}) or {}

    # explicit music flag
    if item.get('explicit') is True or orig.get('explicit') is True:
        return True

    # common boolean flags
    for flag in ('adult', 'isAdult', 'mature', 'restricted'):
        if orig.get(flag) is True:
            return True

    # MPAA or content rating strings
    for key in ('mpaa_rating', 'contentRating', 'maturity', 'rating'): 
        val = orig.get(key) or item.get(key)
        if isinstance(val, str):
            v = val.lower()
            if '18' in v or 'r-' in v or 'adult' in v or 'mature' in v:
                return True

    return False


def _get_int(value, default=0):
    try:
        return int(value)
    except Exception:
        return default


def _get_float(value, default=0.0):
    try:
        return float(value)
    except Exception:
        return default


def apply_personalization(
    results: list,
    age_group: str | None = None,
    interest_mode: str | None = None,
) -> list:
    if not isinstance(results, list):
        return results

    age_group = (age_group or '').lower()
    interest_mode = (interest_mode or '').lower()

    filtered: List[dict] = []
    current_year = datetime.utcnow().year

    for item in results:
        # Preserve exact matches
        if item.get('matchType') == 'exact':
            filtered.append(item)
            continue

        # Age filtering
        if age_group in ('child', 'teen'):
            if _is_age_restricted(item):
                # skip item for children/teens
                continue

        # Interest priority adjustments — operate on copy of score
        score = _get_int(item.get('score', 0))
        reasons = list(item.get('reasons') or [])

        # Popularity boost
        rating_count = _get_int(item.get('ratingCount') or item.get('rating_count') or 0)
        popularity = _get_int(item.get('popularity') or 0)
        avg_rating = _get_float(item.get('avgRating') or item.get('avg_rating') or item.get('rating') or 0)

        if interest_mode == 'popular':
            if rating_count >= 1000 or popularity >= 80:
                score += 20
                reasons.append('Boosted for popularity')
            elif rating_count >= 100:
                score += 10
                reasons.append('Boosted for popularity')

        elif interest_mode == 'highly_rated':
            if avg_rating >= 8.0:
                score += 25
                reasons.append('Boosted for high rating')
            elif avg_rating >= 7.0:
                score += 10
                reasons.append('Boosted for high rating')

        elif interest_mode == 'recent':
            # try to extract year
            year = None
            if item.get('year'):
                try:
                    year = int(item.get('year'))
                except Exception:
                    year = None
            else:
                orig = item.get('originalData') or {}
                for k in ('releaseDate', 'release_date', 'publishedDate', 'year'):
                    v = orig.get(k)
                    if isinstance(v, str) and len(v) >= 4:
                        try:
                            year = int(v[:4])
                            break
                        except Exception:
                            continue
                    if isinstance(v, int):
                        year = v
                        break

            if year:
                age = current_year - year
                if age <= 3:
                    score += 20
                    reasons.append('Boosted for recent content')
                elif age <= 7:
                    score += 8
                    reasons.append('Boosted for recent content')

        elif interest_mode == 'niche':
            # reduce popularity bias, prefer less-popular metadata
            if popularity >= 80 or rating_count >= 5000:
                score -= 15
                reasons.append('Adjusted for niche mode')
            if rating_count < 100 and popularity < 30:
                score += 10
                reasons.append('Adjusted for niche mode')

        # mixed: no change

        # Ensure reasons unique and score integer
        item['score'] = int(score)
        # merge reasons while keeping uniqueness
        seen = set()
        merged_reasons = []
        for r in (reasons or []):
            if not r:
                continue
            if r not in seen:
                seen.add(r)
                merged_reasons.append(r)
        item['reasons'] = merged_reasons

        filtered.append(item)

    # Keep sorting by score descending and preserve top ordering
    filtered.sort(key=lambda x: int(x.get('score', 0)), reverse=True)
    return filtered
