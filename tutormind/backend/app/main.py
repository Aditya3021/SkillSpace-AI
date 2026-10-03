from pathlib import Path
from tempfile import NamedTemporaryFile
from fastapi import FastAPI, UploadFile, File, HTTPException
from .models.schemas import AskRequest, AskResponse, AssessmentEvent
from .services.ingestion import ingest_file
from .services.grounding import grounded_demo_answer
from .services.learner import LearnerModel

app = FastAPI(title="TutorMind AI", version="0.2.0")
CHUNKS = []
LEARNER = LearnerModel()

@app.get("/health")
def health():
    return {"status":"ok","service":"tutormind-ai","version":"0.2.0"}

@app.post("/ingest")
async def ingest(file: UploadFile = File(...)):
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in {".pdf",".pptx"}:
        raise HTTPException(400, "Only PDF and PPTX are supported in this MVP.")

    data = await file.read()
    with NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(data)
        tmp_path = tmp.name

    source_id = Path(file.filename).stem.replace(" ","-").lower()
    try:
        chunks = ingest_file(tmp_path, source_id)
        CHUNKS.extend(chunks)
    except Exception as exc:
        raise HTTPException(400, f"Ingestion failed: {exc}")

    return {
        "source_id":source_id,
        "filename":file.filename,
        "chunks_created":len(chunks)
    }

@app.post("/ask", response_model=AskResponse)
def ask(req: AskRequest):
    return grounded_demo_answer(req.question, CHUNKS)

@app.post("/assessment")
def assessment(event: AssessmentEvent):
    mastery = LEARNER.update(
        event.concept,
        event.correct,
        event.difficulty
    )
    return {"concept":event.concept,"mastery":mastery}

@app.get("/learner/weak")
def weak():
    return {
        "weak_concepts":[
            {"concept":c,"mastery":m}
            for c,m in LEARNER.weak_concepts()
        ]
    }
