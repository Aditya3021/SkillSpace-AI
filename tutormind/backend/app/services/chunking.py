from ..models.schemas import Chunk

def chunk_text(source_id: str, text: str, locator=None, chunk_size=700, overlap=100):
    words = text.split()
    result = []
    start = 0
    index = 0
    step = max(1, chunk_size - overlap)
    while start < len(words):
        piece = " ".join(words[start:start + chunk_size]).strip()
        if piece:
            result.append(Chunk(
                id=f"{source_id}-chunk-{index}",
                source_id=source_id,
                text=piece,
                locator=locator,
            ))
        index += 1
        start += step
    return result
