class LearnerModel:
    def __init__(self):
        self.mastery = {}

    def get(self, concept):
        return self.mastery.get(concept, 0.50)

    def update(self, concept, correct, difficulty=0.5):
        old = self.get(concept)
        delta = 0.10 * (1 + difficulty)
        new = old + delta if correct else old - delta * 0.8
        self.mastery[concept] = round(max(0, min(1, new)), 4)
        return self.mastery[concept]

    def weak_concepts(self, threshold=0.60):
        return sorted(
            [(c,m) for c,m in self.mastery.items() if m < threshold],
            key=lambda x:x[1]
        )
