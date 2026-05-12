from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.interaction_routes import router
from app.models.database import init_db

app = FastAPI(title="AI-First CRM – HCP Module", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create DB tables on startup (uses SQLite fallback if no DATABASE_URL set)
@app.on_event("startup")
def startup():
    init_db()

app.include_router(router)

@app.get("/")
def root():
    return {"status": "AI-CRM HCP Module API running"}
