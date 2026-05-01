import json
from pathlib import Path

from ai.services.recommendation_pipeline import run_pipeline

try:
    from ai.benchmarks.query_benchmark_cases import BENCHMARK_CASES
except ImportError as exc:
    raise ImportError(
        "Could not import BENCHMARK_CASES from ai.benchmarks.query_benchmark_cases. "
        "Make sure the file exists, is saved, and contains BENCHMARK_CASES = [...]."
    ) from exc


OUTPUT_PATH = Path("ai/benchmarks/benchmark_output.json")


def get_domain(result: dict) -> str:
    understanding = result.get("understanding") or {}
    mapped_domain = understanding.get("mapped_domain")
    if mapped_domain and mapped_domain != "unknown":
        return mapped_domain

    content_types = result.get("content_types") or []
    if content_types:
        return content_types[0]

    return "unknown"


def get_intent(result: dict) -> str:
    return result.get("intent", "unknown")


def evaluate_case(case: dict) -> dict:
    query = case["query"]
    result = run_pipeline(query, top_n=5)

    detected_domain = get_domain(result)
    detected_intent = get_intent(result)
    result_count = len(result.get("results", []))

    domain_ok = detected_domain == case["expected_domain"]
    intent_ok = detected_intent == case["expected_intent"]

    non_empty_ok = True
    if case.get("must_not_be_empty", False):
        non_empty_ok = result_count > 0

    passed = domain_ok and intent_ok and non_empty_ok

    preview_titles = []
    for item in result.get("results", [])[:5]:
        title = item.get("title")
        if title:
            preview_titles.append(title)

    return {
        "query": query,
        "expected_domain": case["expected_domain"],
        "detected_domain": detected_domain,
        "domain_ok": domain_ok,
        "expected_intent": case["expected_intent"],
        "detected_intent": detected_intent,
        "intent_ok": intent_ok,
        "result_count": result_count,
        "non_empty_ok": non_empty_ok,
        "passed": passed,
        "preview_titles": preview_titles,
        "understanding": result.get("understanding", {}),
    }


def main():
    if not BENCHMARK_CASES:
        raise ValueError("BENCHMARK_CASES is empty.")

    evaluations = [evaluate_case(case) for case in BENCHMARK_CASES]

    total = len(evaluations)
    passed = sum(1 for item in evaluations if item["passed"])
    domain_passed = sum(1 for item in evaluations if item["domain_ok"])
    intent_passed = sum(1 for item in evaluations if item["intent_ok"])
    non_empty_passed = sum(1 for item in evaluations if item["non_empty_ok"])

    by_domain = {}
    for item in evaluations:
        domain = item["expected_domain"]
        by_domain.setdefault(domain, {"total": 0, "passed": 0})
        by_domain[domain]["total"] += 1
        if item["passed"]:
            by_domain[domain]["passed"] += 1

    summary = {
        "total_cases": total,
        "passed_cases": passed,
        "overall_pass_rate": round((passed / total) * 100, 2) if total else 0,
        "domain_match_rate": round((domain_passed / total) * 100, 2) if total else 0,
        "intent_match_rate": round((intent_passed / total) * 100, 2) if total else 0,
        "non_empty_rate": round((non_empty_passed / total) * 100, 2) if total else 0,
        "by_domain": by_domain,
    }

    output = {
        "summary": summary,
        "cases": evaluations,
    }

    OUTPUT_PATH.write_text(
        json.dumps(output, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print("\n=== BENCHMARK SUMMARY ===")
    print(f"Total cases       : {summary['total_cases']}")
    print(f"Passed cases      : {summary['passed_cases']}")
    print(f"Overall pass rate : {summary['overall_pass_rate']}%")
    print(f"Domain match rate : {summary['domain_match_rate']}%")
    print(f"Intent match rate : {summary['intent_match_rate']}%")
    print(f"Non-empty rate    : {summary['non_empty_rate']}%")

    print("\n=== BY DOMAIN ===")
    for domain, stats in summary["by_domain"].items():
        rate = round((stats["passed"] / stats["total"]) * 100, 2) if stats["total"] else 0
        print(f"{domain:<8} {stats['passed']}/{stats['total']} ({rate}%)")

    failed = [item for item in evaluations if not item["passed"]]
    if failed:
        print("\n=== FAILED CASES ===")
        for item in failed:
            print(f"- Query           : {item['query']}")
            print(f"  Expected domain : {item['expected_domain']}")
            print(f"  Detected domain : {item['detected_domain']}")
            print(f"  Expected intent : {item['expected_intent']}")
            print(f"  Detected intent : {item['detected_intent']}")
            print(f"  Results         : {item['result_count']}")
            print(f"  Preview         : {item['preview_titles']}")
            print()

    print(f"\nSaved full output to: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()