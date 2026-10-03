from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_quiz_and_mastery_flow(tmp_path, monkeypatch):
    from app import main
    from app.services.learner_store import LearnerStore
    main.LEARNER_STORE = LearnerStore(tmp_path / "api.db")
    main.QUIZ = main.QuizEngine(main.LEARNER_STORE)

    response = client.post("/assessment", json={
        "learner_id": "api-user", "concept": "graphs", "correct": False, "difficulty": 0.5
    })
    assert response.status_code == 200
    assert response.json()["mastery"] < 0.5

    response = client.get("/learner/weak?learner_id=api-user")
    assert response.status_code == 200
    assert response.json()["weak_concepts"][0]["concept"] == "graphs"

    response = client.post("/quiz/next", json={"learner_id": "api-user", "concept": "graphs"})
    assert response.status_code == 200
    assert response.json()["concept"] == "graphs"
