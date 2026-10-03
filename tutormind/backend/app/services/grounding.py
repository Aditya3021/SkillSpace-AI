from ..models.schemas import AskResponse, Citation
from .vector_store import VectorStore

STORE = VectorStore()

def grounded_demo_answer(question, chunks=None):
    if chunks:
        STORE.upsert(chunks)
    evidence = STORE.search(question, 3)
    if not evidence:
        return AskResponse(
            answer="I could not find supporting evidence in the indexed course materials.",
            citations=[],
            confidence=0.0,
        )
    citations = [
        Citation(source_id=c.source_id, locator=c.locator, quote=c.text[:180])
        for c in evidence
    ]
    answer = "Based on the retrieved course material: " + " ".join(
        c.text[:350] for c in evidence[:2]
    )
    return AskResponse(
        answer=answer,
        citations=citations,
        confidence=round(min(0.95, 0.45 + 0.12 * len(evidence)), 2),
    )
