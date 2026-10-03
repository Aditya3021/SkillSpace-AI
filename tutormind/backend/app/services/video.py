"""Video ingestion boundary for TutorMind.

Production implementation:
1. Extract audio from uploaded lecture video.
2. Transcribe with timestamps.
3. Split transcript into timestamped chunks.
4. Optionally extract representative keyframes.
5. Index transcript + keyframe metadata in the same retrieval layer.

This module intentionally does not fabricate a transcript when no transcription
provider is configured.
"""

def transcription_contract(source_id: str):
    return {
        "source_id": source_id,
        "status": "provider_required",
        "chunk_schema": {
            "text": "string",
            "start_seconds": "number",
            "end_seconds": "number",
            "source_id": "string"
        }
    }
