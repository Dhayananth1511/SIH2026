import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

db_file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "aicte.db"))
sqlite_url = f"sqlite:///{db_file_path}"

db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+psycopg2://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

try:
    if "sqlite" in db_url:
        engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
        with engine.connect() as conn:
            pass
    else:
        engine = create_engine(
            db_url,
            pool_size=10,
            max_overflow=20,
            pool_recycle=300,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 3}
        )
        with engine.connect() as conn:
            pass
except Exception as e:
    # Safe fallback to local SQLite so offline or remote DB unreachable never breaks app
    engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
