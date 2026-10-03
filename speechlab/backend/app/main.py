from fastapi import FastAPI
from .models import SpeechSession, SpeechReport
from .scoring import evaluate
app=FastAPI(title="SpeechLab",version="0.1.0")

@app.get("/health")
def health(): return {"status":"ok","service":"speechlab","version":"0.1.0"}

@app.post("/evaluate",response_model=SpeechReport)
def evaluate_speech(session: SpeechSession): return evaluate(session)
