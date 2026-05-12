# AI-First CRM – HCP Module (Log Interaction Screen)

A full-stack AI-powered CRM screen for pharmaceutical field representatives to log interactions with Healthcare Professionals (HCPs).

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18 + Redux Toolkit + Vite     |
| Backend   | Python FastAPI + Uvicorn            |
| AI Agent  | LangGraph + LangChain               |
| LLM       | Groq – `gemma2-9b-it`               |
| Database  | SQLite (default) / PostgreSQL / MySQL |
| Font      | Google Inter                        |

---

## LangGraph Agent – 5 Tools

| # | Tool Name          | Description |
|---|--------------------|-------------|
| 1 | `log_interaction`  | Extracts structured HCP interaction data (name, type, topics, sentiment, outcomes, follow-up) from free text using LLM |
| 2 | `edit_interaction` | Parses edit requests and returns only the fields to be updated |
| 3 | `summarize_meeting`| Generates a concise professional summary + key points from meeting notes |
| 4 | `recommend_hcp`    | Recommends next-best sales actions based on interaction context |
| 5 | `schedule_followup`| Creates a structured follow-up task with date, channel, and materials |

---

## Project Structure

```
ai-crm-hcp-module/
├── backend/
│   ├── .env                          # API keys & DB URL
│   ├── requirements.txt
│   └── app/
│       ├── main.py                   # FastAPI app entry point
│       ├── agents/
│       │   └── tools.py              # LangGraph graph + 5 tools
│       ├── models/
│       │   └── database.py           # SQLAlchemy models + DB setup
│       └── routes/
│           └── interaction_routes.py # API endpoints
├── frontend/
│   ├── index.html                    # Google Inter font loaded here
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── App.jsx                   # Root layout
│       ├── main.jsx
│       ├── components/
│       │   ├── InteractionForm.jsx   # Editable structured form
│       │   └── ChatAssistant.jsx     # AI chat interface
│       ├── redux/
│       │   ├── store.js
│       │   └── interactionSlice.js   # All interaction state
│       └── services/
│           └── api.js                # Axios instance
└── README.md
```

---

## Setup & Running

### 1. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Edit .env – set GROQ_API_KEY and optionally DATABASE_URL
# Default: uses SQLite (crm.db) – no DB setup needed

# Run the API server
uvicorn app.main:app --reload --port 8000
```

API will be live at: http://localhost:8000

### 2. Frontend

```bash
cd frontend

npm install
npm run dev
```

App will open at: http://localhost:5173

---

## API Endpoints

| Method | Endpoint                     | Description                        |
|--------|------------------------------|------------------------------------|
| POST   | `/agent/chat`                | Run LangGraph agent with user text |
| POST   | `/interactions`              | Save interaction to DB             |
| GET    | `/interactions`              | List all interactions              |
| GET    | `/interactions/{id}`         | Get single interaction             |
| PUT    | `/interactions/{id}`         | Edit interaction                   |
| DELETE | `/interactions/{id}`         | Delete interaction                 |

---

## Database

- **Default**: SQLite (`crm.db` auto-created in backend folder) – no setup needed.
- **PostgreSQL**: Set `DATABASE_URL=postgresql://user:pass@localhost:5432/crm_db` in `.env`
- **MySQL**: Set `DATABASE_URL=mysql+pymysql://user:pass@localhost:3306/crm_db` in `.env`

---

## Features

- **Dual input mode**: Fill the structured form manually **OR** describe the interaction in the AI chat
- **AI auto-fill**: Chat extracts HCP name, type, topics, sentiment, outcomes, follow-up into the form
- **LangGraph agent**: Real tool-calling graph with 5 pharma-specific tools
- **Live LLM**: Groq `gemma2-9b-it` processes all natural language
- **Persistent storage**: All interactions saved to DB with full CRUD
- **Google Inter font** throughout
