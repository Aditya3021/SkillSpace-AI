from app.models import SpeechSession, TranscriptSegment
from app.scoring import evaluate

def test_filler_and_pause_are_grounded():
    session=SpeechSession(ideal_text="Explain the concept clearly and conclude with an example.",segments=[
        TranscriptSegment(start=0,end=2,text="Um this is a concept"),
        TranscriptSegment(start=4,end=7,text="It has an example"),
    ])
    report=evaluate(session)
    assert report.overall >= 0
    assert any(f.category=="filler" for f in report.flaws)
    assert any(f.category=="pause" for f in report.flaws)
