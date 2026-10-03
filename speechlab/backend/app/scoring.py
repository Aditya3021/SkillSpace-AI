import re
from .models import SpeechSession, SpeechReport, Flaw

FILLERS = {"um", "uh", "like", "basically", "actually", "you know"}

def _words(text):
    return re.findall(r"[a-zA-Z']+", text.lower())

def evaluate(session: SpeechSession) -> SpeechReport:
    text = " ".join(s.text for s in session.segments)
    words = _words(text)
    duration = max(0.1, max(s.end for s in session.segments) - min(s.start for s in session.segments))
    wpm = len(words) / duration * 60
    filler_count = sum(w in FILLERS for w in words)
    filler_rate = filler_count / max(1, len(words))
    pauses = sum(1 for a,b in zip(session.segments, session.segments[1:]) if b.start-a.end >= 1.5)
    pace = max(0, min(100, 100 - abs(wpm-145)*0.55))
    clarity = max(0, min(100, 100 - filler_rate*500 - pauses*4))
    structure = max(0, min(100, 55 + min(45, len(set(_words(session.ideal_text)) & set(words))*2)))
    overall = round(0.4*pace + 0.4*clarity + 0.2*structure, 1)
    flaws=[]
    for s in session.segments:
        local=[w for w in _words(s.text) if w in FILLERS]
        if local:
            flaws.append(Flaw(category="filler", severity=min(1,0.25*len(local)), start=s.start,end=s.end,evidence=s.text,action="Pause briefly instead of using filler words."))
    for a,b in zip(session.segments, session.segments[1:]):
        gap=b.start-a.end
        if gap>=1.5:
            flaws.append(Flaw(category="pause",severity=min(1,gap/4),start=a.end,end=b.start,evidence=f"{gap:.1f}s pause",action="Use a shorter intentional pause or bridge sentence."))
    if wpm>175:
        flaws.append(Flaw(category="pace",severity=min(1,(wpm-175)/100),start=session.segments[0].start,end=session.segments[-1].end,evidence=f"{wpm:.0f} words/min",action="Slow down and add deliberate pauses between ideas."))
    if wpm<105:
        flaws.append(Flaw(category="pace",severity=min(1,(105-wpm)/70),start=session.segments[0].start,end=session.segments[-1].end,evidence=f"{wpm:.0f} words/min",action="Increase speaking pace slightly while keeping word endings clear."))
    strengths=[]
    if pace>=80: strengths.append("Speaking pace is near the target range.")
    if filler_count==0: strengths.append("No common filler words detected.")
    if structure>=75: strengths.append("Strong overlap with the target content structure.")
    return SpeechReport(overall=overall,scores={"pace":round(pace,1),"clarity":round(clarity,1),"structure":round(structure,1)},flaws=flaws,strengths=strengths)
