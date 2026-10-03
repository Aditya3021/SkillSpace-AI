from pydantic import BaseModel, Field
from typing import List, Optional

class Chunk(BaseModel):
    id: str
    source_id: str
    text: str
    locator: Optional[str] = None

class Citation(BaseModel):
    source_id: str
    locator: Optional[str] = None
    quote: Optional[str] = None

class AskRequest(BaseModel):
    question: str = Field(min_length=2)
    learner_id: str = "demo-learner"

class AskResponse(BaseModel):
    answer: str
    citations: List[Citation]
    confidence: float

class AssessmentEvent(BaseModel):
    learner_id: str
    concept: str
    correct: bool
    difficulty: float = 0.5
