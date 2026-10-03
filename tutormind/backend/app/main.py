import os\nfrom pathlib import Path
from tempfile import NamedTemporaryFile
from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .models.schemas import AskRequest, AskResponse, AssessmentEvent
from .services.ingestion import ingest_file
from .services.grounding import grounded_demo_answer, STORE
from .services.learner import LearnerModel
from .services.learner_store import LearnerStore
from .services.quiz import QuizRequest, QuizEngine
from .services.llm import provider_status
from .services.video import transcription_contract

app = FastAPI(title="TutorMind AI", version="0.4.1")
ALLOWED_ORIGINS = [x.strip() for x in os.getenv("TUTORMIND_CORS_ORIGINS", "*").split(",") if x.strip()]\napp.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_credentials=False, allow_methods=["*"], allow_headers=["*"])
LEARNER = LearnerModel()
LEARNER_STORE = LearnerStore()
QUIZ = QuizEngine(LEARNER_STORE)

@app.get("/health")
def health():
    return {"status": "ok", "service": "tutormind-ai", "version": "0.4.1"}

@app.get("/capabilities")
def capabilities():
    return {"pdf": True, "pptx": True, "video_contract": True, "retrieval": True,
            "adaptive_assessment": True, "persistent_learner": True, "llm": provider_status()}

@app.post("/ingest")
async def ingest(file: UploadFile):
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in {".pdf", ".pptx"}:
        raise HTTPException(400, "PDF and PPTX are currently supported.")
    data = await file.read()
    with NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(data)
        tmp_path = tmp.name
    source_id = Path(file.filename).stem.replace(" ", "-").lower()
    try:
        chunks = ingest_file(tmp_path, source_id)
        STORE.upsert(chunks)
    except Exception as exc:
        raise HTTPException(400, f"Ingestion failed: {exc}")
    return {"source_id": source_id, "filename": file.filename, "chunks_created": len(chunks)}

@app.get("/video/{source_id}/contract")
def video_contract(source_id: str):
    return transcription_contract(source_id)

@app.post("/ask", response_model=AskResponse)
def ask(req: AskRequest):
    return grounded_demo_answer(req.question)

@app.post("/assessment")
def assessment(event: AssessmentEvent):
    mastery = LEARNER_STORE.get(event.learner_id, event.concept)
    delta = 0.10 * (1 + event.difficulty)
    mastery = max(0, min(1, mastery + delta if event.correct else mastery - delta * 0.8))
    LEARNER_STORE.set(event.learner_id, event.concept, round(mastery, 4))
    return {"learner_id": event.learner_id, "concept": event.concept, "mastery": round(mastery, 4)}

@app.get("/learner/weak")
def weak(learner_id: str = "demo-learner"):
    return {"learner_id": learner_id, "weak_concepts": [{"concept": c, "mastery": m} for c, m in LEARNER_STORE.weak(learner_id)]}

@app.post("/quiz/next")
def next_quiz(req: QuizRequest):
    return QUIZ.next_question(req.learner_id, req.concept)
