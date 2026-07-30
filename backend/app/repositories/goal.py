import uuid

from sqlalchemy.orm import Session

from app.models.goal import SavingsGoal


class GoalRepository:
    def get_by_id(self, db: Session, goal_id: uuid.UUID) -> SavingsGoal | None:
        return db.query(SavingsGoal).filter(SavingsGoal.id == goal_id).first()

    def list_by_user(self, db: Session, user_id: uuid.UUID) -> list[SavingsGoal]:
        return (
            db.query(SavingsGoal)
            .filter(SavingsGoal.user_id == user_id)
            .order_by(SavingsGoal.created_at.desc())
            .all()
        )

    def count_by_user(self, db: Session, user_id: uuid.UUID) -> int:
        return db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id).count()

    def create(self, db: Session, user_id: uuid.UUID, data: dict) -> SavingsGoal:
        goal = SavingsGoal(user_id=user_id, **data)
        db.add(goal)
        db.commit()
        db.refresh(goal)
        return goal

    def update(self, db: Session, goal: SavingsGoal, data: dict) -> SavingsGoal:
        for k, v in data.items():
            if v is not None:
                setattr(goal, k, v)
        db.commit()
        db.refresh(goal)
        return goal

    def delete(self, db: Session, goal: SavingsGoal) -> None:
        db.delete(goal)
        db.commit()
