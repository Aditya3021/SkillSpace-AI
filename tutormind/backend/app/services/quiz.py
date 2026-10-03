from pydantic import BaseModel, Field
from .learner_store import LearnerStore

class QuizRequest(BaseModel):
    learner_id: str = "demo-learner"
    concept: str = Field(min_length=2)

class QuizQuestion(BaseModel):
    concept: str
    difficulty: float
    prompt: str
    choices: list[str]

class QuizEngine:
    def __init__(self, store: LearnerStore):
        self.store = store

    def next_question(self, learner_id, concept):
        mastery = self.store.get(learner_id, concept)
        difficulty = round(max(0.2, min(0.9, mastery + 0.15)), 2)
        return QuizQuestion(
            concept=concept,
            difficulty=difficulty,
            prompt=f"Which statement best explains {concept}?",
            choices=[f"Core principle of {concept}", "An unrelated definition", "A historical fact only", "None of these"]
        )
