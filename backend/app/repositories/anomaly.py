import uuid

from sqlalchemy.orm import Session

from app.models.anomaly import Anomaly


class AnomalyRepository:
    def list_by_user(
        self, db: Session, user_id: uuid.UUID,
        skip: int = 0, limit: int = 50, unresolved_only: bool = False,
    ) -> list[Anomaly]:
        q = db.query(Anomaly).filter(Anomaly.user_id == user_id)
        if unresolved_only:
            q = q.filter(Anomaly.resolved == False)
        return q.order_by(Anomaly.created_at.desc()).offset(skip).limit(limit).all()

    def get_by_id(self, db: Session, anomaly_id: uuid.UUID) -> Anomaly | None:
        return db.query(Anomaly).filter(Anomaly.id == anomaly_id).first()

    def count_by_user(self, db: Session, user_id: uuid.UUID) -> int:
        return db.query(Anomaly).filter(Anomaly.user_id == user_id).count()

    def unresolved_count(self, db: Session, user_id: uuid.UUID) -> int:
        return db.query(Anomaly).filter(
            Anomaly.user_id == user_id, Anomaly.resolved == False
        ).count()

    def exists_by_description(self, db: Session, user_id: uuid.UUID, description: str) -> bool:
        return db.query(Anomaly).filter(
            Anomaly.user_id == user_id,
            Anomaly.description == description,
        ).first() is not None

    def create(self, db: Session, user_id: uuid.UUID, **kwargs) -> Anomaly:
        a = Anomaly(user_id=user_id, **kwargs)
        db.add(a)
        db.commit()
        db.refresh(a)
        return a

    def create_bulk(self, db: Session, items: list[dict]) -> list[Anomaly]:
        objs = [Anomaly(**item) for item in items]
        db.add_all(objs)
        db.commit()
        for o in objs:
            db.refresh(o)
        return objs

    def resolve(self, db: Session, anomaly_id: uuid.UUID) -> Anomaly | None:
        a = db.query(Anomaly).filter(Anomaly.id == anomaly_id).first()
        if a:
            a.resolved = True
            db.commit()
            db.refresh(a)
        return a

    def resolve_all(self, db: Session, user_id: uuid.UUID) -> int:
        count = db.query(Anomaly).filter(
            Anomaly.user_id == user_id, Anomaly.resolved == False
        ).update({"resolved": True})
        db.commit()
        return count
