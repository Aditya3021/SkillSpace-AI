from pydantic import BaseModel, Field

class TranscriptSegment(BaseModel):
    start: float = Field(ge=0)
    end: float = Field(gt=0)
    text: str = Field(min_length=1)

class SpeechSession(BaseModel):
    learner_id: str = "demo-learner"
    ideal_text: str = Field(min_length=10)
    segments: list[TranscriptSegment]

class Flaw(BaseModel):
    category: str
    severity: float
    start: float
    end: float
    evidence: str
    action: str

class SpeechReport(BaseModel):
    overall: float
    scores: dict[str, float]
    flaws: list[Flaw]
    strengths: list[str]
