import sqlite3
from pathlib import Path

class LearnerStore:
    def __init__(self, db_path=None):
        self.db_path = db_path or str(Path(__file__).resolve().parents[2] / "tutormind.db")
        self._init()

    def _connect(self):
        return sqlite3.connect(self.db_path)

    def _init(self):
        with self._connect() as db:
            db.execute("""CREATE TABLE IF NOT EXISTS mastery (
                learner_id TEXT NOT NULL, concept TEXT NOT NULL,
                mastery REAL NOT NULL, updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (learner_id, concept)
            )""")

    def get(self, learner_id, concept):
        with self._connect() as db:
            row = db.execute("SELECT mastery FROM mastery WHERE learner_id=? AND concept=?", (learner_id, concept)).fetchone()
        return float(row[0]) if row else 0.50

    def set(self, learner_id, concept, mastery):
        with self._connect() as db:
            db.execute("""INSERT INTO mastery(learner_id,concept,mastery) VALUES(?,?,?)
                ON CONFLICT(learner_id,concept) DO UPDATE SET mastery=excluded.mastery, updated_at=CURRENT_TIMESTAMP""",
                (learner_id, concept, mastery))

    def weak(self, learner_id, threshold=0.60):
        with self._connect() as db:
            rows = db.execute("SELECT concept, mastery FROM mastery WHERE learner_id=? AND mastery<? ORDER BY mastery", (learner_id, threshold)).fetchall()
        return [(r[0], float(r[1])) for r in rows]
