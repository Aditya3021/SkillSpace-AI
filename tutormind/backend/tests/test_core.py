from app.services.chunking import chunk_text
from app.services.retrieval import retrieve
from app.models.schemas import Chunk
from app.services.learner import LearnerModel

def test_chunking():
    chunks = chunk_text("s1", "word " * 1500, "page 1", 100, 10)
    assert len(chunks) > 10

def test_retrieval():
    chunks = [
        Chunk(id="1", source_id="s", text="TCP congestion avoidance increases a congestion window.", locator="p1"),
        Chunk(id="2", source_id="s", text="HTTP uses requests and responses.", locator="p2"),
    ]
    assert retrieve("congestion window", chunks, 1)[0].id == "1"

def test_learner_update():
    model = LearnerModel()
    before = model.get("tcp")
    after = model.update("tcp", True)
    assert after > before
