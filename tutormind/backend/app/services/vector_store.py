import math
import re
from collections import Counter
from typing import Iterable
from ..models.schemas import Chunk

def _tokens(text):
    return re.findall(r"[a-zA-Z0-9]+", text.lower())

class VectorStore:
    def __init__(self):
        self.chunks = {}

    def upsert(self, chunks: Iterable[Chunk]):
        for chunk in chunks:
            self.chunks[chunk.id] = chunk

    def _score(self, query, doc):
        q, d = Counter(_tokens(query)), Counter(_tokens(doc))
        if not q or not d:
            return 0.0
        overlap = sum(min(q[k], d[k]) for k in q)
        return overlap / math.sqrt(sum(q.values()) * sum(d.values()))

    def search(self, query, k=5):
        ranked = sorted(self.chunks.values(), key=lambda c: self._score(query, c.text), reverse=True)
        return [c for c in ranked[:k] if self._score(query, c.text) > 0]
