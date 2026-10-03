from .retrieval import retrieve

def retrieval_recall(queries):
    if not queries:
        return 0.0
    hits = 0
    for item in queries:
        found = retrieve(item["question"], item["chunks"], 5)
        if any(c.source_id == item["expected_source_id"] for c in found):
            hits += 1
    return round(hits / len(queries), 4)
