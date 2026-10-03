# SpeechLab — Contrastive Speech Analytics

SpeechLab evaluates a learner's speech against an ideal delivery rubric and grounds feedback in timestamped transcript evidence.

## Demo loop
ideal rubric + learner transcript → reproducible rubric scores → timestamped flaws → actionable coaching → re-record.

## Implemented
- Structured speech session schema.
- Deterministic scoring for pace, filler words, pauses and confidence signals.
- Timestamp-aware flaw annotations.
- Contrastive ideal-vs-learner rubric representation.
- JSON API for evaluation.
- Evaluation metric helpers.

## Production extension points
Replace the transcript input with ASR timestamps, add acoustic/prosodic features, and persist recordings without changing the scoring contract.
