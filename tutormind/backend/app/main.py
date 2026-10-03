from pathlib import Path
from tempfile import NamedTemporaryFile
from fastapi import FastAPI, UploadFile, HTTPException
from .models.schemas import AskRequest, AskResponse, AssessmentEvent
from .services.ingestion import ingest_file
from .services.grounding import grounded_demo_answer, STORE
from .services.learner import LearnerModel
from .services.llm import provider_status
from .services.video import transcription_contract

app = FastAPI(title="TutorMind AI", version="0.3.0")
LEARNER = LearnerModel()

@app.get("/health")
def health():
    return {"status": "ok", "service": "tutormind-ai", "version": "0.3.0"}

@app.get("/capabilities")
def capabilities():
    return {"pdf": True, "pptx": True, "video_contract": True,
            "retrieval": True, "adaptive_assessment": True, "llm": provider_status()}

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
    mastery = LEARNER.update(event.concept, event.correct, event.difficulty)
    return {"concept": event.concept, "mastery": mastery}

@app.get("/learner/weak")
def weak():
    return {"weak_concepts": [{"concept": c, "mastery": m} for c, m in LEARNER.weak_concepts()]}
