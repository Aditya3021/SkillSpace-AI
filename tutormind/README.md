# TutorMind AI

TutorMind is a source-grounded, adaptive learning cockpit for personalized tutoring.

## Problem
Generic AI tutoring can answer questions without grounding them in a learner's own course material, while static quizzes do not adapt to what the learner actually knows.

## Solution
1. Multimodal course ingestion — PDF/PPTX extraction with source locators and a video transcription contract.
2. Grounded retrieval — retrieves course chunks and returns citations with the answer; missing evidence produces an explicit no-evidence response.
3. Persistent learner model — stores concept mastery per learner in SQLite and identifies weak concepts.
4. Adaptive assessment — selects question difficulty from current mastery and updates mastery after each assessment.

## Architecture
course material → extraction → indexed chunks → retrieval → cited tutor answer

assessment → mastery update → weakness detection → next activity

See ARCHITECTURE.md for reliability gates and production replacement points.

## Repository layout
- backend/ — FastAPI API, ingestion, retrieval, learner store and quiz engine.
- frontend/ — zero-build browser cockpit.
- DEMO.md — judge walkthrough.

## Run locally

### Backend
    cd tutormind/backend
    python -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    uvicorn app.main:app --reload --port 8000

Health check: http://localhost:8000/health

### Frontend
Open tutormind/frontend/index.html in a browser. In AI Tutor, save the backend URL. For local development use http://localhost:8000.

## API
- GET /health
- GET /capabilities
- POST /ingest
- POST /ask
- POST /assessment
- GET /learner/weak?learner_id=demo-learner
- POST /quiz/next
- GET /video/{source_id}/contract

## Deployment
The repository includes tutormind/render.yaml for a Render FastAPI deployment and tutormind/frontend/netlify.toml for static hosting.
After deploying the API, paste its HTTPS URL into the frontend Backend URL field.

## Tech stack
FastAPI, Python, SQLite, Pydantic, PDF/PPTX parsers, HTML/CSS/JavaScript.

## Reliability
- Factual tutoring answers are tied to retrieved evidence.
- Citations are generated from retrieved source metadata.
- Missing evidence returns a no-evidence response instead of a fabricated citation.
- Learner state is explicit and inspectable.

## Submission checklist
- [ ] Public GitHub repository
- [ ] Backend health endpoint works
- [ ] Frontend opens without a build step
- [ ] Backend URL configured in frontend
- [ ] Demo video recorded
- [ ] 3–5 screenshots captured
- [ ] Problem, solution, architecture and tech stack entered in the submission form
- [ ] AI-tool disclosure completed if required
- [ ] Final submission tested from a clean browser