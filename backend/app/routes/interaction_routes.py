from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import datetime

from app.agents.tools import run_agent
from app.models.database import get_db, Interaction

router = APIRouter()


# ─────────────────────────────────────────────
# Pydantic schemas
# ─────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str


class InteractionCreate(BaseModel):
    hcp_name: str
    interaction_type: Optional[str] = "Meeting"
    date: Optional[str] = ""
    time: Optional[str] = ""
    attendees: Optional[str] = ""
    topics_discussed: Optional[str] = ""
    materials_shared: Optional[str] = ""
    samples_distributed: Optional[str] = ""
    sentiment: Optional[str] = "Neutral"
    outcomes: Optional[str] = ""
    follow_up: Optional[str] = ""
    ai_summary: Optional[str] = ""


class InteractionUpdate(BaseModel):
    hcp_name: Optional[str] = None
    interaction_type: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    attendees: Optional[str] = None
    topics_discussed: Optional[str] = None
    materials_shared: Optional[str] = None
    samples_distributed: Optional[str] = None
    sentiment: Optional[str] = None
    outcomes: Optional[str] = None
    follow_up: Optional[str] = None


# ─────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────

@router.post("/agent/chat")
async def chat_with_agent(data: ChatRequest):
    """
    Chat endpoint: runs the LangGraph agent and returns
    structured interaction data extracted by the LLM.
    """
    try:
        result = run_agent(data.message)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/interactions")
def create_interaction(data: InteractionCreate, db: Session = Depends(get_db)):
    """Save a manually filled or AI-populated interaction to the database."""
    interaction = Interaction(
        hcp_name=data.hcp_name,
        interaction_type=data.interaction_type,
        date=data.date or datetime.date.today().isoformat(),
        time=data.time,
        attendees=data.attendees,
        topics_discussed=data.topics_discussed,
        materials_shared=data.materials_shared,
        samples_distributed=data.samples_distributed,
        sentiment=data.sentiment,
        outcomes=data.outcomes,
        follow_up=data.follow_up,
        ai_summary=data.ai_summary,
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return {"id": interaction.id, "message": "Interaction logged successfully"}


@router.get("/interactions")
def list_interactions(db: Session = Depends(get_db)):
    """Retrieve all logged interactions."""
    items = db.query(Interaction).order_by(Interaction.created_at.desc()).all()
    return [
        {
            "id": i.id,
            "hcp_name": i.hcp_name,
            "interaction_type": i.interaction_type,
            "date": i.date,
            "topics_discussed": i.topics_discussed,
            "sentiment": i.sentiment,
            "follow_up": i.follow_up,
            "created_at": str(i.created_at),
        }
        for i in items
    ]


@router.get("/interactions/{interaction_id}")
def get_interaction(interaction_id: int, db: Session = Depends(get_db)):
    """Retrieve a single interaction by ID."""
    item = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return item


@router.put("/interactions/{interaction_id}")
def edit_interaction_db(interaction_id: int, data: InteractionUpdate, db: Session = Depends(get_db)):
    """Edit an existing interaction (maps to the edit_interaction LangGraph tool)."""
    item = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Interaction not found")
    for field, value in data.dict(exclude_none=True).items():
        setattr(item, field, value)
    item.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(item)
    return {"message": "Interaction updated", "id": item.id}


@router.delete("/interactions/{interaction_id}")
def delete_interaction(interaction_id: int, db: Session = Depends(get_db)):
    """Delete an interaction record."""
    item = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Interaction not found")
    db.delete(item)
    db.commit()
    return {"message": "Deleted successfully"}
