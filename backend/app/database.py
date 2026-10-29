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

# Resolve Supabase IPv6 address for Windows compatibility if using direct hostname
try:
    parsed = urlparse(db_url)
    host = parsed.hostname
    if host and "supabase.co" in host and not host.startswith("["):
        try:
            addrinfo = socket.getaddrinfo(host, parsed.port or 5432, socket.AF_INET6)
            if addrinfo:
                ipv6 = addrinfo[0][4][0]
                new_netloc = parsed.netloc.replace(host, f"[{ipv6}]")
                db_url = urlunparse(parsed._replace(netloc=new_netloc))
                logger.info(f"Resolved Supabase host '{host}' to IPv6 '[{ipv6}]'")
        except Exception as dns_err:
            logger.debug(f"IPv6 resolution skipped: {dns_err}")
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
