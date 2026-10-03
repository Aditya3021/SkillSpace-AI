# Hackathon submission brief

## One-line pitch
TutorMind turns a learner's own course material into a grounded, adaptive study loop: **ingest → explain with evidence → assess → update mastery → target the next activity**.

## The problem
Students often receive generic AI explanations and fixed quizzes that do not reflect their actual course material or current weaknesses.

## What is implemented
- PDF/PPTX ingestion with page/slide locators.
- Evidence-based retrieval with citation objects.
- Explicit no-evidence behavior instead of fabricated citations.
- Persistent per-learner mastery using SQLite.
- Adaptive quiz difficulty from current mastery.
- Browser learning cockpit with Overview, Materials, Tutor, Quiz and Progress views.
- API and unit/integration tests.
- CI workflow for backend tests.
- Video transcription contract designed for timestamped multimodal expansion.

## 90-second demo
1. Upload a networking PDF/PPTX in **Materials**.
2. Ask: “Why does TCP use congestion avoidance?”
3. Show the cited source locator.
4. Take the adaptive question.
5. Submit an incorrect answer once.
6. Open Progress and show the lower mastery / targeted review loop.
7. Answer correctly and show mastery increase.

## Technical differentiator
The system separates the **data plane** (course evidence and provenance) from the **learning plane** (mastery and next-action selection). This makes the tutor inspectable instead of treating generated text as the source of truth.

## Known extension points
Production deployments can replace the lightweight retrieval layer with embeddings/vector DB, connect an LLM provider through the existing provider boundary, and add timestamped video transcription/keyframes without changing the learner loop.

## AI disclosure
Describe any external AI tools/models actually used during development according to the hackathon's disclosure requirements. Do not claim capabilities or models that are not present in the submitted build.
