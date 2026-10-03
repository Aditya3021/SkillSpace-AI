from app.services.learner_store import LearnerStore

def test_persists_mastery(tmp_path):
    store = LearnerStore(tmp_path / "learner.db")
    store.set("u1", "graphs", 0.72)
    assert store.get("u1", "graphs") == 0.72
    assert store.weak("u1", 0.8) == [("graphs", 0.72)]
