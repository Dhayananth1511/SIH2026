import os
import socket
import logging
from urllib.parse import urlparse, urlunparse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

logger = logging.getLogger("aicte.database")

# Supabase PostgreSQL Connection String Normalization
db_url = settings.DATABASE_URL.strip()

# Enforce Supabase PostgreSQL policy (no SQLite fallback)
if "sqlite" in db_url.lower():
    raise RuntimeError(
        "SQLite has been completely deprecated and removed by system policy. "
        "Please provide a valid Supabase PostgreSQL connection URI in backend/.env "
        "(e.g., DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres)"
    )

if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+psycopg2://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

# Ensure SSL requirement for Supabase connections
connect_args = {"connect_timeout": 15}
if "sslmode" not in db_url:
    connect_args["sslmode"] = "require"

# Supabase Connection Routing:
# Direct hostnames (db.[ref].supabase.co) are IPv6-only on modern Supabase.
# In environments without global IPv6 (Render, local IPv4-only networks), route through the official IPv4 pooler.
try:
    parsed = urlparse(db_url)
    host = parsed.hostname
    if host and host.startswith("db.") and host.endswith(".supabase.co"):
        ref = host[3:-len(".supabase.co")]
        # Test if direct host can resolve
        direct_resolvable = False
        try:
            addr = socket.getaddrinfo(host, parsed.port or 5432)
            if addr:
                direct_resolvable = True
        except Exception:
            direct_resolvable = False

        if not direct_resolvable:
            # Route seamlessly via Supabase IPv4 session pooler (port 5432)
            pooler_host = "aws-0-ap-southeast-1.pooler.supabase.com"
            new_user = f"postgres.{ref}" if parsed.username == "postgres" else (parsed.username or f"postgres.{ref}")
            port = parsed.port or 5432
            auth = f"{new_user}:{parsed.password}@" if parsed.password else f"{new_user}@"
            new_netloc = f"{auth}{pooler_host}:{port}"
            db_url = urlunparse(parsed._replace(netloc=new_netloc))
            logger.info(f"Supabase direct host '{host}' auto-routed via IPv4 pooler '{pooler_host}'")
except Exception as e:
    logger.debug(f"URL parsing note: {e}")

engine = create_engine(
    db_url,
    pool_size=10,
    max_overflow=20,
    pool_recycle=300,
    pool_pre_ping=True,
    connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
