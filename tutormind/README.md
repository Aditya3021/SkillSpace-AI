# TutorMind AI — Multimodal AI Hackathon 2026 · Track D

TutorMind is an adaptive AI study companion that unifies lecture videos, textbooks and slides into a source-grounded knowledge base, then turns learner assessment events into personalized tutoring.

## Current build
- Browser learning cockpit
- Material library
- Source-grounded tutor UX
- Citation/provenance contract
- Adaptive quiz loop
- Concept mastery tracking
- FastAPI backend
- PDF/PPTX ingestion
- Metadata-preserving chunking
- Baseline retrieval
- Assessment API
- Docker deployment scaffold
- Tests

## Architecture

Materials → extraction/transcription → chunks + metadata → embeddings/vector DB → retrieval → grounded tutor → adaptive assessment → learner model → next learning action.

## Run backend

```bash
cd tutormind/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open the frontend with a static server:

```bash
python -m http.server 8080 --directory tutormind/frontend
```

## Production roadmap
1. Embeddings + vector database.
2. LLM adapter with structured citations.
3. Video transcription with timestamps.
4. Video keyframe extraction.
5. Cross-modal retrieval.
6. Concept/prerequisite graph.
7. Adaptive difficulty + spaced review.
8. Evaluation harness: retrieval recall, citation precision, faithfulness, quiz validity and learning gain.

## AI disclosure
AI coding assistants may be used during development. The final hackathon submission should disclose the tools used and identify AI-assisted portions as required by the competition rules.
