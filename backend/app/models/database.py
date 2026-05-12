from sqlalchemy import create_engine, Column, String, DateTime, Text, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os
import datetime

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./crm.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    hcp_name = Column(String(255), nullable=False)
    interaction_type = Column(String(100), default="Meeting")
    date = Column(String(20))
    time = Column(String(20))
    attendees = Column(Text, default="")
    topics_discussed = Column(Text, default="")
    materials_shared = Column(Text, default="")
    samples_distributed = Column(Text, default="")
    sentiment = Column(String(50), default="Neutral")
    outcomes = Column(Text, default="")
    follow_up = Column(Text, default="")
    ai_summary = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
