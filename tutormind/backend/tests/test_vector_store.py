from app.models.schemas import Chunk
from app.services.vector_store import VectorStore

def test_vector_store_returns_relevant_chunk():
    store = VectorStore()
    store.upsert([
        Chunk(id="a", source_id="networking", text="TCP congestion avoidance controls the congestion window.", locator="p143"),
        Chunk(id="b", source_id="web", text="HTML documents contain headings and paragraphs.", locator="p12"),
    ])
    assert store.search("congestion window", 1)[0].id == "a"
