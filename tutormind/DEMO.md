# TutorMind demo flow

## 90-second judge demo

1. Open Overview and show the learner cockpit and the low-mastery concept.
2. Open Materials and explain that PDF/PPTX content is indexed with source locators.
3. Open AI Tutor and ask: "Why does TCP use congestion avoidance?"
4. Show the answer plus citations returned by the retrieval layer.
5. Open Adaptive Quiz and answer one question.
6. Point out that the assessment updates the persistent learner model.
7. Open Progress and explain the review → practice → transfer loop.
8. Mention the /capabilities endpoint and the video transcription contract as the multimodal extension points.

## Live deployment

The frontend accepts a backend URL in the AI Tutor screen. Save the deployed FastAPI URL before recording the final demo.

## What to emphasize

- Evidence-grounded answers instead of unsupported generation.
- Citation metadata is retained with retrieved chunks.
- Learner mastery persists in SQLite.
- Next-question difficulty is derived from current mastery.
- PDF/PPTX ingestion is implemented; video is represented by a timestamp-aware contract for the next ingestion layer.
