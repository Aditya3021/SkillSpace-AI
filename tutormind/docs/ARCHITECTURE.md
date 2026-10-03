# TutorMind architecture

## Data plane

PDF/PPTX/video
-> extraction/transcription
-> normalized multimodal chunks
-> metadata with source, locator, timestamps and modality
-> embedding/index layer
-> retrieval
-> evidence validation
-> tutor response
-> citation renderer.

## Learning plane

Assessment event
-> concept identification
-> mastery update
-> weakness detection
-> next activity selection
-> spaced review.

## Reliability gates

1. No evidence means no factual answer.
2. Every factual answer carries provenance.
3. Citation locators must belong to retrieved evidence.
4. Assessment events update learner state.
5. Evaluation runs before a demo release.

## Production replacement points

- vector_store.py -> pgvector or Qdrant
- llm.py -> selected LLM provider
- video.py -> timestamped speech-to-text and keyframe pipeline
- learner.py -> persistent learner model
