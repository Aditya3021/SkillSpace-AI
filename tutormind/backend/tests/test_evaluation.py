from app.models.schemas import Chunk
from app.services.evaluation import retrieval_recall

DATASET = [
    {"question": "How does congestion avoidance affect the congestion window?", "expected_source_id": "networking", "chunks": [
        Chunk(id="n1", source_id="networking", text="TCP congestion avoidance controls the congestion window after slow start.", locator="p143"),
        Chunk(id="w1", source_id="web", text="HTML documents contain headings and paragraphs.", locator="p12"),
    ]},
    {"question": "What does HTTP use?", "expected_source_id": "web", "chunks": [
        Chunk(id="n2", source_id="networking", text="TCP uses congestion control.", locator="p143"),
        Chunk(id="w2", source_id="web", text="HTTP uses requests and responses between clients and servers.", locator="p12"),
    ]},
]

def test_retrieval_recall_dataset():
    assert retrieval_recall(DATASET) >= 0.99
