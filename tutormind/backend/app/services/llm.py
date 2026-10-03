import os

SYSTEM_PROMPT = """You are TutorMind, a source-grounded study tutor.
Answer only from supplied evidence. If evidence is insufficient, say so.
Never invent citations, page numbers or timestamps."""

def provider_status():
    return {
        "configured": bool(os.getenv("LLM_API_KEY")),
        "provider": os.getenv("LLM_PROVIDER", "none"),
        "model": os.getenv("LLM_MODEL", "not-configured"),
    }

def build_grounded_prompt(question, evidence):
    context = "\n\n".join(f"[{c.id}] {c.text}" for c in evidence)
    return f"{SYSTEM_PROMPT}\n\nQUESTION:\n{question}\n\nEVIDENCE:\n{context}"
