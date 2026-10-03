import re
from collections import Counter

STOPWORDS = {"the","a","an","is","are","of","to","in","on","for","and","or","what","why","how","does"}

def tokens(text):
    return [x for x in re.findall(r"[a-zA-Z0-9]+", text.lower()) if x not in STOPWORDS]

def score(query, text):
    q, t = Counter(tokens(query)), Counter(tokens(text))
    if not q or not t:
        return 0
    return sum(min(q[k], t[k]) for k in q) / max(1, sum(q.values()))

def retrieve(query, chunks, k=5):
    ranked = sorted(chunks, key=lambda c: score(query, c.text), reverse=True)
    return [c for c in ranked[:k] if score(query, c.text) > 0]
